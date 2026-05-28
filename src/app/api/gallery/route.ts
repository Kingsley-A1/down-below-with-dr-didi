import { NextRequest, NextResponse } from 'next/server'
import { getPublishedGalleryImages, type GalleryImageCategory } from '@/lib/admin/repository'
import { serverError } from '@/lib/api/errors'

const ALLOWED_CATEGORIES: GalleryImageCategory[] = ['outreach', 'event', 'team', 'community', 'facility']

export async function GET(request: NextRequest) {
  try {
    const rawCategory = request.nextUrl.searchParams.get('category')
    const category = rawCategory && ALLOWED_CATEGORIES.includes(rawCategory as GalleryImageCategory)
      ? (rawCategory as GalleryImageCategory)
      : undefined

    const images = await getPublishedGalleryImages(category)

    return NextResponse.json(
      {
        success: true,
        images,
        count: images.length,
      },
      { status: 200 }
    )
  } catch (error) {
    return serverError('Failed to load gallery images', { request, error })
  }
}
