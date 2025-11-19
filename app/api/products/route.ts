import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('active', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json({ products: data || [] })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let { name, description, price, image_url, stock, product_type, sizes } = body

    if (!name || !description || !price || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (typeof image_url === 'string' && image_url.startsWith('data:')) {
      try {
        const match = image_url.match(/^data:(.+);base64,(.*)$/)
        if (match) {
          const contentType = match[1]
          const base64Data = match[2]
          const buffer = Buffer.from(base64Data, 'base64')
          const ext = contentType.split('/').pop() || 'bin'
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
          const filePath = `products/${fileName}`
          const { error: uploadError } = await supabaseServer.storage
            .from('product-images')
            .upload(filePath, buffer, { contentType, upsert: true })
          if (!uploadError) {
            const { data: publicData } = supabaseServer.storage
              .from('product-images')
              .getPublicUrl(filePath)
            image_url = publicData.publicUrl
          }
        }
      } catch {}
    }

    const productType = product_type || 't-shirt'
    const productSizes = sizes || (['t-shirt', 'hoodie', 'cap'].includes(productType) ? ['S', 'M', 'L', 'XL', 'XXL'] : ['One Size'])
    const defaultStock = stock || (
      ['t-shirt', 'hoodie', 'cap'].includes(productType)
        ? { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
        : { 'One Size': 0 }
    )

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          description,
          price,
          image_url,
          product_type: productType,
          sizes: productSizes,
          stock: defaultStock,
          active: true,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

