import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'gautammanak1'
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'package-download-stat'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export async function GET() {
  const githubUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`
  const stargazersUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/stargazers`
  
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3.star+json',
    'User-Agent': 'Shopping-Fetch-App',
  }
  
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`
  }

  try {
    const repoResponse = await fetch(githubUrl, { 
      headers: { ...headers, 'Accept': 'application/vnd.github.v3+json' }
    })
    const repoData = await repoResponse.ok ? await repoResponse.json() : null
    
    const starsResponse = await fetch(`${stargazersUrl}?per_page=1`, { headers })
    const starsData = starsResponse.ok ? await starsResponse.json() : null
    
    return NextResponse.json({
      config: {
        repo_owner: REPO_OWNER,
        repo_name: REPO_NAME,
        has_token: !!GITHUB_TOKEN,
        token_length: GITHUB_TOKEN?.length || 0,
      },
      repo_info: repoData ? {
        name: repoData.name,
        full_name: repoData.full_name,
        stargazers_count: repoData.stargazers_count,
        private: repoData.private,
      } : null,
      stargazers_test: {
        status: starsResponse.status,
        ok: starsResponse.ok,
        count: Array.isArray(starsData) ? starsData.length : 0,
        first_stargazer: Array.isArray(starsData) && starsData.length > 0 ? {
          username: starsData[0].user?.login,
          starred_at: starsData[0].starred_at,
          full_object: starsData[0],
        } : null,
        error: !starsResponse.ok ? await starsResponse.text() : null,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      config: {
        repo_owner: REPO_OWNER,
        repo_name: REPO_NAME,
        has_token: !!GITHUB_TOKEN,
      },
    }, { status: 500 })
  }
}

