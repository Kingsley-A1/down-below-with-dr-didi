import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAllGalleryImages, createGalleryImage } from '@/lib/admin/repository'
import { galleryImageSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { validationError } from '@/lib/api/errors'

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

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  try {
    const body = await request.json()
    const parsed = galleryImageSchema.safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const image = await createGalleryImage(
      parsed.data,
      { email: session.email, role: session.role }
    )

    revalidatePath('/gallery')
    revalidatePath('/')

    return NextResponse.json({ success: true, image }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to create gallery image', { request, identity: { email: session.email, role: session.role } })
  }
}
