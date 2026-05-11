import { NextRequest, NextResponse } from 'next/server'
import {
  deleteMediaAssetRecord,
  getMediaAssetDeletePreview,
} from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { deleteAssetFromR2 } from '@/lib/storage/r2'

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

    if (preview.usages.length > 0) {
      return NextResponse.json(
        {
          error: 'Asset is in use and cannot be deleted.',
          usages: preview.usages,
        },
        { status: 409 }
      )
    }

    await deleteAssetFromR2({
      storageKey: preview.asset.storageKey,
      bucket: preview.asset.bucket,
    })

    await deleteMediaAssetRecord(id, {
      email: session.email,
      role: session.role,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return mapApiError(error, 'Failed to delete media asset', { notFoundPrefix: 'Media asset not found' })
  }
}
