/**
 * Auth Registration Integration Tests
 * Tests registration flow with validation, rate limiting, and email verification
 */

import { describe, it, expect, beforeAll, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import {
  cleanupDatabase,
  createTestUser,
  createMockNextRequest,
  parseResponseBody,
  validRegistrationPayload,
  invalidPayloads,
} from './setup'

describe('Auth Registration Integration', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
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
      expect(body.message).toContain('verification')
      expect(body.userId).toBeTruthy()

      // Verify user created in database
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
      expect(body.error).toContain('password')
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
      expect(body.error).toContain('rate limit')

      // Verify Retry-After header
      const retryAfter = responses[3].headers.get('Retry-After')
      expect(retryAfter).toBeTruthy()
      expect(parseInt(retryAfter || '0')).toBeGreaterThan(0)
    })
  })

  describe('POST /api/auth/register - Email Verification Expiry', () => {
    it('should set email verification token expiry to 24 hours', async () => {
      const req = createMockNextRequest('POST', '/api/auth/register', validRegistrationPayload)
      const { POST } = await import('@/app/api/auth/register/route')
      await POST(req)

      const user = await prisma.user.findUnique({
        where: { email: validRegistrationPayload.email },
      })

      expect(user?.emailVerifyTokenExpiry).toBeTruthy()
      const expiryTime = user?.emailVerifyTokenExpiry?.getTime() || 0
      const createdTime = user?.createdAt?.getTime() || 0
      const diffHours = (expiryTime - createdTime) / (60 * 60 * 1000)

      // Should be approximately 24 hours (allow ±1 hour for execution time)
      expect(diffHours).toBeGreaterThanOrEqual(23)
      expect(diffHours).toBeLessThanOrEqual(25)
    })
  })
})
