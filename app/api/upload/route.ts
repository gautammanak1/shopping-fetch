import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const bytes = Buffer.from(arrayBuffer)

    const fileExt =
      (file.name && file.name.split('.').pop()) ||
      (file.type && file.type.split('/').pop()) ||
      'bin'

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabaseServer.storage
      .from('product-images')
      .upload(filePath, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
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


