/**
 * Auth Email Verification Integration Tests
 * Tests the 6-digit code verification flow with expiry enforcement.
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
    it('should verify email with valid code', async () => {
      await createTestUser({
        email: 'verify@example.com',
        emailVerified: false,
        emailVerifyToken: '123456',
        emailVerifyTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      })

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'verify@example.com',
        code: '123456',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

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
        code: '123456',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/verify-email - Code Expiry Enforcement', () => {
    it('should reject expired verification code', async () => {
      await createTestUser({
        email: 'expired@example.com',
        emailVerified: false,
        emailVerifyToken: '654321',
        emailVerifyTokenExpiry: new Date(Date.now() - 1000), // 1 second in the past (expired)
      })

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'expired@example.com',
        code: '654321',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(400)
      expect(body.error).toContain('expired')

      const stillUnverified = await prisma.user.findUnique({
        where: { email: 'expired@example.com' },
      })
      expect(stillUnverified?.emailVerified).toBe(false)
    })

    it('should accept code that expires in future', async () => {
      await createTestUser({
        email: 'future@example.com',
        emailVerified: false,
        emailVerifyToken: '246810',
        emailVerifyTokenExpiry: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      })

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'future@example.com',
        code: '246810',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(200)
      const body = await parseResponseBody(res)
      expect(body.success).toBe(true)
    })

    it('should reject at exactly expiry time', async () => {
      await createTestUser({
        email: 'exact@example.com',
        emailVerified: false,
        emailVerifyToken: '135790',
        emailVerifyTokenExpiry: new Date(), // Current time (should be considered expired)
      })

      // Wait a tiny bit to ensure current time passes expiry
      await new Promise((resolve) => setTimeout(resolve, 10))

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'exact@example.com',
        code: '135790',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/verify-email - Invalid Cases', () => {
    it('should reject wrong code', async () => {
      await createTestUser({
        email: 'code@example.com',
        emailVerified: false,
        emailVerifyToken: '111111',
        emailVerifyTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      })

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'code@example.com',
        code: '222222',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })

    it('should reject non-existent user', async () => {
      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'nonexistent@example.com',
        code: '123456',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })

    it('should reject missing code', async () => {
      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'test@example.com',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })

    it('should reject malformed (non 6-digit) code', async () => {
      await createTestUser({
        email: 'malformed@example.com',
        emailVerified: false,
        emailVerifyToken: '123456',
        emailVerifyTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      })

      const req = createMockNextRequest('POST', '/api/auth/verify-email', {
        email: 'malformed@example.com',
        code: 'abc',
      })

      const { POST } = await import('@/app/api/auth/verify-email/route')
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })
})
