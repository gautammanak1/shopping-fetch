import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  try {
    const response = await fetch(`${baseUrl}/api/github/sync-stars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const result = await response.json()
    
    return NextResponse.json({
      success: response.ok,
      ...result,
      triggered_at: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

