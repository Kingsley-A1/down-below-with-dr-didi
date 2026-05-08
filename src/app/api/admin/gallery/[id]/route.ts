import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { updateGalleryImage, deleteGalleryImage } from '@/lib/admin/repository'
import { galleryImageSchema } from '@/lib/validations'

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSession(token)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = galleryImageSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const { caption, eventName, location, capturedAt, ...rest } = parsed.data

    const image = await updateGalleryImage(
      id,
      {
        ...rest,
        ...(caption !== undefined && { caption: caption || null }),
        ...(eventName !== undefined && { eventName: eventName || null }),
        ...(location !== undefined && { location: location || null }),
        ...(capturedAt !== undefined && { capturedAt: capturedAt || null }),
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, image })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update gallery image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await deleteGalleryImage(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete gallery image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
