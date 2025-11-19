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
    const headers = {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3.star+json',
    }

    let allStargazers: any[] = []
    let page = 1
    const perPage = 100

    while (true) {
      try {
        const response = await fetch(`${githubUrl}?page=${page}&per_page=${perPage}`, { headers })
        
        if (!response.ok) {
          break
        }

        const stargazers = await response.json()
        
        if (!stargazers || stargazers.length === 0) {
          break
        }

        allStargazers = allStargazers.concat(stargazers)
        
        if (stargazers.length < perPage) {
          break
        }

        page++
      } catch (error: any) {
        break
      }
    }

    if (allStargazers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stargazers found',
        synced: 0,
        total_stargazers: 0,
      })
    }

    const { data: existingUsers } = await supabase
      .from('verified_github_users')
      .select('github_username')

    const existingUsernames = new Set(
      (existingUsers || []).map((u: any) => u.github_username.toLowerCase())
    )

    let newUsers = 0
    let updatedUsers = 0
    const errors: string[] = []

    for (const stargazer of allStargazers) {
      const username = stargazer.user?.login?.toLowerCase()
      if (!username) continue

      const starredAt = stargazer.starred_at || new Date().toISOString()

      if (existingUsernames.has(username)) {
        try {
          const { data: existingUser } = await supabase
            .from('verified_github_users')
            .select('verified_at')
            .eq('github_username', username)
            .single()

          if (existingUser && existingUser.verified_at !== starredAt) {
            const { error: updateError } = await supabase
              .from('verified_github_users')
              .update({ verified_at: starredAt })
              .eq('github_username', username)

            if (!updateError) {
              updatedUsers++
            }
          }
        } catch (e) {
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
          if (insertError.code !== '23505') {
            errors.push(`${username}: ${insertError.message}`)
          }
        } else {
          newUsers++
          existingUsernames.add(username)
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
      errors: errors.length > 0 ? errors : undefined,
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

