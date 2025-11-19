import { NextResponse } from 'next/server'
import { shiprocketClient } from '@/lib/shiprocket'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('per_page') || '100', 10)
    const orderId = searchParams.get('order_id')
    const status = searchParams.get('status')

    const filters: {
      order_id?: string
      status?: string
    } = {}

    if (orderId) {
      filters.order_id = orderId
    }
    if (status) {
      filters.status = status
    }

    const orders = await shiprocketClient.getOrders(page, perPage, filters)

    return NextResponse.json({
      success: true,
      page,
      per_page: perPage,
      data: orders,
      message: 'Orders fetched from Shiprocket successfully',
    })
  } catch (error: any) {
    console.error('Shiprocket get orders error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to get orders from Shiprocket' 
      },
      { status: 500 }
    )
  }
}

