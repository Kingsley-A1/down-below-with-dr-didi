/**
 * Auth Email Verification Integration Tests
 * Tests email verification flow with token expiry enforcement
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
} from './setup'

const describeWithDatabase = hasIntegrationDatabase ? describe : describe.skip

jest.setTimeout(30_000)

describeWithDatabase('Auth Email Verification Integration', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  describe('POST /api/auth/verify-email - Success Path', () => {
    it('should verify email with valid token', async () => {
      const token = 'valid-test-token-' + Math.random()
      await createTestUser({
        email: 'verify@example.com',
        emailVerified: false,
        emailVerifyToken: token,
        emailVerifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      })

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'verify@example.com',
        token: token,
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      // Verify user marked as verified
      const verifiedUser = await prisma.user.findUnique({
        where: { email: 'verify@example.com' },
      })
      expect(verifiedUser?.emailVerified).toBe(true)
      expect(verifiedUser?.emailVerifyToken).toBeNull()
    })

    it('should not verify if already verified', async () => {
      await createTestUser({
        email: 'already@example.com',
        emailVerified: true,
        emailVerifyToken: null,
      })

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'already@example.com',
        token: 'some-token',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/verify-email - Token Expiry Enforcement', () => {
    it('should reject expired email verification token', async () => {
      const token = 'expired-test-token-' + Math.random()
      await createTestUser({
        email: 'expired@example.com',
        emailVerified: false,
        emailVerifyToken: token,
        emailVerifyTokenExpiry: new Date(Date.now() - 1000), // 1 second in the past (expired)
      })

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'expired@example.com',
        token: token,
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(400)
      expect(body.error).toContain('expired')

      // Verify user NOT marked as verified
      const stillUnverified = await prisma.user.findUnique({
        where: { email: 'expired@example.com' },
      })
      expect(stillUnverified?.emailVerified).toBe(false)
    })

    it('should accept token that expires in future', async () => {
      const token = 'future-test-token-' + Math.random()
      const expiryTime = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours
      await createTestUser({
        email: 'future@example.com',
        emailVerified: false,
        emailVerifyToken: token,
        emailVerifyTokenExpiry: expiryTime,
      })

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'future@example.com',
        token: token,
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(200)
      const body = await parseResponseBody(res)
      expect(body.success).toBe(true)
    })

    it('should reject at exactly expiry time', async () => {
      const token = 'exact-test-token-' + Math.random()
      const expiryTime = new Date() // Current time (should be considered expired)
      await createTestUser({
        email: 'exact@example.com',
        emailVerified: false,
        emailVerifyToken: token,
        emailVerifyTokenExpiry: expiryTime,
      })

      // Wait a tiny bit to ensure current time passes expiry
      await new Promise((resolve) => setTimeout(resolve, 10))

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'exact@example.com',
        token: token,
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/verify-email - Invalid Cases', () => {
    it('should reject invalid token', async () => {
      await createTestUser({
        email: 'token@example.com',
        emailVerifyToken: 'correct-token',
      })

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'token@example.com',
        token: 'wrong-token',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })

    it('should reject non-existent user', async () => {
      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'nonexistent@example.com',
        token: 'some-token',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })

    it('should reject missing token', async () => {
      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'test@example.com',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })
})
