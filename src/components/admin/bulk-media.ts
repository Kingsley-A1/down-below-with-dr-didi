export const MAX_BULK_ITEMS = 20
export const MAX_BULK_TOTAL_BYTES = 500 * 1024 * 1024
const MAX_BULK_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_BULK_VIDEO_BYTES = 200 * 1024 * 1024

export const BULK_ACCEPTED_MEDIA = 'image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm'
const ACCEPTED_MIME_TYPES = new Set(BULK_ACCEPTED_MEDIA.split(','))

export type BulkMediaType = 'image' | 'video'

export interface BulkFileLike {
  name: string
  size: number
  type: string
}

export interface BulkRejection {
  name: string
  reason: string
}

export interface BulkDraftFields {
  title: string
  description: string
}

export function getBulkMediaType(file: Pick<BulkFileLike, 'type'>): BulkMediaType {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

/**
 * Splits newly chosen files into the ones that fit (type, size, 20-item cap,
 * total size) and the ones to report back, so one bad file never blocks the rest.
 */
export function filterBulkAdditions<T extends BulkFileLike>(
  currentCount: number,
  currentBytes: number,
  incoming: readonly T[]
): { accepted: T[]; rejected: BulkRejection[] } {
  const accepted: T[] = []
  const rejected: BulkRejection[] = []
  let count = currentCount
  let bytes = currentBytes

  for (const file of incoming) {
    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      rejected.push({ name: file.name, reason: 'Unsupported file type. Use JPG, PNG, WebP, GIF, AVIF, MP4, or WebM.' })
      continue
    }

    const isVideo = getBulkMediaType(file) === 'video'
    if (file.size > (isVideo ? MAX_BULK_VIDEO_BYTES : MAX_BULK_IMAGE_BYTES)) {
      rejected.push({ name: file.name, reason: isVideo ? 'Video is larger than 200 MB.' : 'Image is larger than 10 MB.' })
      continue
    }

    if (count >= MAX_BULK_ITEMS) {
      rejected.push({ name: file.name, reason: `Only ${MAX_BULK_ITEMS} items can be uploaded at once.` })
      continue
    }

    if (bytes + file.size > MAX_BULK_TOTAL_BYTES) {
      rejected.push({ name: file.name, reason: 'The selection is larger than 500 MB in total.' })
      continue
    }

    accepted.push(file)
    count += 1
    bytes += file.size
  }

  return { accepted, rejected }
}

/** Mirrors the server's gallery rules: title 5+ characters, description 10+. */
export function isBulkDraftComplete(draft: BulkDraftFields): boolean {
  return draft.title.trim().length >= 5 && draft.description.trim().length >= 10
}

export function summarizeRejections(rejected: readonly BulkRejection[]): string {
  if (rejected.length === 0) {
    return ''
  }

  const first = rejected[0]
  const more = rejected.length > 1 ? ` (and ${rejected.length - 1} more skipped)` : ''
  return `${first.name} was skipped: ${first.reason}${more}`
}
