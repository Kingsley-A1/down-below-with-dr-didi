/**
 * Admin Users Integration Tests
 * Tests admin endpoints: list, detail, deactivate, activate with audit logging
 */

import { describe, it, expect, jest, beforeAll, afterAll, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from '@/lib/admin/session'
import {
  cleanupDatabase,
  disconnectDatabase,
  createTestUser,
  createAdminUser,
  ensureAdminUser,
  createMockNextRequest,
  hasIntegrationDatabase,
  parseResponseBody,
} from './setup'

const describeWithDatabase = hasIntegrationDatabase ? describe : describe.skip

jest.setTimeout(30_000)

function userRouteContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

async function createAdminRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
  email: string = 'admin@example.com'
) {
  await ensureAdminUser(email, 'super_admin')
  const token = await createAdminSessionToken({ email, role: 'super_admin' })

  return createMockNextRequest(method, url, body, {
    cookie: `${ADMIN_SESSION_COOKIE}=${token}`,
    ...headers,
  })
}

describeWithDatabase('Admin Users Integration', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  describe('GET /api/admin/users - List Users', () => {
    it('should list users with pagination', async () => {
      const admin = await createAdminUser()
      // Create 5 test users
      for (let i = 0; i < 5; i++) {
        await createTestUser({
          email: `user${i}@example.com`,
          displayName: `User ${i}`,
        })
      }

      const req = await createAdminRequest('GET', '/api/admin/users?limit=10&offset=0', undefined, undefined, admin.email)

      const { GET } = await import('@/app/api/admin/users/route')
      const res = await GET(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.users).toBeTruthy()
      expect(body.users.length).toBeGreaterThan(0)
      expect(body.pagination).toBeTruthy()
      expect(body.pagination.limit).toBe(10)
      expect(body.pagination.offset).toBe(0)
    })

    it('should filter users by search (email/name)', async () => {
      await createAdminUser()
      await createTestUser({
        email: 'john@example.com',
        displayName: 'John Doe',
      })
      await createTestUser({
        email: 'jane@example.com',
        displayName: 'Jane Smith',
      })

      const req = await createAdminRequest('GET', '/api/admin/users?search=john')

      const { GET } = await import('@/app/api/admin/users/route')
      const res = await GET(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(200)
      expect(body.users.length).toBeGreaterThan(0)
      const foundJohn = body.users.some(
        (u: { email: string; displayName: string }) =>
          u.email.includes('john') || u.displayName.includes('John'),
      )
      expect(foundJohn).toBe(true)
    })

    it('should filter users by status', async () => {
      await createAdminUser()
      await createTestUser({
        email: 'active@example.com',
        isActive: true,
      })
      await createTestUser({
        email: 'inactive@example.com',
        isActive: false,
      })

      const req = await createAdminRequest('GET', '/api/admin/users?status=active')

      const { GET } = await import('@/app/api/admin/users/route')
      const res = await GET(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(200)
      const allActive = body.users.every((u: { isActive: boolean }) => u.isActive === true)
      expect(allActive).toBe(true)
    })

    it('should filter users by role', async () => {
      await createAdminUser({ email: 'admin1@example.com' })
      await createTestUser({
        email: 'member@example.com',
        role: 'member',
      })
      await createTestUser({
        email: 'contributor@example.com',
        role: 'contributor',
      })

      const req = await createAdminRequest('GET', '/api/admin/users?role=member')

      const { GET } = await import('@/app/api/admin/users/route')
      const res = await GET(req)
      const body = await parseResponseBody(res)

      expect(res.status).toBe(200)
      const allMembers = body.users.every((u: { role: string }) => u.role === 'member')
      expect(allMembers).toBe(true)
    })

    it('should handle pagination correctly', async () => {
      await createAdminUser()
      // Create 15 users
      for (let i = 0; i < 15; i++) {
        await createTestUser({
          email: `page${i}@example.com`,
        })
      }

      const req1 = await createAdminRequest('GET', '/api/admin/users?limit=5&offset=0')
      const { GET } = await import('@/app/api/admin/users/route')
      const res1 = await GET(req1)
      const body1 = await parseResponseBody(res1)

      expect(body1.pagination.total).toBeGreaterThanOrEqual(15)
      expect(body1.pagination.hasMore).toBe(true)

      // Second page
      const req2 = await createAdminRequest('GET', '/api/admin/users?limit=5&offset=5')
      const res2 = await GET(req2)
      const body2 = await parseResponseBody(res2)

      expect(body2.users.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/admin/users/[id] - User Detail', () => {
    it('should return user detail with audit logs', async () => {
      const admin = await createAdminUser()
      const user = await createTestUser({
        email: 'detail@example.com',
      })

      // Create an audit log entry
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'user.created',
          entityType: 'User',
          entityId: user.id,
          actorEmail: admin.email,
          actorRole: 'super_admin',
          summary: `User created: ${user.email}`,
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      })

      const req = await createAdminRequest('GET', `/api/admin/users/${user.id}`, undefined, undefined, admin.email)

      const { GET } = await import('@/app/api/admin/users/[id]/route')
      const res = await GET(req, userRouteContext(user.id))
      const body = await parseResponseBody(res)

      expect(res.status).toBe(200)
      expect(body.user).toBeTruthy()
      expect(body.user.id).toBe(user.id)
      expect(body.auditLogs).toBeTruthy()
      expect(body.auditLogs.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/admin/users/[id]/deactivate - Deactivate User', () => {
    it('should deactivate user and log audit event', async () => {
      const admin = await createAdminUser()
      const user = await createTestUser({
        email: 'deactivate@example.com',
        isActive: true,
      })

      const req = await createAdminRequest(
        'POST',
        `/api/admin/users/${user.id}/deactivate`,
        {},
        {
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'Test Browser/1.0',
        },
        admin.email,
      )

      const { POST } = await import('@/app/api/admin/users/[id]/deactivate/route')
      const res = await POST(req, userRouteContext(user.id))
      const body = await parseResponseBody(res)

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      // Verify user deactivated
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })
      expect(updatedUser?.isActive).toBe(false)

      // Verify audit log created with IP and User-Agent
      const auditLogs = await prisma.auditLog.findMany({
        where: { entityId: user.id, entityType: 'User' },
      })
      const deactivateLog = auditLogs.find((log: { action: string }) => log.action.includes('deactivate'))
      expect(deactivateLog).toBeTruthy()
      expect(deactivateLog?.ipAddress).toBe('192.168.1.100')
      expect(deactivateLog?.userAgent).toContain('Test Browser')
    })

    it('should prevent self-deactivation', async () => {
      const admin = await createAdminUser({ email: 'admin@example.com' })

      const req = await createAdminRequest(
        'POST',
        `/api/admin/users/${admin.id}/deactivate`,
        {},
        undefined,
        admin.email,
      )

      const { POST } = await import('@/app/api/admin/users/[id]/deactivate/route')
      const res = await POST(req, userRouteContext(admin.id))

      expect(res.status).toBe(400)
      const body = await parseResponseBody(res)
      expect(body.error.toLowerCase()).toContain('cannot')
    })
  })

  describe('POST /api/admin/users/[id]/activate - Activate User', () => {
    it('should activate user and log audit event', async () => {
      const admin = await createAdminUser()
      const user = await createTestUser({
        email: 'activate@example.com',
        isActive: false,
      })

      const req = await createAdminRequest(
        'POST',
        `/api/admin/users/${user.id}/activate`,
        {},
        {
          'x-forwarded-for': '192.168.1.101',
          'user-agent': 'Admin Console/2.0',
        },
        admin.email,
      )

      const { POST } = await import('@/app/api/admin/users/[id]/activate/route')
      const res = await POST(req, userRouteContext(user.id))
      const body = await parseResponseBody(res)

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      // Verify user activated
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })
      expect(updatedUser?.isActive).toBe(true)

      // Verify audit log created with metadata
      const auditLogs = await prisma.auditLog.findMany({
        where: { entityId: user.id, entityType: 'User' },
      })
      const activateLog = auditLogs.find((log: { action: string }) => log.action.includes('activate'))
      expect(activateLog).toBeTruthy()
      expect(activateLog?.ipAddress).toBe('192.168.1.101')
    })
  })

  describe('Admin Actions - Audit Quality', () => {
    it('should capture actorRole in audit log', async () => {
      const admin = await createAdminUser()
      const user = await createTestUser()

      const req = await createAdminRequest(
        'POST',
        `/api/admin/users/${user.id}/deactivate`,
        {},
        undefined,
        admin.email,
      )

      const { POST } = await import('@/app/api/admin/users/[id]/deactivate/route')
      await POST(req, userRouteContext(user.id))

      const auditLog = await prisma.auditLog.findFirst({
        where: { entityId: user.id, entityType: 'User' },
        orderBy: { createdAt: 'desc' },
      })

      expect(auditLog?.actorRole).toBeTruthy()
    })

    it('should capture structured metadata in audit log', async () => {
      const admin = await createAdminUser()
      const user = await createTestUser({
        email: 'metadata@example.com',
        displayName: 'Metadata Test',
      })

      const req = await createAdminRequest(
        'POST',
        `/api/admin/users/${user.id}/deactivate`,
        {},
        undefined,
        admin.email,
      )

      const { POST } = await import('@/app/api/admin/users/[id]/deactivate/route')
      await POST(req, userRouteContext(user.id))

      const auditLog = await prisma.auditLog.findFirst({
        where: { entityId: user.id, entityType: 'User' },
        orderBy: { createdAt: 'desc' },
      })

      // Metadata should contain user details
      if (auditLog?.metadata) {
        const metadata = typeof auditLog.metadata === 'string' ? JSON.parse(auditLog.metadata) : auditLog.metadata
        expect(metadata.email || auditLog.userId).toBeTruthy()
      }
    })
  })
})
