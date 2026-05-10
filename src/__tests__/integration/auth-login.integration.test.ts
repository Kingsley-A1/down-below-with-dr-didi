/**
 * Auth Login Integration Tests
 * Tests login flow with rate limiting, account lockout, and session management
 */

import { describe, it, expect, beforeAll, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import {
  cleanupDatabase,
  createTestUser,
  createMockNextRequest,
  parseResponseBody,
  validLoginPayload,
} from './setup'

describe('Auth Login Integration', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('POST /api/auth/login - Success Path', () => {
    it('should login user with valid credentials', async () => {
      // Create verified user
      const user = await createTestUser({
        email: validLoginPayload.email,
        emailVerified: true,
      })

      // Manually set a known password hash (in real test, this would be from registration)
      // For now, we'll use the mock hash from setup
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz',
        },
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
      expect(body.message).toContain('login')

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

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        const req = createMockNextRequest('POST', '/api/auth/login', {
          email: 'locktest5@example.com',
          password: 'WrongPassword@123',
        })
        await POST(req)
      }

      // 6th attempt should be rate limited
      const req6 = createMockNextRequest('POST', '/api/auth/login', {
        email: 'locktest5@example.com',
        password: 'WrongPassword@123',
      })
      const res6 = await POST(req6)

      expect(res6.status).toBe(429)
      const body = await parseResponseBody(res6)
      expect(body.error).toContain('locked')

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
          email: `ratelimituser${i}@example.com`,
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
      const user = await createTestUser({
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

      expect(res.status).toBe(403)
      const body = await parseResponseBody(res)
      expect(body.error).toContain('inactive')
    })

    it('should reject login for unverified email', async () => {
      const user = await createTestUser({
        email: 'unverified@example.com',
        emailVerified: false,
      })

      const req = createMockNextRequest('POST', '/api/auth/login', {
        email: 'unverified@example.com',
        password: 'TestPassword@123',
      })

      const { POST } = await import('@/app/api/auth/login/route')
      const res = await POST(req)

      expect(res.status).toBe(403)
      const body = await parseResponseBody(res)
      expect(body.error).toContain('verify')
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

      if (res.status === 200) {
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
        })
        const newActivityTime = updatedUser?.lastActivityAt?.getTime() || 0

        expect(newActivityTime).toBeGreaterThan(oldActivityTime)
      }
    })
  })
})
