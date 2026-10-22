import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  deleteMediaAssetRecord,
  getMediaAssetDeletePreview,
  getMediaAssetWithGallery,
  updateMediaAssetWithGallery,
} from '@/lib/admin/repository'
import { validationError } from '@/lib/api/errors'
import { mediaAssetUpdateSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { deleteAssetFromR2 } from '@/lib/storage/r2'

export async function GET(
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
    const result = await getMediaAssetWithGallery(id)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return mapApiError(error, 'Failed to load media asset', { request, identity: { email: session.email, role: session.role } })
  }
}

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
    const body = await request.json().catch(() => null)
    const parsed = mediaAssetUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const result = await updateMediaAssetWithGallery(id, parsed.data, {
      email: session.email,
      role: session.role,
    })

    if (parsed.data.gallery) {
      revalidatePath('/gallery')
      revalidatePath('/')
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return mapApiError(error, 'Failed to update media asset', { request, identity: { email: session.email, role: session.role } })
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
    const preview = await getMediaAssetDeletePreview(id)

    // Gallery entries are created from the upload itself, so they go with the asset.
    // Any other reference (hero, team, podcast, article) still blocks deletion.
    const blockingUsages = preview.usages.filter((usage) => usage.entityType !== 'gallery_image')

    if (blockingUsages.length > 0) {
      return NextResponse.json(
        {
          error: 'Asset is in use and cannot be deleted.',
          usages: blockingUsages,
        },
        { status: 409 }
      )
    }

    await deleteAssetFromR2({
      storageKey: preview.asset.storageKey,
      bucket: preview.asset.bucket,
    })

    const { removedGalleryTitles } = await deleteMediaAssetRecord(
      id,
      { email: session.email, role: session.role },
      { removeGalleryEntries: true }
    )

    if (removedGalleryTitles.length > 0) {
      revalidatePath('/gallery')
      revalidatePath('/')
    }

    return NextResponse.json({ success: true, removedGalleryTitles })
  } catch (error) {
    return mapApiError(error, 'Failed to delete media asset', { request, identity: { email: session.email, role: session.role } })
  }
}
