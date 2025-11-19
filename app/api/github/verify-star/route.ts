import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'gautammanak1'
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'package-download-stat'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export async function POST(request: Request) {
  try {
    const { github_username, user_email } = await request.json()

    if (!github_username) {
      return NextResponse.json(
        { error: 'github_username is required' },
        { status: 400 }
      )
    }

    const username = github_username.toLowerCase().replace('@', '')

    const { data: existingUser } = await supabase
      .from('verified_github_users')
      .select('*')
      .eq('github_username', username)
      .single()

    if (existingUser) {
      return NextResponse.json({
        verified: true,
        already_verified: true,
        github_username: username,
        verified_at: existingUser.verified_at,
        message: 'User already verified',
      })
    }

    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      )
    }

    const githubUrl = `https://api.github.com/users/${username}/starred`
    const headers = {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
    }

    try {
      const githubResponse = await fetch(githubUrl, { headers })
      
      if (githubResponse.status === 404) {
        return NextResponse.json({
          verified: false,
          message: 'GitHub user not found',
        })
      }

      if (!githubResponse.ok) {
        console.error('GitHub API error:', githubResponse.status, githubResponse.statusText)
        return NextResponse.json({
          verified: false,
          message: 'Failed to verify star status',
        })
      }

      const starredRepos = await githubResponse.json()
      const hasStarred = starredRepos.some(
        (repo: any) => 
          repo.owner?.login?.toLowerCase() === REPO_OWNER.toLowerCase() &&
          repo.name?.toLowerCase() === REPO_NAME.toLowerCase()
      )

      if (hasStarred) {
        const { data, error } = await supabase
          .from('verified_github_users')
          .insert({
            github_username: username,
            user_email: user_email?.toLowerCase() || null,
            repo_owner: REPO_OWNER,
            repo_name: REPO_NAME,
            verified_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error('Supabase insert error:', error)
          return NextResponse.json({
            verified: true,
            github_username: username,
            message: 'Star verified but failed to store in database',
            warning: error.message,
          })
        }

        return NextResponse.json({
          verified: true,
          github_username: username,
          verified_at: data.verified_at,
          message: 'Star verified and stored successfully',
        })
      } else {
        return NextResponse.json({
          verified: false,
          message: `User has not starred ${REPO_OWNER}/${REPO_NAME}`,
        })
      }
    } catch (fetchError: any) {
      console.error('GitHub API fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to verify star status', details: fetchError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Verify star error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const github_username = searchParams.get('github_username')

    if (!github_username) {
      return NextResponse.json(
        { error: 'github_username query parameter is required' },
        { status: 400 }
      )
    }

    const username = github_username.toLowerCase().replace('@', '')

    const { data, error } = await supabase
      .from('verified_github_users')
      .select('*')
      .eq('github_username', username)
      .single()

    if (error || !data) {
      return NextResponse.json({
        verified: false,
        github_username: username,
      })
    }

    return NextResponse.json({
      verified: true,
      github_username: data.github_username,
      verified_at: data.verified_at,
      user_email: data.user_email,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

