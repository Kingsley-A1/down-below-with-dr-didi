import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin/session'
import {
  cleanupDatabase,
  createMockNextRequest,
  disconnectDatabase,
  hasIntegrationDatabase,
  parseResponseBody,
} from './setup'

const describeWithDatabase = hasIntegrationDatabase ? describe : describe.skip

jest.setTimeout(30_000)

const adminCodes = {
  super_admin: process.env.ADMIN_SUPER_ADMIN_ACCESS_CODE ?? '741206',
  founder_admin: process.env.ADMIN_FOUNDER_ADMIN_ACCESS_CODE ?? '483951',
  editor: process.env.ADMIN_EDITOR_ACCESS_CODE ?? '265804',
}

describeWithDatabase('Admin Auth Integration', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('registers a super admin account with a valid role code', async () => {
    const req = createMockNextRequest('POST', '/api/admin/register', {
      name: 'Super Admin',
      email: 'super-admin@example.com',
      phone: '+2348012345678',
      password: 'AdminPass@123',
      confirmPassword: 'AdminPass@123',
      accessCode: adminCodes.super_admin,
    })

    const { POST } = await import('@/app/api/admin/register/route')
    const res = await POST(req)
    const body = await parseResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.role).toBe('super_admin')
    expect(body.requiresEmailVerification).toBe(true)
    expect(res.cookies.get(ADMIN_SESSION_COOKIE)?.value).toBeUndefined()

    const account = await prisma.adminUser.findUnique({
      where: { email: 'super-admin@example.com' },
    })

    expect(account).toBeTruthy()
    expect(account?.name).toBe('Super Admin')
    expect(account?.phone).toBe('+2348012345678')
    expect(account?.role).toBe('super_admin')
    expect(account?.passwordHash).toBeTruthy()
  })

  it('rejects registration with an invalid role code', async () => {
    const req = createMockNextRequest('POST', '/api/admin/register', {
      name: 'Blocked Admin',
      email: 'blocked-admin@example.com',
      phone: '+2348012345678',
      password: 'AdminPass@123',
      confirmPassword: 'AdminPass@123',
      accessCode: '000000',
    })

    const { POST } = await import('@/app/api/admin/register/route')
    const res = await POST(req)
    const body = await parseResponseBody(res)

    expect(res.status).toBe(401)
    expect(body.error).toContain('denied')
  })

  it('signs in a registered founder admin with email and password', async () => {
    const passwordHash = await hashPassword('FounderPass@123')

    await prisma.adminUser.create({
      data: {
        email: 'founder-admin@example.com',
        name: 'Founder Admin',
        phone: '+2348098765432',
        passwordHash,
        role: 'founder_admin',
        isActive: true,
      },
    })

    const req = createMockNextRequest('POST', '/api/admin/session', {
      email: 'founder-admin@example.com',
      password: 'FounderPass@123',
    })

    const { POST } = await import('@/app/api/admin/session/route')
    const res = await POST(req)
    const body = await parseResponseBody(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.role).toBe('founder_admin')
    expect(res.cookies.get(ADMIN_SESSION_COOKIE)?.value).toBeTruthy()

    const account = await prisma.adminUser.findUnique({
      where: { email: 'founder-admin@example.com' },
    })

    expect(account?.lastLoginAt).toBeTruthy()
  })
})
