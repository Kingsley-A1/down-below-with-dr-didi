import { NextResponse } from 'next/server'
import { getGalleryImageBySlug } from '@/lib/admin/repository'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug?.trim()) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 })
    }

    const image = await getGalleryImageBySlug(slug)

    if (!image) {
      return NextResponse.json({ success: false, error: 'Image not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, image }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load gallery image',
      },
      { status: 500 }
    )
  }
}
