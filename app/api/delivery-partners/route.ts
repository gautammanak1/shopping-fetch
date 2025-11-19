import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface DeliveryPartner {
  id: string
  name: string
  email: string
  phone: string
  location: string
  service_type: 'standard' | 'express' | 'same_day'
  active: boolean
  assigned_orders_count: number
  rating?: number
  created_at: string
  updated_at: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'
    const location = searchParams.get('location')

    let query = supabase
      .from('delivery_partners')
      .select('*')
      .order('assigned_orders_count', { ascending: true })

    if (activeOnly) {
      query = query.eq('active', true)
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch delivery partners' },
        { status: 500 }
      )
    }

    return NextResponse.json({ delivery_partners: data || [] })
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
    const { name, email, phone, location, service_type = 'standard', rating } = body

    if (!name || !email || !phone || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, location' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('delivery_partners')
      .insert([
        {
          name,
          email,
          phone,
          location,
          service_type: service_type || 'standard',
          active: true,
          assigned_orders_count: 0,
          rating: rating || 5.0,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create delivery partner' },
        { status: 500 }
      )
    }

    return NextResponse.json({ delivery_partner: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

