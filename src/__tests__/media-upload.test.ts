import { describe, expect, it } from '@jest/globals'
import { buildDefaultGalleryUpload, deriveMediaLabel } from '@/components/admin/media-upload'

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
})
