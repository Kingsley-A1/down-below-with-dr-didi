import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { appErrors } from '@/lib/app-error'

const mockVerifyAdminSession = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockValidateAdminSessionWithDatabase = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockCreateEvent = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockGetAllEvents = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockUpdateLibraryArticle = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockDeleteLibraryArticle = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockGetAllReviews = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockCreateAdminReview = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockGetR2Client = jest.fn<(...args: unknown[]) => unknown>()

jest.mock('@/lib/admin/session', () => ({
  ADMIN_SESSION_COOKIE: 'dbfh_admin_session',
  verifyAdminSession: (...args: unknown[]) => mockVerifyAdminSession(...args),
}))

jest.mock('@/lib/admin/session-validation', () => ({
  validateAdminSessionWithDatabase: (...args: unknown[]) => mockValidateAdminSessionWithDatabase(...args),
}))

jest.mock('@/lib/admin/repository', () => ({
  createEvent: (...args: unknown[]) => mockCreateEvent(...args),
  getAllEvents: (...args: unknown[]) => mockGetAllEvents(...args),
}))

jest.mock('@/lib/library/repository', () => ({
  updateLibraryArticle: (...args: unknown[]) => mockUpdateLibraryArticle(...args),
  deleteLibraryArticle: (...args: unknown[]) => mockDeleteLibraryArticle(...args),
}))

jest.mock('@/lib/reviews/repository', () => ({
  getAllReviews: (...args: unknown[]) => mockGetAllReviews(...args),
  createAdminReview: (...args: unknown[]) => mockCreateAdminReview(...args),
}))

jest.mock('@/lib/storage/r2', () => ({
  buildAssetStorageKey: () => 'media/2026/test-image.png',
  buildPublicAssetUrl: () => 'https://cdn.example.test/media/2026/test-image.png',
  getR2Client: (...args: unknown[]) => mockGetR2Client(...args),
}))

function setAdminRole(role: 'super_admin' | 'founder_admin' | 'editor' | 'moderator') {
  const session = {
    email: `${role}@example.com`,
    role,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    tokenVersion: 0,
  }

  mockVerifyAdminSession.mockResolvedValue(session)
  mockValidateAdminSessionWithDatabase.mockResolvedValue(session)
}

