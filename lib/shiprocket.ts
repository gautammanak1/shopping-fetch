/**
 * Shiprocket API Integration
 * Handles authentication, shipment creation, tracking, etc.
 */

import { SHIPROCKET_CONFIG } from '@/config/shiprocket.config'

const SHIPROCKET_API_BASE = SHIPROCKET_CONFIG.API_BASE_URL

interface ShiprocketCredentials {
  email: string
  password: string
}

interface ShiprocketAuthResponse {
  token: string
  expires_at?: string
}

interface ShiprocketOrder {
  order_id: string
  order_date: string // Format: YYYY-MM-DD
  pickup_location: string // Name from Shiprocket dashboard
  billing_customer_name: string
  billing_last_name?: string
  billing_address: string
  billing_address_2?: string
  billing_city: string
  billing_pincode: string // 6 digits
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string // Numbers only, no spaces/special chars
  shipping_is_billing: boolean
  shipping_customer_name: string
  shipping_last_name?: string
  shipping_address: string
  shipping_address_2?: string
  shipping_city: string
  shipping_pincode: string // 6 digits
  shipping_state: string
  shipping_country: string
  shipping_email: string
  shipping_phone: string // Numbers only
  order_items: Array<{
    name: string
    sku: string
    units: number
    selling_price: number
  }>
  payment_method: 'Prepaid' | 'Cod'
  sub_total: number
  length: number // cm
  breadth: number // cm
  height: number // cm
  weight: number // kg
}

class ShiprocketClient {
  private token: string | null = null
  private tokenExpiry: Date | null = null

  async getAuthToken(): Promise<string> {
    // Check if token is still valid (valid for 240 hours = 10 days)
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token
    }

    // Get API user credentials (NOT the main Shiprocket login credentials)
    // Hardcoded fallback from config (tested and working)
    // Environment variables override if set
    const email = process.env.SHIPROCKET_EMAIL || SHIPROCKET_CONFIG.EMAIL
    const password = process.env.SHIPROCKET_PASSWORD || SHIPROCKET_CONFIG.PASSWORD

    if (!email || !password) {
      throw new Error('Shiprocket API user credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD (these should be API user credentials, not your main login)')
    }

