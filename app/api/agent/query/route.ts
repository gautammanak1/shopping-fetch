import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    const queryLower = query.toLowerCase()
    const keywords = queryLower.split(/\s+/)

    const matchedProducts = (products || [])
      .map((product) => {
        let score = 0
        const nameLower = product.name.toLowerCase()
        const descLower = product.description.toLowerCase()

        keywords.forEach((keyword: any) => {
          if (nameLower.includes(keyword)) score += 2
          if (descLower.includes(keyword)) score += 1
        })

        return { ...product, match_score: score }
      })
      .filter((p) => p.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5)

    const formatProduct = (product: any) => {
      let imageUrl = product.image_url
      if (imageUrl && !imageUrl.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        imageUrl = `${baseUrl}${imageUrl}`
      }
      return {
        ...product,
        image_url: imageUrl,
        full_image_url: imageUrl,
      }
    }

    const formattedProducts = (matchedProducts.length > 0 ? matchedProducts : products?.slice(0, 5) || [])
      .map(formatProduct)

    return NextResponse.json({
      products: formattedProducts,
      query,
      message: matchedProducts.length > 0
        ? `Found ${matchedProducts.length} matching product(s)`
        : 'Showing all available products',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

