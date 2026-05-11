/**
 * Auth Login Integration Tests
 * Tests login flow with rate limiting, account lockout, and session management
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
  validLoginPayload,
} from './setup'

jest.mock('@/lib/auth/session', () => ({
  createSession: jest.fn(async () => undefined),
}))

const describeWithDatabase = hasIntegrationDatabase ? describe : describe.skip

jest.setTimeout(30_000)

describeWithDatabase('Auth Login Integration', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  describe('POST /api/auth/login - Success Path', () => {
    it('should login user with valid credentials', async () => {
      const user = await createTestUser({
        email: validLoginPayload.email,
        emailVerified: true,
      })

      const req = createMockNextRequest('POST', '/api/auth/login', {
        email: validLoginPayload.email,
        password: 'TestPassword@123',
      })

      const { POST } = await import('@/app/api/auth/login/route')
      const res = await POST(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(String(body.message).toLowerCase()).toContain('login')

      // Verify failed attempts reset
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })
      expect(updatedUser?.failedLoginAttempts).toBe(0)
      expect(updatedUser?.lockoutUntil).toBeNull()
    })
  })

  describe('POST /api/auth/login - Failed Attempts & Lockout', () => {
    it('should increment failed login attempts on wrong password', async () => {
      const user = await createTestUser({
        email: 'locktest@example.com',
        emailVerified: true,
      })

      const wrongPasswordReq = createMockNextRequest('POST', '/api/auth/login', {
        email: 'locktest@example.com',
        password: 'WrongPassword@123',
      })

      const { POST } = await import('@/app/api/auth/login/route')
      const res = await POST(wrongPasswordReq)

      expect(res.status).toBe(401)

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })
      expect(updatedUser?.failedLoginAttempts).toBe(1)
    })

    it('should lock account after 5 failed attempts', async () => {
      const user = await createTestUser({
        email: 'locktest5@example.com',
        emailVerified: true,
      })

      const { POST } = await import('@/app/api/auth/login/route')

      const responses = []

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        const req = createMockNextRequest('POST', '/api/auth/login', {
          email: 'locktest5@example.com',
          password: 'WrongPassword@123',
        })
        responses.push(await POST(req))
      }

      // 5th attempt triggers account lockout, 6th is still blocked (lockout and/or rate limit)
      expect(responses[4].status).toBe(429)
      const body5 = await parseResponseBody(responses[4])
      expect(String(body5.error).toLowerCase()).toContain('locked')

      const req6 = createMockNextRequest('POST', '/api/auth/login', {
        email: 'locktest5@example.com',
        password: 'WrongPassword@123',
      })
      const res6 = await POST(req6)

      expect(res6.status).toBe(429)
      const body = await parseResponseBody(res6)
      expect(String(body.error).toLowerCase()).toMatch(/locked|too many login attempts/)

      // Verify lockoutUntil is set
      const lockedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })
      expect(lockedUser?.lockoutUntil).toBeTruthy()
      expect(lockedUser?.failedLoginAttempts).toBe(5)
    })

    it('should return Retry-After header when account locked', async () => {
      const user = await createTestUser({
        email: 'retryafter@example.com',
        emailVerified: true,
        isActive: true,
      })

      // Set lockout
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lockoutUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          failedLoginAttempts: 5,
        },
      })

      const req = createMockNextRequest('POST', '/api/auth/login', {
        email: 'retryafter@example.com',
        password: 'TestPassword@123',
      })

      const { POST } = await import('@/app/api/auth/login/route')
      const res = await POST(req)

      expect(res.status).toBe(429)
      const retryAfter = res.headers.get('Retry-After')
      expect(retryAfter).toBeTruthy()
      expect(parseInt(retryAfter || '0')).toBeGreaterThan(0)
      expect(parseInt(retryAfter || '0')).toBeLessThanOrEqual(1800) // Max 30 minutes
    })
  })

  describe('POST /api/auth/login - Rate Limiting', () => {
    it('should enforce rate limit: 5 login attempts per 15 minutes', async () => {
      const { POST } = await import('@/app/api/auth/login/route')

      const responses = []
      for (let i = 0; i < 6; i++) {
        const req = createMockNextRequest('POST', '/api/auth/login', {
          email: 'ratelimit-user@example.com',
          password: 'SomePassword@123',
        })
        const res = await POST(req)
        responses.push(res)
      }

      // First 5 should get through to validation (not all will succeed)
      expect(responses[0].status).toBeLessThan(500)
      expect(responses[1].status).toBeLessThan(500)
      expect(responses[2].status).toBeLessThan(500)
      expect(responses[3].status).toBeLessThan(500)
      expect(responses[4].status).toBeLessThan(500)

      // 6th should be rate limited
      expect(responses[5].status).toBe(429)
    })
  })

  describe('POST /api/auth/login - Inactive Users', () => {
    it('should reject login for deactivated user', async () => {
      await createTestUser({
        email: 'inactive@example.com',
        isActive: false,
        emailVerified: true,
      })

      const req = createMockNextRequest('POST', '/api/auth/login', {
        email: 'inactive@example.com',
        password: 'TestPassword@123',
      })

      const { POST } = await import('@/app/api/auth/login/route')
      const res = await POST(req)

      expect(res.status).toBe(401)
      const body = await parseResponseBody(res)
      expect(body.error).toContain('Invalid email or password')
    })

  })

  describe('POST /api/auth/login - Session Updates Activity', () => {
    it('should update lastActivityAt on successful login', async () => {
      const user = await createTestUser({
        email: 'activity@example.com',
        emailVerified: true,
      })

      const oldActivityTime = user.lastActivityAt.getTime()

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 100))

      const req = createMockNextRequest('POST', '/api/auth/login', {
        email: 'activity@example.com',
        password: 'TestPassword@123',
      })

      const { POST } = await import('@/app/api/auth/login/route')
      const res = await POST(req)
      expect(res.status).toBe(200)

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })
      const newActivityTime = updatedUser?.lastActivityAt?.getTime() || 0

      expect(newActivityTime).toBeGreaterThan(oldActivityTime)
    })
  })
})
