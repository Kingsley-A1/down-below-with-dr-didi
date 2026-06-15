import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { updateGalleryImage, deleteGalleryImage } from '@/lib/admin/repository'
import { galleryImageSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { validationError } from '@/lib/api/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = galleryImageSchema.partial().safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
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

    revalidatePath('/gallery')
    revalidatePath('/')

    return NextResponse.json({ success: true, image })
  } catch (error) {
    return mapApiError(error, 'Failed to update gallery image', { request, identity: { email: session.email, role: session.role } })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'super_admin')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    await deleteGalleryImage(id, { email: session.email, role: session.role })
    revalidatePath('/gallery')
    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    return mapApiError(error, 'Failed to delete gallery image', { request, identity: { email: session.email, role: session.role } })
  }
}
