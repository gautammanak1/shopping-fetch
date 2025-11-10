import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch dealers' },
        { status: 500 }
      )
    }

    return NextResponse.json({ dealers: data || [] })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, location } = body

    if (!name || !email || !phone || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, location' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('dealers')
      .insert([
        {
          name,
          email,
          phone,
          location,
          active: true,
          assigned_orders_count: 0,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create dealer' },
        { status: 500 }
      )
    }

    return NextResponse.json({ dealer: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

