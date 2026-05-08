import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { getAllGalleryImages, createGalleryImage } from '@/lib/admin/repository'
import { galleryImageSchema } from '@/lib/validations'

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSession(token)
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const images = await getAllGalleryImages()
  return NextResponse.json({ images })
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const message = error instanceof Error ? error.message : 'Failed to create gallery image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
