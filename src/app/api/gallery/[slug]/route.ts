import { NextRequest, NextResponse } from 'next/server'
import { getGalleryImageBySlug } from '@/lib/admin/repository'
import { serverError } from '@/lib/api/errors'

export async function GET(
  request: NextRequest,
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
    return serverError('Failed to load gallery image', { request, error })
  }
}
