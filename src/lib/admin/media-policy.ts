export type MediaAssetKind = 'image' | 'audio' | 'document' | 'video' | 'other'

export function inferMediaKind(mimeType: string): MediaAssetKind {
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

export const ALLOWED_MIME_TYPES = new Set([
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

export const MAX_BYTES_BY_KIND: Record<MediaAssetKind, number> = {
  image: 10 * 1024 * 1024,
  audio: 80 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  document: 20 * 1024 * 1024,
  other: 5 * 1024 * 1024,
}

export function validateMediaFileMetadata(input: {
  mimeType: string
  sizeBytes: number
  label: string
  altText: string
}) {
  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    return 'Unsupported file type. Allowed types are image, audio, video, and common documents.'
  }

  const kind = inferMediaKind(input.mimeType)
  const maxAllowedSize = MAX_BYTES_BY_KIND[kind]

  if (input.sizeBytes <= 0 || input.sizeBytes > maxAllowedSize) {
    return `File size exceeds allowed limit for ${kind} uploads (${Math.floor(maxAllowedSize / (1024 * 1024))}MB).`
  }

  if (input.label.length > 120) {
    return 'Label must be 120 characters or less.'
  }

  if (input.altText.length > 200) {
    return 'Alt text must be 200 characters or less.'
  }

  return null
}
