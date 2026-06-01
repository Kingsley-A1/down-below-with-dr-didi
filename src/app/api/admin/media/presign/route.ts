import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { inferMediaKind, validateMediaFileMetadata } from '@/lib/admin/media-policy'
import { env } from '@/lib/env'
import { buildAssetStorageKey, buildPublicAssetUrl, getR2Client } from '@/lib/storage/r2'

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
    const body = (await request.json().catch(() => null)) as {
      fileName?: string
      mimeType?: string
      sizeBytes?: number
      label?: string
      altText?: string
    } | null

    const fileName = String(body?.fileName || '').trim()
    const mimeType = String(body?.mimeType || 'application/octet-stream').toLowerCase()
    const sizeBytes = Number(body?.sizeBytes || 0)
    const label = String(body?.label || fileName).trim()
    const altText = String(body?.altText || '').trim()

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required.' }, { status: 400 })
    }

    const validationError = validateMediaFileMetadata({ mimeType, sizeBytes, label, altText })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const storageKey = buildAssetStorageKey(fileName)
    const uploadUrl = await getSignedUrl(
      getR2Client(),
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: storageKey,
        ContentType: mimeType,
      }),
      { expiresIn: 600 }
    )

    return NextResponse.json({
      uploadUrl,
      storageKey,
      bucket: env.R2_BUCKET,
      url: buildPublicAssetUrl(storageKey),
      kind: inferMediaKind(mimeType),
    })
  } catch (error) {
    return mapApiError(error, 'Failed to prepare media upload', { request, identity: { email: session.email, role: session.role } })
  }
}