function createJsonRequest(method: string, url: string, body?: Record<string, unknown>) {
  return new NextRequest(new URL(url, 'https://www.down-below.test'), {
    method,
    headers: {
      'content-type': 'application/json',
      cookie: 'dbfh_admin_session=test-session',
      'x-request-id': 'test-request-id',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

async function readBody(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

const validEventPayload = {
  slug: 'community-health-day',
  title: 'Community Health Day',
  summary: 'A public outreach event for family health education.',
  sortOrder: 2,
  status: 'published',
}

describe('admin API typed error mapping', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>

  beforeEach(() => {
    jest.resetAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    setAdminRole('super_admin')
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  function expectLoggedApiError(expected: {
    code: string
    route: string
    requestId: string
    email?: string
    role?: string
  }) {
    const call = consoleErrorSpy.mock.calls.find(([event]) => event === '[api.error]')
    expect(call).toBeDefined()

    const payload = call?.[1] as Record<string, unknown>
    expect(payload).toMatchObject({
      code: expected.code,
      route: expected.route,
      requestId: expected.requestId,
    })

    if (expected.email || expected.role) {
      expect(payload.identity).toMatchObject({
        ...(expected.email ? { email: expected.email } : {}),
        ...(expected.role ? { role: expected.role } : {}),
      })
    }
  }

  it('maps duplicate event sort order to validation_failed with sortOrder field errors', async () => {
    const message = 'Sort order 2 is already used by "Existing Outreach". Choose another position.'
    mockCreateEvent.mockRejectedValue(appErrors.validation(message, { sortOrder: [message] }))

    const { POST } = await import('@/app/api/admin/events/route')
    const response = await POST(createJsonRequest('POST', '/api/admin/events', validEventPayload))
    const body = await readBody(response)

    expect(response.status).toBe(400)
    expect(body.code).toBe('validation_failed')
    expect(body.error).toBe(message)
    expect((body.fieldErrors as Record<string, string[]>)?.sortOrder?.[0]).toBe(message)
  })

  it('maps typed not-found repository errors to a 404 route response', async () => {
    mockUpdateLibraryArticle.mockRejectedValue(appErrors.notFound('Library article not found'))

    const { PUT } = await import('@/app/api/admin/library/[id]/route')
    const response = await PUT(
      createJsonRequest('PUT', '/api/admin/library/missing-article', {
        title: 'A Valid Article Title',
      }),
      { params: Promise.resolve({ id: 'missing-article' }) }
    )
    const body = await readBody(response)

    expect(response.status).toBe(404)
    expect(body.code).toBe('not_found')
    expect(body.error).toBe('Library article not found')
  })

  it('maps typed database-unavailable errors to a 503 route response', async () => {
    mockGetAllReviews.mockRejectedValue(appErrors.databaseUnavailable())

    const { GET } = await import('@/app/api/admin/reviews/route')
    const response = await GET(createJsonRequest('GET', '/api/admin/reviews'))
    const body = await readBody(response)

    expect(response.status).toBe(503)
    expect(body.code).toBe('database_unavailable')
    expect(body.error).toContain('database')
    expect(body.requestId).toBe('test-request-id')
    expect(response.headers.get('X-Request-ID')).toBe('test-request-id')
    expect(body.action).toContain('DATABASE_URL')
    expectLoggedApiError({
      code: 'database_unavailable',
      route: '/api/admin/reviews',
      requestId: 'test-request-id',
      email: 'super_admin@example.com',
      role: 'super_admin',
    })
  })

  it('maps typed R2-unavailable errors to a 503 route response', async () => {
    mockGetR2Client.mockImplementation(() => {
      throw appErrors.storageUnavailable()
    })

    const { POST } = await import('@/app/api/admin/media/presign/route')
    const response = await POST(
      createJsonRequest('POST', '/api/admin/media/presign', {
        fileName: 'event-photo.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
        label: 'Event photo',
        altText: 'Community health outreach photo',
      })
    )
    const body = await readBody(response)

    expect(response.status).toBe(503)
    expect(body.code).toBe('storage_unavailable')
    expect(body.error).toContain('Media storage')
    expect(body.requestId).toBe('test-request-id')
    expect(response.headers.get('X-Request-ID')).toBe('test-request-id')
    expect(body.action).toContain('Cloudflare R2')
    expectLoggedApiError({
      code: 'storage_unavailable',
      route: '/api/admin/media/presign',
      requestId: 'test-request-id',
      email: 'super_admin@example.com',
      role: 'super_admin',
    })
  })

  it('maps unexpected repository failures to sanitized 500 responses with a logged request ID', async () => {
    mockCreateAdminReview.mockRejectedValue(new Error('raw private database failure'))

    const { POST } = await import('@/app/api/admin/reviews/route')
    const response = await POST(
      createJsonRequest('POST', '/api/admin/reviews', {
        displayName: 'Aisha Bello',
        rating: 5,
        body: 'This review is long enough to pass validation and still remain realistic for a team-created testimonial.',
        status: 'published',
        sortOrder: 3,
      })
    )
    const body = await readBody(response)

    expect(response.status).toBe(500)
    expect(body.code).toBe('server_error')
    expect(body.error).toBe('Failed to create review')
    expect(String(body.error)).not.toContain('raw private')
    expect(body.requestId).toBe('test-request-id')
    expect(response.headers.get('X-Request-ID')).toBe('test-request-id')
    expectLoggedApiError({
      code: 'server_error',
      route: '/api/admin/reviews',
      requestId: 'test-request-id',
      email: 'super_admin@example.com',
      role: 'super_admin',
    })
  })

  it('returns permission_denied before a route reaches repository work', async () => {
    // Library management is top-level (founder_admin) only; an editor is denied
    // by the role guard before any repository call runs.
    setAdminRole('editor')

    const { PUT } = await import('@/app/api/admin/library/[id]/route')
    const response = await PUT(
      createJsonRequest('PUT', '/api/admin/library/article-1', { title: 'Updated title' }),
      { params: Promise.resolve({ id: 'article-1' }) }
    )
    const body = await readBody(response)

    expect(response.status).toBe(403)
    expect(body.code).toBe('permission_denied')
    expect(body.error).toContain('founder_admin')
    expect(mockUpdateLibraryArticle).not.toHaveBeenCalled()
  })
})