    // POST /v1/external/auth/login with API user credentials
    const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email,  // API user email (different from registered email)
        password // API user password
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Shiprocket authentication failed'
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // If not JSON, use the text
        if (errorText) {
          errorMessage = errorText
        }
      }
      
      // More helpful error message
      if (response.status === 403 || response.status === 401) {
        errorMessage = `Access forbidden. Please check:
        1. API user email is different from your registered Shiprocket email
        2. API user password is correct
        3. API user was created in Settings > API > Create API User
        Original error: ${errorMessage}`
      }
      
      throw new Error(errorMessage)
    }

    const data: ShiprocketAuthResponse = await response.json()
    this.token = data.token
    
    // Token valid for 240 hours (10 days) according to docs
    this.tokenExpiry = data.expires_at 
      ? new Date(data.expires_at)
      : new Date(Date.now() + SHIPROCKET_CONFIG.TOKEN_VALIDITY_HOURS * 60 * 60 * 1000)

    return this.token
  }

  async createOrder(orderData: ShiprocketOrder) {
    const token = await this.getAuthToken()

    const response = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      let errorMessage = 'Failed to create Shiprocket order'
      
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || errorData.errors || errorMessage
        
        // If it's a pickup location error, show available locations
        if (errorData.data && errorData.data.data && Array.isArray(errorData.data.data)) {
          const locations = errorData.data.data.map((loc: any) => loc.pickup_location).filter(Boolean)
          if (locations.length > 0) {
            errorMessage += `. Available pickup locations: ${locations.join(', ')}`
            console.error('Available Shiprocket pickup locations:', locations)
          }
        }
        
        // Log full error for debugging
        console.error('Shiprocket createOrder error:', JSON.stringify(errorData, null, 2))
      } catch {
        if (responseText) {
          errorMessage = responseText
          console.error('Shiprocket createOrder error (text):', responseText)
        }
      }
      
      throw new Error(errorMessage)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      throw new Error('Invalid JSON response from Shiprocket')
    }
    
    // Shiprocket returns order_id and shipment_id
    // Handle different response structures
    const orderId = result.order_id || result.orderId || result.data?.order_id
    const shipmentId = result.shipment_id || result.shipmentId || result.data?.shipment_id
    
    return {
      order_id: orderId,
      shipment_id: shipmentId,
      ...result
    }
  }

  async assignAWB(shipmentId: number, courierId?: number) {
    const token = await this.getAuthToken()

    // POST /v1/external/courier/assign/awb
    // According to docs: You will get awb_code and courier name in response
    const response = await fetch(`${SHIPROCKET_API_BASE}/courier/assign/awb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: shipmentId,
        ...(courierId && { courier_id: courierId }),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Failed to assign AWB'
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        if (errorText) errorMessage = errorText
      }
      
      throw new Error(errorMessage)
    }

    const result = await response.json()
    // Returns: { awb_code, courier_name }
    return result
  }

  async generateAWB(shipmentId: number) {
    // Legacy method - now uses assignAWB
    return await this.assignAWB(shipmentId)
  }

  async generatePickup(shipmentIds: number[]) {
    const token = await this.getAuthToken()

    // POST /v1/external/courier/generate/pickup
    const response = await fetch(`${SHIPROCKET_API_BASE}/courier/generate/pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: shipmentIds, // Array of shipment IDs
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate pickup')
    }

    return await response.json()
  }

  async trackOrder(shipmentId: number) {
    const token = await this.getAuthToken()

    const response = await fetch(`${SHIPROCKET_API_BASE}/courier/track/shipment/${shipmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to track shipment')
    }

    return await response.json()
  }

  async trackByAWB(awb: string) {
    const token = await this.getAuthToken()

    const response = await fetch(`${SHIPROCKET_API_BASE}/courier/track/awb/${awb}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to track by AWB')
    }

    return await response.json()
  }

  async cancelShipment(shipmentId: number, reason: string = 'Customer request') {
    const token = await this.getAuthToken()

    const response = await fetch(`${SHIPROCKET_API_BASE}/orders/cancel/shipment/${shipmentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        reason,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to cancel shipment')
    }

    return await response.json()
  }

  async getShippingRates(pickupPincode: string, deliveryPincode: string, weight: number) {
    const token = await this.getAuthToken()

    // GET /v1/external/courier/serviceability/ - step 3 from docs
    // To get serviceable courier with shipping charge
    const rateResponse = await fetch(`${SHIPROCKET_API_BASE}/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!rateResponse.ok) {
      const errorText = await rateResponse.text()
      let errorMessage = 'Failed to get shipping rates'
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        if (errorText) errorMessage = errorText
      }
      
      throw new Error(errorMessage)
    }

    const rates = await rateResponse.json()
    // Return simplified rate structure
    return {
      available: rates.available || false,
      rate: rates.rate || 5.0, // Default rate if not available
      estimated_days: rates.estimated_days || 5,
      courier_company_id: rates.courier_company_id,
      courier_name: rates.courier_name,
      ...rates
    }
  }

  /**
   * Get orders from Shiprocket
   * @param page Page number (default: 1)
   * @param perPage Items per page (default: 100)
   * @param filters Optional filters (order_id, channel_id, etc.)
   */
  async getOrders(page: number = 1, perPage: number = 100, filters?: {
    order_id?: string
    channel_id?: string
    status?: string
  }) {
    const token = await this.getAuthToken()

    // Build query params
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(filters?.order_id && { order_id: filters.order_id }),
      ...(filters?.channel_id && { channel_id: filters.channel_id }),
      ...(filters?.status && { status: filters.status }),
    })

    const response = await fetch(`${SHIPROCKET_API_BASE}/orders?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Failed to get orders from Shiprocket'
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        if (errorText) errorMessage = errorText
      }
      
      throw new Error(errorMessage)
    }

    return await response.json()
  }

  /**
   * Get a specific order by Shiprocket order ID
   */
  async getOrderByOrderId(shiprocketOrderId: string) {
    const token = await this.getAuthToken()

    const response = await fetch(`${SHIPROCKET_API_BASE}/orders/show/${shiprocketOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Failed to get order from Shiprocket'
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        if (errorText) errorMessage = errorText
      }
      
      throw new Error(errorMessage)
    }

    return await response.json()
  }

  /**
   * Get shipment details by shipment ID
   */
  async getShipment(shipmentId: number) {
    const token = await this.getAuthToken()

    const response = await fetch(`${SHIPROCKET_API_BASE}/orders/show/shipment/${shipmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Failed to get shipment from Shiprocket'
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        if (errorText) errorMessage = errorText
      }
      
      throw new Error(errorMessage)
    }

    return await response.json()
  }
}

export const shiprocketClient = new ShiprocketClient()

