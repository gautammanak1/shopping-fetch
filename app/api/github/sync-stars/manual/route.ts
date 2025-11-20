import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'gautammanak1'
  const repoName = process.env.GITHUB_REPO_NAME || 'package-download-stat'
  const hasToken = !!process.env.GITHUB_TOKEN
  
  try {
    const response = await fetch(`${baseUrl}/api/github/sync-stars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    const result = await response.json()
    
    return NextResponse.json({
      success: response.ok,
      ...result,
      triggered_at: new Date().toISOString(),
      config: {
        repo: `${repoOwner}/${repoName}`,
        has_token: hasToken,
        base_url: baseUrl,
      },
      response_status: response.status,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      config: {
        repo: `${repoOwner}/${repoName}`,
        has_token: hasToken,
        base_url: baseUrl,
      },
    }, { status: 500 })
  }
}

