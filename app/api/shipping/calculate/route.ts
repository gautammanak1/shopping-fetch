import { NextResponse } from 'next/server'

interface ShippingCalculation {
  shipping_cost: number
  estimated_days: number
  service_type: string
  partner_name?: string
}

export async function POST(request: Request) {
  try {
    const { shipping_address, product_weight = 0.2, service_type = 'standard' } = await request.json()

    if (!shipping_address) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      )
    }

    const baseCost = 5.0
    const serviceMultipliers = {
      standard: 1.0,
      express: 1.5,
      same_day: 2.5,
    }

    const weightCost = product_weight * 2
    const shippingCost = (baseCost + weightCost) * (serviceMultipliers[service_type as keyof typeof serviceMultipliers] || 1.0)

    const estimatedDays = {
      standard: 5,
      express: 2,
      same_day: 1,
    }

    const calculation: ShippingCalculation = {
      shipping_cost: Math.round(shippingCost * 100) / 100,
      estimated_days: estimatedDays[service_type as keyof typeof estimatedDays] || 5,
      service_type,
    }

    return NextResponse.json({ calculation })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

