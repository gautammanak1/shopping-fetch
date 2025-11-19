import { NextResponse } from 'next/server'
import { shiprocketClient } from '@/lib/shiprocket'

export async function POST(request: Request) {
  try {
    const { pickup_pincode, delivery_pincode, weight = 0.2 } = await request.json()

    if (!pickup_pincode || !delivery_pincode) {
      return NextResponse.json(
        { error: 'Pickup and delivery pincodes are required' },
        { status: 400 }
      )
    }

    const rates = await shiprocketClient.getShippingRates(
      pickup_pincode,
      delivery_pincode,
      weight
    )

    return NextResponse.json({ rates })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get shipping rates' },
      { status: 500 }
    )
  }
}

