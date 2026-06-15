import { parseApiError, readJsonResponse } from '@/lib/api/client-error'
import type { GalleryMediaUploadData } from '@/lib/validations'

export type UploadedAsset = {
  id: string
  label: string
  storageKey: string
  bucket: string
  url: string
  mimeType: string
  sizeBytes: number
  kind: 'image' | 'audio' | 'document' | 'video' | 'other'
  altText: string | null
  createdAt: string
}

type UploadAdminMediaOptions = {
  onProgress?: (progress: number) => void
  gallery?: GalleryMediaUploadData
}

const DIRECT_UPLOAD_TIMEOUT_MS = 120_000

export function deriveMediaLabel(fileName: string): string {
  const normalized = fileName
    .replace(/\.[^./\\]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized || 'Untitled image'
}

function gallerySlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildDefaultGalleryUpload(
  fileName: string,
  label: string,
  altText: string,
  mediaType: 'image' | 'video',
  uniqueToken = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
): GalleryMediaUploadData {
  const rawTitle = label.trim() || deriveMediaLabel(fileName)
  const title = (rawTitle.length >= 5 ? rawTitle : `${mediaType === 'video' ? 'Video' : 'Image'} ${rawTitle}`).slice(0, 160)
  const rawImageAlt = altText.trim()
  const imageAlt = (rawImageAlt.length >= 5 ? rawImageAlt : title).slice(0, 200)
  const baseSlug = gallerySlug(title).slice(0, 80) || `gallery-${mediaType}`
  const token = uniqueToken.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || Date.now().toString(36)

  return {
    slug: `${baseSlug}-${token}`.slice(0, 100),
    title,
    description: `Gallery highlight from DownBelow Family Health Initiative showing ${title.toLowerCase()} as part of our public education, care, and outreach work.`,
    caption: title,
    mediaType,
    featured: false,
    imageAlt,
    category: 'outreach',
    eventName: '',
    location: '',
    capturedAt: '',
    sortOrder: 0,
    status: 'published',
  }
}

function parseUploadResponse<T>(raw: string): T & { error?: string } {
  if (!raw.trim()) {
    return {} as T & { error?: string }
  }

  try {
    return JSON.parse(raw) as T & { error?: string }
  } catch {
    return { error: raw.slice(0, 240) } as T & { error?: string }
  }
}

async function requestJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await readJsonResponse<T>(response)

  if (!response.ok) {
    throw new Error(parseApiError(data, 'Request failed').message)
  }

  return (data ?? {}) as T
}

function uploadFileToSignedUrl(file: File, uploadUrl: string, options: UploadAdminMediaOptions) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.open('PUT', uploadUrl)
    request.responseType = 'text'
    request.timeout = DIRECT_UPLOAD_TIMEOUT_MS
    request.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return
      }

      options.onProgress?.((event.loaded / event.total) * 100)
    }

    request.onerror = () => {
      reject(
        new Error(
          `Upload failed for ${file.name}. The browser could not reach storage. Confirm Cloudflare R2 CORS allows PUT from this admin domain with the Content-Type header.`
        )
      )
    }

    request.ontimeout = () => {
      reject(
        new Error(
          `Upload timed out for ${file.name}. Check Cloudflare R2 CORS and network access, then try again.`
        )
      )
    }

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        const result = parseUploadResponse<{ error?: string }>(request.responseText)
        reject(new Error(result.error || `Upload failed for ${file.name}`))
        return
      }

      options.onProgress?.(100)
      resolve()
    }

    request.send(file)
  })
}

export async function uploadAdminMediaAsset(
  file: File,
  label: string,
  altText = '',
  options: UploadAdminMediaOptions = {}
) {
  const normalizedMimeType = file.type || 'application/octet-stream'
  const normalizedLabel = label.trim() || deriveMediaLabel(file.name)
  const normalizedAltText = altText.trim()
  const presign = await requestJson<{
    uploadUrl: string
    storageKey: string
    bucket: string
    url: string
    kind: UploadedAsset['kind']
  }>('/api/admin/media/presign', {
    fileName: file.name,
    mimeType: normalizedMimeType,
    sizeBytes: file.size,
    label: normalizedLabel,
    altText: normalizedAltText,
    gallery: options.gallery,
  })

  await uploadFileToSignedUrl(file, presign.uploadUrl, options)

  const complete = await requestJson<{
    asset: UploadedAsset
    gallery: { id: string; slug: string } | null
  }>('/api/admin/media/complete', {
    label: normalizedLabel,
    storageKey: presign.storageKey,
    bucket: presign.bucket,
    url: presign.url,
    mimeType: normalizedMimeType,
    sizeBytes: file.size,
    altText: normalizedAltText,
    gallery: options.gallery,
  })

  if (options.gallery && !complete.gallery) {
    throw new Error('Media uploaded, but the gallery publication was not created.')
  }

  return {
    ...complete.asset,
    gallery: complete.gallery,
  }
}
