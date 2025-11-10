import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  sizes: string[]
  stock: Record<string, number>
  active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  product_id: string
  size: string
  quantity: number
  status: string
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  shipping_address: string | null
  tracking_number: string | null
  awb_number: string | null
  shiprocket_order_id: string | null
  shiprocket_shipment_id: number | null
  shipping_cost: number | null
  estimated_delivery_date: string | null
  created_at: string
  updated_at: string
  delivery_partner_id: string | null
  payment_status: string | null
  payment_reference: string | null
  service_type: string | null
  products?: {
    name: string
    price: number
    image_url: string
  }
}

export interface Dealer {
  id: string
  name: string
  email: string
  phone: string
  location: string
  active: boolean
  assigned_orders_count: number
  created_at: string
  updated_at: string
}

