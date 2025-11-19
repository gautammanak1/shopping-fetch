import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { 
      order_id, 
      payment_reference, 
      payment_status, 
      payment_currency 
    } = await request.json()

    if (!order_id || !payment_reference || !payment_status) {
      return NextResponse.json(
        { error: 'order_id, payment_reference, and payment_status are required' },
        { status: 400 }
      )
    }

    if (!['pending', 'paid', 'failed'].includes(payment_status)) {
      return NextResponse.json(
        { error: 'Invalid payment_status. Use pending, paid, or failed.' },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const updateData: any = {
      payment_status,
      payment_reference,
      updated_at: new Date().toISOString(),
    }

    if (payment_status === 'paid') {
      updateData.status = 'confirmed'
    }

    let updatedOrder, updateError
    if (payment_currency) {
      ;({ data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ ...updateData, payment_currency })
        .eq('id', order_id)
        .select()
        .single())
    }

    if (updateError || !updatedOrder) {
      ;({ data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order_id)
        .select()
        .single())
    }

    if (updateError || !updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to update payment status', details: updateError?.message || 'Unknown error' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Payment status updated to ${payment_status}`,
      order: updatedOrder,
      payment_status,
      payment_reference,
      payment_currency: payment_currency || null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const order_id = searchParams.get('order_id')

    if (!order_id) {
      return NextResponse.json(
        { error: 'order_id query parameter is required' },
        { status: 400 }
      )
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, payment_status, payment_reference, payment_currency, status, created_at, updated_at')
      .eq('id', order_id)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      order_id: order.id,
      payment_status: order.payment_status || 'pending',
      payment_reference: order.payment_reference || null,
      payment_currency: order.payment_currency || null,
      order_status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
