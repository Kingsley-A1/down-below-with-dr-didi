import { NextRequest, NextResponse } from 'next/server'
import { createMediaAssetRecord } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { inferMediaKind, validateMediaFileMetadata } from '@/lib/admin/media-policy'

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
    const body = (await request.json()) as {
      label?: string
      storageKey?: string
      bucket?: string
      url?: string
      mimeType?: string
      sizeBytes?: number
      altText?: string
    }

    const label = String(body.label || '').trim()
    const storageKey = String(body.storageKey || '').trim()
    const bucket = String(body.bucket || '').trim()
    const url = String(body.url || '').trim()
    const mimeType = String(body.mimeType || 'application/octet-stream').toLowerCase()
    const sizeBytes = Number(body.sizeBytes || 0)
    const altText = String(body.altText || '').trim()

    if (!storageKey || !bucket || !url || !label) {
      return NextResponse.json({ error: 'Upload completion metadata is incomplete.' }, { status: 400 })
    }

    const validationError = validateMediaFileMetadata({ mimeType, sizeBytes, label, altText })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const asset = await createMediaAssetRecord({
      label,
      storageKey,
      bucket,
      url,
      mimeType,
      sizeBytes,
      kind: inferMediaKind(mimeType),
      altText,
      actorEmail: session.email,
      actorRole: session.role,
    })

    return NextResponse.json({ success: true, asset }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to complete media upload', { request, identity: { email: session.email, role: session.role } })
  }
}
