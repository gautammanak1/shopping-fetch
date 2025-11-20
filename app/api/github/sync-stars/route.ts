import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'gautammanak1'
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'package-download-stat'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export async function POST(request: Request) {
  try {
    const suppressLogs = request.headers.get('x-suppress-logs') === 'true'
    
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      )
    }

    const githubUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/stargazers`
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3.star+json',
      'User-Agent': 'Shopping-Fetch-App',
    }
    
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`
    }

    let allStargazers: any[] = []
    let page = 1
    const perPage = 100
    let hasError = false
    let errorMessage = ''

    while (true) {
      try {
        const response = await fetch(`${githubUrl}?page=${page}&per_page=${perPage}`, { 
          headers,
          cache: 'no-store'
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          hasError = true
          errorMessage = `GitHub API error: ${response.status} - ${errorText}`
          if (!suppressLogs) {
            console.error(errorMessage)
          }
          
          if (response.status === 404) {
            return NextResponse.json({
              success: false,
              error: `Repository not found: ${REPO_OWNER}/${REPO_NAME}`,
              message: 'Please check REPO_OWNER and REPO_NAME environment variables',
            }, { status: 404 })
          }
          
          if (response.status === 401 || response.status === 403) {
            return NextResponse.json({
              success: false,
              error: 'GitHub authentication failed',
              message: 'Please check GITHUB_TOKEN environment variable',
            }, { status: 401 })
          }
          
          break
        }

        const stargazers = await response.json()
        
        if (!Array.isArray(stargazers)) {
          hasError = true
          errorMessage = `Invalid response format: ${JSON.stringify(stargazers).substring(0, 200)}`
          if (!suppressLogs) {
            console.error(errorMessage)
          }
          break
        }
        
        if (stargazers.length === 0) {
          if (page === 1) {
            return NextResponse.json({
              success: true,
              message: 'No stargazers found',
              synced: 0,
              total_stargazers: 0,
              repo: `${REPO_OWNER}/${REPO_NAME}`,
              debug: {
                page,
                response_type: Array.isArray(stargazers) ? 'array' : typeof stargazers,
                response_sample: JSON.stringify(stargazers).substring(0, 200),
                headers_used: headers,
              },
            })
          }
          break
        }
        
        if (!suppressLogs && page === 1) {
          console.log(`Found ${stargazers.length} stargazers on page ${page}`, {
            first_stargazer: stargazers[0] ? {
              has_user: !!stargazers[0].user,
              username: stargazers[0].user?.login,
              starred_at: stargazers[0].starred_at,
            } : null,
          })
        }

        allStargazers = allStargazers.concat(stargazers)
        
        if (stargazers.length < perPage) {
          break
        }

        page++
      } catch (error: any) {
        hasError = true
        errorMessage = `Error fetching stargazers: ${error.message}`
        if (!suppressLogs) {
          console.error(errorMessage)
        }
        break
      }
    }
    
    if (hasError && allStargazers.length === 0) {
      return NextResponse.json({
        success: false,
        error: errorMessage,
        repo: `${REPO_OWNER}/${REPO_NAME}`,
        message: 'Failed to fetch stargazers from GitHub',
      }, { status: 500 })
    }

    if (allStargazers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stargazers found',
        synced: 0,
        total_stargazers: 0,
      })
    }

    const { data: existingUsers, error: fetchError } = await supabase
      .from('verified_github_users')
      .select('github_username, verified_at')

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch existing users', details: fetchError.message },
        { status: 500 }
      )
    }

    const existingUsernames = new Map(
      (existingUsers || []).map((u: any) => [u.github_username.toLowerCase(), u.verified_at])
    )

    let newUsers = 0
    let updatedUsers = 0
    const errors: string[] = []

    for (const stargazer of allStargazers) {
      const username = stargazer.user?.login?.toLowerCase() || stargazer.login?.toLowerCase()
      if (!username) {
        if (!suppressLogs) {
          console.warn('Skipping stargazer without username:', JSON.stringify(stargazer).substring(0, 100))
        }
        continue
      }

      const starredAt = stargazer.starred_at || stargazer.starredAt || new Date().toISOString()
      const existingVerifiedAt = existingUsernames.get(username)

      if (existingVerifiedAt !== undefined) {
        if (existingVerifiedAt !== starredAt) {
          try {
            const { error: updateError } = await supabase
              .from('verified_github_users')
              .update({ verified_at: starredAt })
              .eq('github_username', username)

            if (updateError) {
              errors.push(`${username}: ${updateError.message}`)
            } else {
              updatedUsers++
              existingUsernames.set(username, starredAt)
            }
          } catch (e: any) {
            errors.push(`${username}: ${e.message}`)
          }
        }
        continue
      }

      try {
        const { error: insertError } = await supabase
          .from('verified_github_users')
          .insert({
            github_username: username,
            user_email: null,
            repo_owner: REPO_OWNER,
            repo_name: REPO_NAME,
            verified_at: starredAt,
          })

        if (insertError) {
          if (insertError.code === '23505') {
            const { error: updateError } = await supabase
              .from('verified_github_users')
              .update({ verified_at: starredAt })
              .eq('github_username', username)
            
            if (!updateError) {
              updatedUsers++
            }
          } else {
            errors.push(`${username}: ${insertError.message}`)
          }
        } else {
          newUsers++
          existingUsernames.set(username, starredAt)
        }
      } catch (e: any) {
        errors.push(`${username}: ${e.message}`)
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Stars synced successfully',
      total_stargazers: allStargazers.length,
      new_users: newUsers,
      updated_users: updatedUsers,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    })
    
    if (suppressLogs) {
      response.headers.set('x-silent', 'true')
    }
    
    return response
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { data: verifiedUsers, error } = await supabase
      .from('verified_github_users')
      .select('github_username, verified_at')
      .order('verified_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch verified users', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      total_verified: verifiedUsers?.length || 0,
      recent_users: verifiedUsers || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

