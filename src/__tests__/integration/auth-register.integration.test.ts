/**
 * Auth Registration Integration Tests
 * Tests registration flow with validation, rate limiting, and email verification
 */

import { describe, it, expect, jest, beforeAll, afterAll, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import {
  cleanupDatabase,
  disconnectDatabase,
  createTestUser,
  createMockNextRequest,
  hasIntegrationDatabase,
  parseResponseBody,
  validRegistrationPayload,
  invalidPayloads,
} from './setup'

const describeWithDatabase = hasIntegrationDatabase ? describe : describe.skip

jest.setTimeout(30_000)

describeWithDatabase('Auth Registration Integration', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  describe('POST /api/auth/register - Success Path', () => {
    it('should register new user with valid payload', async () => {
      const req = createMockNextRequest('POST', '/api/auth/register', validRegistrationPayload)

      // Import and call the route handler
      const { POST } = await import('@/app/api/auth/register/route')
      const res = await POST(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(201)
      expect(body.success).toBe(true)
      expect(String(body.message).toLowerCase()).toContain('sign in')
      expect(body.user?.id).toBeTruthy()
      expect(body.requiresEmailVerification).toBe(true)

      // Verify user created in database in PENDING_VERIFICATION state per the
      // SecDevOps redesign: emailVerified starts false; verify-email flips it.
      const user = await prisma.user.findUnique({
        where: { email: validRegistrationPayload.email },
      })
      expect(user).toBeTruthy()
      expect(user?.emailVerified).toBe(false)
      expect(user?.emailVerifyToken).toBeTruthy()
    })

    it('should accept registration without phone', async () => {
      const payload = {
        email: 'nophone@example.com',
        displayName: 'No Phone User',
        password: 'TestPassword@123',
        confirmPassword: 'TestPassword@123',
      }

      const req = createMockNextRequest('POST', '/api/auth/register', payload)
      const { POST } = await import('@/app/api/auth/register/route')
      const res = await POST(req)

      expect(res.status).toBe(201)
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
      })
      expect(user?.phone).toBeNull()
    })
  })

  describe('POST /api/auth/register - Validation Failures', () => {
    it('should reject duplicate email', async () => {
      // Create existing user
      await createTestUser({ email: validRegistrationPayload.email })

      const req = createMockNextRequest('POST', '/api/auth/register', validRegistrationPayload)
      const { POST } = await import('@/app/api/auth/register/route')
      const res = await POST(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(409)
      expect(body.success).toBe(false)
      expect(body.error).toContain('email')
    })

    it('should reject invalid email format', async () => {
      const req = createMockNextRequest(
        'POST',
        '/api/auth/register',
        invalidPayloads.invalidEmail,
      )
      const { POST } = await import('@/app/api/auth/register/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
      const body = await parseResponseBody(res)
      expect(body.success).toBe(false)
    })

    it('should reject weak password', async () => {
      const req = createMockNextRequest(
        'POST',
        '/api/auth/register',
        invalidPayloads.weakPassword,
      )
      const { POST } = await import('@/app/api/auth/register/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
      const body = await parseResponseBody(res)
      expect(body.success).toBe(false)
      expect(body.code).toBe('validation_failed')
      expect(body.error).toBe('Please fix the highlighted fields.')
      expect(body.fieldErrors?.password?.length || 0).toBeGreaterThan(0)
    })

    it('should reject mismatched passwords', async () => {
      const req = createMockNextRequest(
        'POST',
        '/api/auth/register',
        invalidPayloads.passwordMismatch,
      )
      const { POST } = await import('@/app/api/auth/register/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/register - Rate Limiting', () => {
    it('should enforce rate limit: 3 registrations per hour', async () => {
      const responses = []

      for (let i = 0; i < 4; i++) {
        const payload = {
          ...validRegistrationPayload,
          email: `user${i}@example.com`,
        }
        const req = createMockNextRequest('POST', '/api/auth/register', payload)
        const { POST } = await import('@/app/api/auth/register/route')
        const res = await POST(req)
        responses.push(res)
      }

      // First 3 should succeed
      expect(responses[0].status).toBe(201)
      expect(responses[1].status).toBe(201)
      expect(responses[2].status).toBe(201)

      // 4th should be rate limited
      expect(responses[3].status).toBe(429)
      const body = await parseResponseBody(responses[3])
      expect(String(body.error).toLowerCase()).toContain('too many registration attempts')

      // Verify Retry-After header
      const retryAfter = responses[3].headers.get('Retry-After')
      expect(retryAfter).toBeTruthy()
      expect(parseInt(retryAfter || '0')).toBeGreaterThan(0)
    })
  })

  describe('POST /api/auth/register - Pending Verification', () => {
    it('should create user in unverified state with a fresh email verification token', async () => {
      const req = createMockNextRequest('POST', '/api/auth/register', validRegistrationPayload)
      const { POST } = await import('@/app/api/auth/register/route')
      await POST(req)

      const user = await prisma.user.findUnique({
        where: { email: validRegistrationPayload.email },
      })

      expect(user?.emailVerified).toBe(false)
      expect(user?.emailVerifyToken).toBeTruthy()
      expect(user?.emailVerifyTokenExpiry).toBeTruthy()
      // Token expiry should be in the future (24h window per spec).
      const expiry = user?.emailVerifyTokenExpiry
      expect(expiry && expiry.getTime() > Date.now()).toBe(true)
    })
  })
})
