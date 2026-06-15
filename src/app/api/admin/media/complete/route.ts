import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createMediaAssetWithGalleryRecord } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { inferMediaKind, validateMediaFileMetadata } from '@/lib/admin/media-policy'
import { validationError as zodValidationError } from '@/lib/api/errors'
import { galleryMediaUploadSchema } from '@/lib/validations'

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
    const body = (await request.json()) as {
      label?: string
      storageKey?: string
      bucket?: string
      url?: string
      mimeType?: string
      sizeBytes?: number
      altText?: string
      gallery?: unknown
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

    const mediaValidationError = validateMediaFileMetadata({ mimeType, sizeBytes, label, altText })
    if (mediaValidationError) {
      return NextResponse.json({ error: mediaValidationError }, { status: 400 })
    }

    const parsedGallery = body.gallery === undefined
      ? null
      : galleryMediaUploadSchema.safeParse(body.gallery)

    if (parsedGallery && !parsedGallery.success) {
      return zodValidationError(parsedGallery.error)
    }

    const result = await createMediaAssetWithGalleryRecord({
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
      gallery: parsedGallery?.success
        ? {
            ...parsedGallery.data,
            imageUrl: url,
          }
        : undefined,
    })

    if (result.gallery) {
      revalidatePath('/gallery')
      revalidatePath('/')
    }

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to complete media upload', { request, identity: { email: session.email, role: session.role } })
  }
}
