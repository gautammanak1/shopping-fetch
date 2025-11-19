import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { data: ordersToFix, error: fetchError } = await supabase
      .from('orders')
      .select('id, payment_status, payment_reference, status')
      .eq('payment_status', 'paid')
      .eq('status', 'pending')

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: fetchError },
        { status: 500 }
      )
    }

    if (!ordersToFix || ordersToFix.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders need fixing',
        fixed_count: 0,
      })
    }

    const orderIds = ordersToFix.map(o => o.id)
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .in('id', orderIds)
      .select('id, payment_status, status')

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update orders', details: updateError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updatedOrders?.length || 0} orders`,
      fixed_count: updatedOrders?.length || 0,
      orders: updatedOrders,
    })
  } catch (error: any) {
    console.error('Fix payment status error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { data: ordersToFix, error } = await supabase
      .from('orders')
      .select('id, payment_status, payment_reference, status, created_at')
      .eq('payment_status', 'paid')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      count: ordersToFix?.length || 0,
      orders: ordersToFix || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

