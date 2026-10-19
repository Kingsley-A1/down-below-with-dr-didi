import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  deleteGalleryImage,
  deleteMediaAssetRecord,
  findMediaAssetIdByUrl,
  getMediaAssetDeletePreview,
  updateGalleryImage,
} from '@/lib/admin/repository'
import { deleteAssetFromR2 } from '@/lib/storage/r2'
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

    const image = await updateGalleryImage(
      id,
      parsed.data,
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
    const actor = { email: session.email, role: session.role }
    const { imageUrl } = await deleteGalleryImage(id, actor)
    revalidatePath('/gallery')
    revalidatePath('/')

    // Remove the uploaded file too, unless something else still references it.
    // The gallery item is already gone, so a cleanup failure is reported, not thrown.
    let storageCleaned = true
    try {
      const assetId = await findMediaAssetIdByUrl(imageUrl)
      if (assetId) {
        const preview = await getMediaAssetDeletePreview(assetId)
        if (preview.usages.length === 0) {
          await deleteAssetFromR2({ storageKey: preview.asset.storageKey, bucket: preview.asset.bucket })
          await deleteMediaAssetRecord(assetId, actor)
        }
      }
    } catch {
      storageCleaned = false
    }

    return NextResponse.json({ success: true, storageCleaned })
  } catch (error) {
    return mapApiError(error, 'Failed to delete gallery image', { request, identity: { email: session.email, role: session.role } })
  }
}
