import { NextRequest, NextResponse } from 'next/server'
import { createMediaAssetRecord, listMediaAssets } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { uploadAssetToR2 } from '@/lib/storage/r2'

function inferMediaKind(mimeType: string): 'image' | 'audio' | 'document' | 'video' | 'other' {
  if (mimeType.startsWith('image/')) {
    return 'image'
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio'
  }

  if (mimeType.startsWith('video/')) {
    return 'video'
  }

  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet')) {
    return 'document'
  }

  return 'other'
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'audio/mpeg',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
  'audio/wav',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const MAX_BYTES_BY_KIND: Record<'image' | 'audio' | 'document' | 'video' | 'other', number> = {
  image: 10 * 1024 * 1024,
  audio: 80 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  document: 20 * 1024 * 1024,
  other: 5 * 1024 * 1024,
}

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

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error: 'Unsupported file type. Allowed types are image, audio, video, and common documents.',
        },
        { status: 400 }
      )
    }

    const kind = inferMediaKind(mimeType)
    const maxAllowedSize = MAX_BYTES_BY_KIND[kind]

    if (file.size <= 0 || file.size > maxAllowedSize) {
      return NextResponse.json(
        {
          error: `File size exceeds allowed limit for ${kind} uploads (${Math.floor(maxAllowedSize / (1024 * 1024))}MB).`,
        },
        { status: 400 }
      )
    }

    if (label.length > 120) {
      return NextResponse.json({ error: 'Label must be 120 characters or less.' }, { status: 400 })
    }

    if (altText.length > 200) {
      return NextResponse.json({ error: 'Alt text must be 200 characters or less.' }, { status: 400 })
    }

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
