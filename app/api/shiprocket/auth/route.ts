import { NextResponse } from 'next/server'

/**
 * Shiprocket Authentication
 * Gets access token from Shiprocket API
 */
export async function POST(request: Request) {
  try {
    const email = process.env.SHIPROCKET_EMAIL
    const password = process.env.SHIPROCKET_PASSWORD

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Shiprocket credentials not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || 'Shiprocket authentication failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      token: data.token,
      expires_at: data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to authenticate with Shiprocket' },
      { status: 500 }
    )
  }
}

