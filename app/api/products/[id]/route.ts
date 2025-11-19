import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product: data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (typeof body?.image_url === 'string' && body.image_url.startsWith('data:')) {
      try {
        const match = body.image_url.match(/^data:(.+);base64,(.*)$/)
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
            body.image_url = publicData.publicUrl
          }
        }
      } catch {}
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ product: data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

