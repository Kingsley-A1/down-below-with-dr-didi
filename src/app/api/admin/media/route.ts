import { NextRequest, NextResponse } from 'next/server'
import { createMediaAssetRecord, listMediaAssets } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { inferMediaKind, validateMediaFileMetadata } from '@/lib/admin/media-policy'
import { uploadAssetToR2 } from '@/lib/storage/r2'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  const assets = await listMediaAssets()
  return NextResponse.json({ assets })
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
    const formData = await request.formData()
    const file = formData.get('file')
    const altText = String(formData.get('altText') || '').trim()
    const label = String(formData.get('label') || '').trim()

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A file is required' }, { status: 400 })
    }

    const mimeType = (file.type || 'application/octet-stream').toLowerCase()

    const validationError = validateMediaFileMetadata({
      mimeType,
      sizeBytes: file.size,
      label,
      altText,
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const kind = inferMediaKind(mimeType)
    const arrayBuffer = await file.arrayBuffer()
    const upload = await uploadAssetToR2({
      fileName: file.name,
      body: Buffer.from(arrayBuffer),
      contentType: mimeType,
    })

    const asset = await createMediaAssetRecord({
      label: label || file.name,
      storageKey: upload.storageKey,
      bucket: upload.bucket,
      url: upload.url,
      mimeType,
      sizeBytes: file.size,
      kind,
      altText,
      actorEmail: session.email,
      actorRole: session.role,
    })

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    return mapApiError(error, 'Failed to upload media asset')
  }
}
