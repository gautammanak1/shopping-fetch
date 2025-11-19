import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { shiprocketClient } from '@/lib/shiprocket'
import { SHIPROCKET_CONFIG } from '@/config/shiprocket.config'

function generateTrackingNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TRK-${timestamp}-${random}`
}

function extractPincode(address: string): string {
  const pincodeMatch = address.match(/\b\d{6}\b/)
  return pincodeMatch ? pincodeMatch[0] : '110001'
}

export async function POST(request: Request) {
  try {
    const { 
      product_id, 
      size, 
      quantity = 1,
      user_name,
      user_email,
      user_phone,
      shipping_address,
      payment_status = 'pending',
      payment_reference = null,
      payment_currency = 'FET',
      github_username = null
    } = await request.json()

    if (!product_id || !size) {
      return NextResponse.json(
        { error: 'Product ID and size are required' },
        { status: 400 }
      )
    }

    if (!user_name || !user_email || !user_phone || !shipping_address) {
      return NextResponse.json(
        { error: 'User details are required: name, email, phone, and shipping address' },
        { status: 400 }
      )
    }

    if (!['pending', 'paid', 'failed'].includes(payment_status)) {
      return NextResponse.json(
        { error: 'Invalid payment status. Use pending, paid, or failed.' },
        { status: 400 }
      )
    }

    if (payment_status === 'paid' && !payment_reference) {
      return NextResponse.json(
        { error: 'Payment reference is required when payment_status is "paid". Payment must be verified before order confirmation.' },
        { status: 400 }
      )
    }

    if (payment_currency && !['FET', 'USDC'].includes(payment_currency)) {
      return NextResponse.json(
        { error: 'Invalid payment currency. Use FET or USDC.' },
        { status: 400 }
      )
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const availableStock = product.stock[size] || 0
    if (availableStock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${availableStock} available in size ${size}` },
        { status: 400 }
      )
    }

    const originalAmount = product.price * quantity

    let discountPercentage = 0
    let discountAmount = 0
    let finalAmount = originalAmount
    let githubVerified = false

    if (github_username || user_email) {
      try {
        const discountResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/discount/calculate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              github_username,
              user_email,
              original_amount: originalAmount,
            }),
          }
        )

        if (discountResponse.ok) {
          const discountData = await discountResponse.json()
          discountPercentage = discountData.discount_percentage || 0
          discountAmount = discountData.discount_amount || 0
          finalAmount = discountData.final_amount || originalAmount
          githubVerified = discountData.github_verified || false
        }
      } catch (error) {
        console.error('Discount calculation error:', error)
      }
    }

    const paymentConfirmed = payment_status === 'paid'

    const { data: deliveryPartners } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('active', true)
      .order('assigned_orders_count', { ascending: true })
      .limit(1)

    const deliveryPartnerId = deliveryPartners && deliveryPartners.length > 0 ? deliveryPartners[0].id : null

    const normalizedAddress =
      typeof shipping_address === 'string' && shipping_address.trim().length > 0
        ? shipping_address.trim()
        : ''
    const shippingAddress = normalizedAddress || ''

    const requestOrigin = (() => {
      try {
        return new URL(request.url).origin
      } catch {
        return undefined
      }
    })()
    const envOrigin =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
    const baseOrigin = requestOrigin || envOrigin

    let shippingData: any = null
    if (baseOrigin) {
      try {
        const shippingResponse = await fetch(`${baseOrigin}/api/shipping/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shipping_address: shippingAddress,
            service_type: 'standard',
          }),
        })
        shippingData = shippingResponse.ok ? await shippingResponse.json() : null
      } catch {
      }
    }
    const shippingCost = shippingData?.calculation?.shipping_cost ?? 5.0
    const estimatedDays = shippingData?.calculation?.estimated_days ?? 5
    
    const estimatedDeliveryDate = new Date()
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estimatedDays)

    const trackingNumber = generateTrackingNumber()

    const orderStatus = paymentConfirmed ? 'confirmed' : 'pending'

    const baseInsert: any = {
      product_id,
      size,
      quantity,
      status: orderStatus,
      user_name,
      user_email,
      user_phone,
      shipping_address: normalizedAddress,
      tracking_number: trackingNumber,
      delivery_partner_id: deliveryPartnerId,
      shipping_cost: shippingCost,
      estimated_delivery_date: estimatedDeliveryDate.toISOString().split('T')[0],
      service_type: 'standard',
      original_amount: originalAmount,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      github_username: github_username?.toLowerCase() || null,
      github_verified: githubVerified,
    }

    const tryInsert = async (payload: any) =>
      await supabase
        .from('orders')
        .insert([payload])
        .select()
        .single()

    let order,
      orderError

    ;({ data: order, error: orderError } = await tryInsert({
      ...baseInsert,
      payment_status,
      payment_reference,
      payment_currency: payment_currency || 'FET',
    }))
    
    if (orderError && orderError.code === '42703') {
      ;({ data: order, error: orderError } = await tryInsert({
        ...baseInsert,
        payment_status,
        payment_reference,
      }))
    }

    if (orderError || !order) {
      ;({ data: order, error: orderError } = await tryInsert({
        ...baseInsert,
      }))
    }

    if (orderError || !order) {
      const minimalInsert: any = {
        product_id,
        size,
        quantity,
        status: orderStatus,
        user_name,
        user_email,
        user_phone,
        shipping_address: normalizedAddress,
        tracking_number: trackingNumber,
      }
      ;({ data: order, error: orderError } = await tryInsert(minimalInsert))

      if (order && (deliveryPartnerId || shippingCost || estimatedDeliveryDate)) {
        await supabase
          .from('orders')
          .update({
            delivery_partner_id: deliveryPartnerId ?? null,
            shipping_cost: shippingCost ?? null,
            estimated_delivery_date: estimatedDeliveryDate.toISOString().split('T')[0],
            service_type: 'standard',
          })
          .eq('id', order.id)
      }
    }

    if (orderError || !order) {
      const message = (orderError as any)?.message || 'Failed to create order'
      const details = (orderError as any)?.details || null
      return NextResponse.json(
        { error: message, details },
        { status: 400 }
      )
    }

    let shiprocketOrderId: number | null = null
    let shiprocketShipmentId: number | null = null
    let awbNumber: string | null = null

    if (paymentConfirmed) {
      try {
        const deliveryPincode = extractPincode(normalizedAddress)
        const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || SHIPROCKET_CONFIG.PICKUP_PINCODE
        const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || SHIPROCKET_CONFIG.PICKUP_LOCATION
        
        const addressParts = normalizedAddress
          ? normalizedAddress.split(',').map((p: string) => p.trim()).filter((p: string) => p)
          : []
        const pincodeIndex = addressParts.findIndex((p: string) => /^\d{6}$/.test(p))
        
        let billingCity = 'Noida'
        let billingState = 'Uttar Pradesh'
        let billingAddress = normalizedAddress
        
        if (addressParts.length >= 3) {
          if (pincodeIndex >= 0) {
            const beforePincode = addressParts.slice(0, pincodeIndex)
            
            if (beforePincode.length >= 2) {
              billingState = beforePincode[beforePincode.length - 1] || 'Uttar Pradesh'
              billingCity = beforePincode[beforePincode.length - 2] || 'Noida'
              billingAddress = beforePincode.slice(0, -2).join(', ') || beforePincode[0] || shipping_address
            } else if (beforePincode.length === 1) {
              billingCity = beforePincode[0] || 'Noida'
              billingAddress = beforePincode[0] || shipping_address
            }
          } else {
            if (addressParts.length >= 2) {
              billingState = addressParts[addressParts.length - 1] || 'Uttar Pradesh'
              billingCity = addressParts[addressParts.length - 2] || 'Noida'
              billingAddress = addressParts.slice(0, -2).join(', ') || addressParts[0] || shipping_address
            }
          }
        }
        
        if (!billingAddress || billingAddress.length < 10) {
          billingAddress = normalizedAddress
          billingAddress = normalizedAddress
        }
        
        const nameParts = user_name.trim().split(/\s+/)
        const billingFirstName = nameParts[0] || user_name
        const billingLastName = nameParts.slice(1).join(' ') || ''
        
        const orderItems = [{
          name: product.name,
          sku: `${product.id}-${size}`,
          units: quantity,
          selling_price: product.price,
        }]

        let pickupLocationName = 'Home'
        if (pickupLocation && !pickupLocation.includes(',') && pickupLocation !== 'Primary') {
          pickupLocationName = pickupLocation
        }
        
        const shiprocketOrderData = {
          order_id: order.id,
          order_date: new Date().toISOString().split('T')[0],
          pickup_location: pickupLocationName,
          billing_customer_name: billingFirstName,
          billing_last_name: billingLastName,
          billing_address: billingAddress,
          billing_address_2: '',
          billing_city: billingCity,
          billing_pincode: deliveryPincode,
          billing_state: billingState,
          billing_country: 'India',
          billing_email: user_email,
          billing_phone: user_phone.replace(/[\s\-\(\)\+]/g, '').replace(/^91/, ''),
          shipping_is_billing: true,
          shipping_customer_name: billingFirstName,
          shipping_last_name: billingLastName,
          shipping_address: billingAddress,
          shipping_address_2: '',
          shipping_city: billingCity,
          shipping_pincode: deliveryPincode,
          shipping_state: billingState,
          shipping_country: 'India',
          shipping_email: user_email,
          shipping_phone: user_phone.replace(/[\s\-\(\)\+]/g, '').replace(/^91/, ''),
          order_items: orderItems,
          payment_method: 'Prepaid' as const,
          sub_total: Number(finalAmount.toFixed(2)),
          length: 15,
          breadth: 10,
          height: 2,
          weight: 0.2,
        }

        console.log('Shiprocket order payload:', JSON.stringify(shiprocketOrderData, null, 2))

        const shiprocketOrder = await shiprocketClient.createOrder(shiprocketOrderData)

        console.log('✅ Shiprocket order created successfully!')
        console.log('📦 Shiprocket Response:', JSON.stringify(shiprocketOrder, null, 2))
        
        shiprocketOrderId = shiprocketOrder.order_id
        shiprocketShipmentId = shiprocketOrder.shipment_id
        
        if (shiprocketOrderId) {
          console.log(`🔗 View in Shiprocket Dashboard: https://app.shiprocket.in/orders/${shiprocketOrderId}`)
        } else {
          console.warn('⚠️ Shiprocket order_id not found in response')
        }

        if (shiprocketShipmentId) {
          try {
            const awbResponse = await shiprocketClient.assignAWB(shiprocketShipmentId)
            awbNumber = awbResponse?.awb_code || awbResponse?.data?.awb_code || null
            console.log('✅ AWB assigned:', awbNumber)
          } catch (awbError) {
            console.error('⚠️ Failed to assign AWB:', awbError)
          }
        }

        await supabase
          .from('orders')
          .update({
            awb_number: awbNumber,
            shiprocket_order_id: shiprocketOrderId ? String(shiprocketOrderId) : null,
            shiprocket_shipment_id: shiprocketShipmentId,
            tracking_number: awbNumber || trackingNumber,
            status: 'confirmed',
            updated_at: new Date().toISOString(),
            payment_status: 'paid',
            payment_reference: payment_reference,
            payment_currency: payment_currency || 'FET',
          })
          .eq('id', order.id)

      } catch (shiprocketError: any) {
        console.error('Shiprocket integration error:', shiprocketError)
      }
    }

    if (paymentConfirmed) {
      const newStock = {
        ...product.stock,
        [size]: availableStock - quantity,
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product_id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Order created but stock update failed' },
          { status: 500 }
        )
      }
    }

    if (paymentConfirmed && deliveryPartnerId && deliveryPartners && deliveryPartners.length > 0) {
      await supabase
        .from('delivery_partners')
        .update({ 
          assigned_orders_count: (deliveryPartners[0].assigned_orders_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryPartnerId)
    }

    return NextResponse.json(
      { 
        order: {
          ...order,
          tracking_number: awbNumber || trackingNumber,
          status: paymentConfirmed ? 'confirmed' : 'pending',
          payment_status,
          payment_reference,
          payment_currency: payment_currency || 'FET',
          original_amount: originalAmount,
          discount_percentage: discountPercentage,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          github_username: github_username?.toLowerCase() || null,
          github_verified: githubVerified,
        },
        message: paymentConfirmed
          ? 'Order placed successfully!'
          : 'Order saved. Awaiting payment confirmation.',
        tracking_number: awbNumber || trackingNumber,
        awb_number: awbNumber,
        shiprocket_order_id: shiprocketOrderId,
        shiprocket_shipment_id: shiprocketShipmentId,
        shiprocket_success: !!shiprocketOrderId,
        shiprocket_dashboard_url: shiprocketOrderId ? `https://app.shiprocket.in/orders/${shiprocketOrderId}` : null,
        verify_url: shiprocketOrderId ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/shiprocket/verify?order_id=${shiprocketOrderId}` : null,
        delivery_partner_assigned: deliveryPartnerId ? true : false,
        shipping_cost: shippingCost,
        estimated_delivery_date: estimatedDeliveryDate.toISOString().split('T')[0],
        estimated_days: estimatedDays,
        payment_status,
        payment_reference,
        payment_currency: payment_currency || 'FET',
        original_amount: originalAmount,
        discount_percentage: discountPercentage,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        github_verified: githubVerified,
        github_username: github_username?.toLowerCase() || null,
      },
      { status: paymentConfirmed ? 201 : 202 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get('tracking')
    const dealerId = searchParams.get('dealer_id')

    let query = supabase
      .from('orders')
      .select(`
        *,
        products:product_id (name, price, image_url),
        delivery_partners:delivery_partner_id (name, email, phone, location, service_type, rating)
      `)
      .order('created_at', { ascending: false })

    if (trackingNumber) {
      query = query.eq('tracking_number', trackingNumber)
    }

    const deliveryPartnerId = searchParams.get('delivery_partner_id')
    if (deliveryPartnerId) {
      query = query.eq('delivery_partner_id', deliveryPartnerId)
    }

    query = query.limit(1000)

    const { data, error } = await query

    const uniqueOrders = Array.isArray(data)
      ? data.filter((order, index, arr) => arr.findIndex((o: any) => o.id === order.id) === index)
      : []

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders: uniqueOrders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
