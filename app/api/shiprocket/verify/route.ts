import { NextResponse } from 'next/server'
import { shiprocketClient } from '@/lib/shiprocket'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')
    const shipmentId = searchParams.get('shipment_id')

    if (!orderId && !shipmentId) {
      return NextResponse.json(
        { error: 'Either order_id or shipment_id is required' },
        { status: 400 }
      )
    }

    let result

    if (orderId) {
      try {
        result = await shiprocketClient.getOrderByOrderId(orderId)
        return NextResponse.json({
          success: true,
          found: true,
          type: 'order',
          data: result,
          message: `Order ${orderId} found in Shiprocket`,
        })
      } catch (error: any) {
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          return NextResponse.json({
            success: true,
            found: false,
            type: 'order',
            message: `Order ${orderId} not found in Shiprocket`,
          })
        }
        throw error
      }
    }

    if (shipmentId) {
      try {
        const shipmentIdNum = parseInt(shipmentId, 10)
        if (isNaN(shipmentIdNum)) {
          return NextResponse.json(
            { error: 'shipment_id must be a number' },
            { status: 400 }
          )
        }
        result = await shiprocketClient.getShipment(shipmentIdNum)
        return NextResponse.json({
          success: true,
          found: true,
          type: 'shipment',
          data: result,
          message: `Shipment ${shipmentId} found in Shiprocket`,
        })
      } catch (error: any) {
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          return NextResponse.json({
            success: true,
            found: false,
            type: 'shipment',
            message: `Shipment ${shipmentId} not found in Shiprocket`,
          })
        }
        throw error
      }
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Shiprocket verify error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to verify order in Shiprocket' 
      },
      { status: 500 }
    )
  }
}

