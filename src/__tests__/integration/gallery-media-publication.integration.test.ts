import { afterAll, afterEach, describe, expect, it, jest } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import {
  createMediaAssetWithGalleryRecord,
  getPublishedGalleryImages,
} from '@/lib/admin/repository'
import { disconnectDatabase, hasIntegrationDatabase } from './setup'

const describeWithDatabase = hasIntegrationDatabase ? describe : describe.skip

jest.setTimeout(60_000)

const testPrefix = 'integration-gallery-upload'

describeWithDatabase('gallery media publication', () => {
  afterEach(async () => {
    await prisma.auditLog.deleteMany({
      where: { actorEmail: 'gallery-upload-integration@example.com' },
    })
    await prisma.galleryImage.deleteMany({
      where: { slug: { startsWith: testPrefix } },
    })
    await prisma.mediaAsset.deleteMany({
      where: { storageKey: { startsWith: testPrefix } },
    })
    await prisma.adminUser.deleteMany({
      where: { email: 'gallery-upload-integration@example.com' },
    })
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('creates an asset and immediately exposes its published gallery record', async () => {
    const token = Date.now().toString(36)
    const slug = `${testPrefix}-${token}`
    const storageKey = `${testPrefix}/${token}.jpg`
    const url = `https://cdn.example.test/${storageKey}`

    const result = await createMediaAssetWithGalleryRecord({
      label: 'Integration Gallery Upload',
      storageKey,
      bucket: 'test-assets',
      url,
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      kind: 'image',
      altText: 'Integration gallery upload image',
      actorEmail: 'gallery-upload-integration@example.com',
      actorRole: 'moderator',
      gallery: {
        slug,
        title: 'Integration Gallery Upload',
        description: 'A temporary gallery publication used to verify the complete media handoff.',
        mediaType: 'image',
        imageUrl: url,
        imageAlt: 'Integration gallery upload image',
        category: 'outreach',
        status: 'published',
      },
    })

    expect(result.asset.storageKey).toBe(storageKey)
    expect(result.gallery).toMatchObject({ slug, imageUrl: url, status: 'published' })

    const published = await getPublishedGalleryImages()
    expect(published.some((item) => item.slug === slug && item.imageUrl === url)).toBe(true)
  })
})
