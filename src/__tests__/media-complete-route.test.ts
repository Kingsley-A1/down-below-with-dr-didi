import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const mockVerifyAdminSession = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockValidateAdminSessionWithDatabase = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockCreateMediaAssetWithGalleryRecord = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockRevalidatePath = jest.fn<(path: string) => void>()

jest.mock('@/lib/admin/session', () => ({
  ADMIN_SESSION_COOKIE: 'dbfh_admin_session',
  verifyAdminSession: (...args: unknown[]) => mockVerifyAdminSession(...args),
}))

jest.mock('@/lib/admin/session-validation', () => ({
  validateAdminSessionWithDatabase: (...args: unknown[]) => mockValidateAdminSessionWithDatabase(...args),
}))

jest.mock('@/lib/admin/repository', () => ({
  createMediaAssetWithGalleryRecord: (...args: unknown[]) =>
    mockCreateMediaAssetWithGalleryRecord(...args),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (path: string) => mockRevalidatePath(path),
}))

function createRequest(body: Record<string, unknown>) {
  return new NextRequest('https://www.down-below.test/api/admin/media/complete', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: 'dbfh_admin_session=test-session',
    },
    body: JSON.stringify(body),
  })
}

const basePayload = {
  label: 'Community Outreach',
  storageKey: 'media/2026/uploaded-image.jpg',
  bucket: 'down-below-assets',
  url: 'https://cdn.example.test/media/2026/uploaded-image.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 2048,
  altText: 'Community health outreach event',
}

const galleryPayload = {
  slug: 'community-outreach-upload',
  title: 'Community Outreach Upload',
  description: 'A community health outreach event hosted by DownBelow Family Health Initiative.',
  mediaType: 'image',
  featured: false,
  imageAlt: 'Community health outreach event',
  category: 'outreach',
  status: 'published',
}

describe('media upload completion', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    const session = {
      email: 'moderator@example.com',
      role: 'moderator',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      tokenVersion: 0,
    }

    mockVerifyAdminSession.mockResolvedValue(session)
    mockValidateAdminSessionWithDatabase.mockResolvedValue(session)
    mockCreateMediaAssetWithGalleryRecord.mockResolvedValue({
      asset: { id: 'asset-1', ...basePayload },
      gallery: { id: 'gallery-1', slug: galleryPayload.slug },
    })
  })

  it('creates the media asset and published gallery record through one repository call', async () => {
    const { POST } = await import('@/app/api/admin/media/complete/route')
    const response = await POST(createRequest({ ...basePayload, gallery: galleryPayload }))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.gallery).toMatchObject({ id: 'gallery-1', slug: galleryPayload.slug })
    expect(mockCreateMediaAssetWithGalleryRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        label: basePayload.label,
        actorEmail: 'moderator@example.com',
        gallery: expect.objectContaining({
          slug: galleryPayload.slug,
          imageUrl: basePayload.url,
          status: 'published',
        }),
      })
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/gallery')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
  })

  it('still creates a gallery publication when upload metadata is provided without an explicit status', async () => {
    const { POST } = await import('@/app/api/admin/media/complete/route')
    const response = await POST(
      createRequest({
        ...basePayload,
        gallery: {
          ...galleryPayload,
          status: undefined,
        },
      })
    )

    expect(response.status).toBe(201)
    expect(mockCreateMediaAssetWithGalleryRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        gallery: expect.objectContaining({
          slug: galleryPayload.slug,
          imageUrl: basePayload.url,
        }),
      })
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/gallery')
  })

  it('rejects invalid gallery metadata before creating database records', async () => {
    const { POST } = await import('@/app/api/admin/media/complete/route')
    const response = await POST(
      createRequest({
        ...basePayload,
        gallery: { ...galleryPayload, title: 'Bad' },
      })
    )

    expect(response.status).toBe(400)
    expect(mockCreateMediaAssetWithGalleryRecord).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('requires at least ten description characters', async () => {
    const { POST } = await import('@/app/api/admin/media/complete/route')
    const response = await POST(
      createRequest({
        ...basePayload,
        gallery: { ...galleryPayload, description: 'Too short' },
      })
    )

    expect(response.status).toBe(400)
    expect(mockCreateMediaAssetWithGalleryRecord).not.toHaveBeenCalled()
  })
})
