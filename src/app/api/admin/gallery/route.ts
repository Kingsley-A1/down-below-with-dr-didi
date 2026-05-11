import { NextRequest, NextResponse } from 'next/server'
import { getAllGalleryImages, createGalleryImage } from '@/lib/admin/repository'
import { galleryImageSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  const images = await getAllGalleryImages()
  return NextResponse.json({ images })
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'editor')
  if (roleError) {
    return roleError
  }

  try {
    const body = await request.json()
    const parsed = galleryImageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const { caption, eventName, location, capturedAt, status, ...rest } = parsed.data

    const image = await createGalleryImage(
      {
        ...rest,
        caption: caption || undefined,
        eventName: eventName || undefined,
        location: location || undefined,
        capturedAt: capturedAt || undefined,
        status: status === 'archived' ? 'published' : status,
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, image }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to create gallery image')
  }
}
