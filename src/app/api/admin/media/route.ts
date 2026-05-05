import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { createMediaAssetRecord, listMediaAssets } from '@/lib/admin/repository'
import { uploadAssetToR2 } from '@/lib/storage/r2'

function inferMediaKind(mimeType: string): 'image' | 'document' | 'video' | 'other' {
  if (mimeType.startsWith('image/')) {
    return 'image'
  }

  if (mimeType.startsWith('video/')) {
    return 'video'
  }

  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet')) {
    return 'document'
  }

  return 'other'
}

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSession(token)
}

export async function GET() {
  const assets = await listMediaAssets()
  return NextResponse.json({ assets })
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const altText = String(formData.get('altText') || '')
    const label = String(formData.get('label') || '')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A file is required' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const upload = await uploadAssetToR2({
      fileName: file.name,
      body: Buffer.from(arrayBuffer),
      contentType: file.type || 'application/octet-stream',
    })

    const asset = await createMediaAssetRecord({
      label: label || file.name,
      storageKey: upload.storageKey,
      bucket: upload.bucket,
      url: upload.url,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      kind: inferMediaKind(file.type || ''),
      altText,
      actorEmail: session.email,
      actorRole: session.role,
    })

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload media asset'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}