import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()

    const fileExt =
      (file.name && file.name.split('.').pop()) ||
      (file.type && file.type.split('/').pop()) ||
      'bin'

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`
    const filePath = `products/${fileName}`

    try {
      const { data: bucketInfo } = await supabaseServer.storage.getBucket('product-images')
      if (!bucketInfo) {
        await supabaseServer.storage.createBucket('product-images', { public: true })
      }
    } catch {
    }

    const { error: uploadError } = await supabaseServer.storage
      .from('product-images')
      .upload(filePath, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: publicData } = supabaseServer.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: publicData.publicUrl,
      path: filePath,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    )
  }
}


