/**
 * V-Vault Security Regression Integration Tests
 * Covers rate limit, validation, and unauthorized access regressions.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals'
import * as authSession from '@/lib/auth/session'
import * as envLib from '@/lib/env'
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from '@/lib/admin/session'
import { createMockNextRequest, ensureAdminUser, parseResponseBody } from './setup'

describe('V-Vault security regressions', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('blocks vault submission after per-IP burst limit is exceeded', async () => {
    jest.spyOn(envLib, 'isVaultSubmissionsEnabled').mockReturnValue(true)
    jest.spyOn(authSession, 'getSession').mockResolvedValue(null)

    const { POST } = await import('@/app/api/vault/route')

    const ipSuffix = Math.floor(Math.random() * 200) + 20
    const ip = `198.51.100.${ipSuffix}`

    const responses = []
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const req = createMockNextRequest(
        'POST',
        '/api/vault',
        {
          category: 'Sexual Wellness',
          question: 'This question body is intentionally long enough to satisfy schema limits before auth checks.',
        },
        {
          'x-forwarded-for': ip,
        }
      )

      responses.push(await POST(req))
    }

    const last = responses[responses.length - 1]
    expect(last.status).toBe(429)
    expect(last.headers.get('Retry-After')).toBeTruthy()

    const body = await parseResponseBody(last)
    expect(String(body.error || '')).toContain('Too many requests')
  })

  it('rejects unauthenticated access to admin response endpoint', async () => {
    const request = createMockNextRequest('POST', '/api/admin/vault/submission-1/respond', {
      responseBody: 'This should never be accepted because there is no authenticated admin session.',
    })

    const { POST } = await import('@/app/api/admin/vault/[id]/respond/route')
    const response = await POST(request, { params: Promise.resolve({ id: 'submission-1' }) })

    expect(response.status).toBe(401)
    const body = await parseResponseBody(response)
    expect(body.error).toBe('Unauthorized')
  })

  it('rejects non-privileged admin role for response endpoint', async () => {
    // Responding requires editor or higher; a moderator must be blocked.
    await ensureAdminUser('moderator-regression@example.com', 'moderator')
    const moderatorToken = await createAdminSessionToken({
      email: 'moderator-regression@example.com',
      role: 'moderator',
    })

    const request = createMockNextRequest(
      'POST',
      '/api/admin/vault/submission-2/respond',
      {
        responseBody: 'This should be rejected because moderator role lacks editor-level moderation authority.',
      },
      {
        cookie: `${ADMIN_SESSION_COOKIE}=${moderatorToken}`,
      }
    )

    const { POST } = await import('@/app/api/admin/vault/[id]/respond/route')
    const response = await POST(request, { params: Promise.resolve({ id: 'submission-2' }) })

    expect(response.status).toBe(403)
    const body = await parseResponseBody(response)
    expect(body.code).toBe('permission_denied')
    expect(String(body.error || '')).toContain('editor')
  })

  it('rejects invalid response payload with schema validation', async () => {
    await ensureAdminUser('super-regression@example.com', 'super_admin')
    const superAdminToken = await createAdminSessionToken({
      email: 'super-regression@example.com',
      role: 'super_admin',
    })

    const request = createMockNextRequest(
      'POST',
      '/api/admin/vault/submission-3/respond',
      {
        responseBody: 'too short',
      },
      {
        cookie: `${ADMIN_SESSION_COOKIE}=${superAdminToken}`,
      }
    )

    const { POST } = await import('@/app/api/admin/vault/[id]/respond/route')
    const response = await POST(request, { params: Promise.resolve({ id: 'submission-3' }) })

    expect(response.status).toBe(400)
    const body = await parseResponseBody(response)
    expect(body.code).toBe('validation_failed')
    expect(body.error).toBe('Please fix the highlighted fields.')
    expect(body.fieldErrors?.responseBody?.length || 0).toBeGreaterThan(0)
  })

  it('rejects invalid vault submission payload when authenticated', async () => {
    jest.spyOn(envLib, 'isVaultSubmissionsEnabled').mockReturnValue(true)
    jest.spyOn(authSession, 'getSession').mockResolvedValue({
      userId: 'member-1',
      email: 'member1@example.com',
      displayName: 'Member One',
      role: 'member',
      isActive: true,
      emailVerified: true,
      iat: Math.floor(Date.now() / 1000),
    })

    const request = createMockNextRequest('POST', '/api/vault', {
      category: 'Sexual Wellness',
      question: 'too short',
    })

    const { POST } = await import('@/app/api/vault/route')
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await parseResponseBody(response)
    expect(body.code).toBe('validation_failed')
    expect(body.error).toBe('Please fix the highlighted fields.')
    expect(body.fieldErrors?.question?.length || 0).toBeGreaterThan(0)
  })
})
