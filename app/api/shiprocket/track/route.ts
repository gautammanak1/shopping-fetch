import { NextResponse } from 'next/server'
import { shiprocketClient } from '@/lib/shiprocket'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipment_id')
    const awb = searchParams.get('awb')

    if (!shipmentId && !awb) {
      return NextResponse.json(
        { error: 'Either shipment_id or awb is required' },
        { status: 400 }
      )
    }

    let trackingData

    if (awb) {
      trackingData = await shiprocketClient.trackByAWB(awb)
    } else if (shipmentId) {
      trackingData = await shiprocketClient.trackOrder(Number(shipmentId))
    }

    return NextResponse.json({
      tracking: trackingData,
      status: trackingData?.tracking_data?.shipment_status || 'unknown',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to track shipment' },
      { status: 500 }
    )
  }
}

