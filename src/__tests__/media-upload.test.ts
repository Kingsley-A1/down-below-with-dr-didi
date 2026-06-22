import { describe, expect, it } from '@jest/globals'
import {
  buildDefaultGalleryUpload,
  buildGalleryUploadForFile,
  deriveMediaLabel,
  MAX_GALLERY_BATCH_FILES,
  validateGalleryFileSelection,
} from '@/components/admin/media-upload'

function makeUploadFile(input: { name: string; size: number; type: string }) {
  return input
}

describe('deriveMediaLabel', () => {
  it.each([
    ['outreach-launch.webp', 'outreach launch'],
    ['Dr_Didi--Clinic Photo.JPG', 'Dr Didi Clinic Photo'],
    ['family.health.image.png', 'family.health.image'],
    ['---.avif', 'Untitled image'],
  ])('derives an editable title from %s', (fileName, expected) => {
    expect(deriveMediaLabel(fileName)).toBe(expected)
  })
})

describe('buildDefaultGalleryUpload', () => {
  it('creates a published gallery payload for Media Library uploads', () => {
    expect(
      buildDefaultGalleryUpload(
        'community-outreach.mp4',
        'Community Outreach',
        'Dr. Didi speaking during a community outreach',
        'video',
        'ABC-123'
      )
    ).toMatchObject({
      slug: 'community-outreach-abc123',
      title: 'Community Outreach',
      mediaType: 'video',
      imageAlt: 'Dr. Didi speaking during a community outreach',
      category: 'outreach',
      status: 'published',
    })
  })

  it('normalizes short labels to valid gallery metadata', () => {
    const payload = buildDefaultGalleryUpload('a.jpg', 'a', 'x', 'image', 'token')

    expect(payload.title.length).toBeGreaterThanOrEqual(5)
    expect(payload.imageAlt.length).toBeGreaterThanOrEqual(5)
    expect(payload.description.length).toBeGreaterThanOrEqual(20)
  })

  it('builds a gallery upload from file metadata with category overrides', () => {
    expect(
      buildGalleryUploadForFile({
        fileName: 'women-health-lecture.png',
        mediaType: 'image',
        category: 'event',
        label: 'Women Health Lecture',
        description: 'Community members attending a women health lecture.',
        featured: true,
        uniqueToken: 'batch-a',
      })
    ).toMatchObject({
      slug: 'women-health-lecture-batcha',
      title: 'Women Health Lecture',
      description: 'Community members attending a women health lecture.',
      mediaType: 'image',
      category: 'event',
      featured: true,
      status: 'published',
    })
  })
})

describe('validateGalleryFileSelection', () => {
  it('accepts a valid batch of images', () => {
    const result = validateGalleryFileSelection([
      makeUploadFile({ name: 'one.jpg', size: 1024, type: 'image/jpeg' }),
      makeUploadFile({ name: 'two.png', size: 2048, type: 'image/png' }),
    ])

    expect(result).toMatchObject({
      ok: true,
      mediaType: 'image',
      isBatch: true,
      totalSizeBytes: 3072,
    })
  })

  it('rejects batches larger than the file-count limit', () => {
    const files = Array.from({ length: MAX_GALLERY_BATCH_FILES + 1 }, (_, index) =>
      makeUploadFile({
        name: `image-${index}.jpg`,
        size: 1024,
        type: 'image/jpeg',
      })
    )

    expect(validateGalleryFileSelection(files)).toMatchObject({
      ok: false,
      error: `Choose no more than ${MAX_GALLERY_BATCH_FILES} images at once.`,
    })
  })

  it('rejects videos in batch mode', () => {
    expect(
      validateGalleryFileSelection([
        makeUploadFile({ name: 'one.jpg', size: 1024, type: 'image/jpeg' }),
        makeUploadFile({ name: 'clip.mp4', size: 2048, type: 'video/mp4' }),
      ])
    ).toMatchObject({
      ok: false,
      error: 'Batch upload currently supports images only. Upload videos one at a time.',
    })
  })

  it('rejects batch totals larger than 200 MB', () => {
    expect(
      validateGalleryFileSelection([
        makeUploadFile({ name: 'one.jpg', size: 120 * 1024 * 1024, type: 'image/jpeg' }),
        makeUploadFile({ name: 'two.jpg', size: 90 * 1024 * 1024, type: 'image/jpeg' }),
      ])
    ).toMatchObject({
      ok: false,
      error: 'Selected images are larger than 200 MB in total.',
    })
  })
})
