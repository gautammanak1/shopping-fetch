import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DISCOUNT_PER_STAR = 5
const MAX_DISCOUNT = 100
const MIN_STARS_FOR_DISCOUNT = 1

export async function POST(request: Request) {
  try {
    const { github_username, user_email, original_amount } = await request.json()

    if (!original_amount || original_amount <= 0) {
      return NextResponse.json(
        { error: 'original_amount is required and must be greater than 0' },
        { status: 400 }
      )
    }

    let discount_percentage = 0
    let discount_amount = 0
    let final_amount = original_amount
    let github_verified = false

    if (github_username) {
      const username = github_username.toLowerCase().replace('@', '')
      
      const { data: verifiedUser } = await supabase
        .from('verified_github_users')
        .select('*')
        .eq('github_username', username)
        .single()

      if (verifiedUser) {
        github_verified = true
        discount_percentage = DISCOUNT_PER_STAR * MIN_STARS_FOR_DISCOUNT
        discount_percentage = Math.min(discount_percentage, MAX_DISCOUNT)
        
        discount_amount = (original_amount * discount_percentage) / 100
        final_amount = Math.max(0, original_amount - discount_amount)
      } else {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
          const verifyResponse = await fetch(`${baseUrl}/api/github/verify-star`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              github_username: username,
              user_email: user_email,
            }),
          })

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json()
            if (verifyData.verified) {
              github_verified = true
              discount_percentage = DISCOUNT_PER_STAR * MIN_STARS_FOR_DISCOUNT
              discount_percentage = Math.min(discount_percentage, MAX_DISCOUNT)
              
              discount_amount = (original_amount * discount_percentage) / 100
              final_amount = Math.max(0, original_amount - discount_amount)
            }
          }
        } catch (verifyError) {
          console.error('GitHub verification error:', verifyError)
        }
      }
    }

    if (!github_verified && user_email) {
      const { data: verifiedUser } = await supabase
        .from('verified_github_users')
        .select('*')
        .eq('user_email', user_email.toLowerCase())
        .single()

      if (verifiedUser) {
        github_verified = true
        discount_percentage = DISCOUNT_PER_STAR * MIN_STARS_FOR_DISCOUNT
        discount_percentage = Math.min(discount_percentage, MAX_DISCOUNT)
        
        discount_amount = (original_amount * discount_percentage) / 100
        final_amount = Math.max(0, original_amount - discount_amount)
      }
    }

    return NextResponse.json({
      original_amount: parseFloat(original_amount.toFixed(2)),
      discount_percentage,
      discount_amount: parseFloat(discount_amount.toFixed(2)),
      final_amount: parseFloat(final_amount.toFixed(2)),
      github_verified,
      github_username: github_verified ? (github_username?.toLowerCase() || null) : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

