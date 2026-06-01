/**
 * Admin V-Vault Identity Integration Tests
 * Verifies top-level-admin (super_admin + founder_admin) reveal behavior and
 * identity-view audit logging. Editors and moderators stay masked.
 */

import { describe, it, expect, jest, beforeAll, afterAll, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from '@/lib/admin/session'
import {
  cleanupDatabase,
  disconnectDatabase,
  createTestUser,
  ensureAdminUser,
  createMockNextRequest,
  hasIntegrationDatabase,
  parseResponseBody,
} from './setup'

const describeWithDatabase = hasIntegrationDatabase ? describe : describe.skip

jest.setTimeout(60_000)

async function createAdminRequest(params: {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  role: 'super_admin' | 'founder_admin'
  email: string
}) {
  await ensureAdminUser(params.email, params.role)
  const token = await createAdminSessionToken({
    email: params.email,
    role: params.role,
  })

  return createMockNextRequest(params.method || 'GET', params.url, undefined, {
    cookie: `${ADMIN_SESSION_COOKIE}=${token}`,
  })
}

describeWithDatabase('Admin V-Vault Identity', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('masks linked identity by default and reveals only when super_admin requests reveal', async () => {
    const user = await createTestUser({
      email: 'identity-owner@example.com',
      emailVerified: true,
    })

    await prisma.vaultSubmission.create({
      data: {
        category: 'Sexual Wellness',
        question: 'I need guidance for a private concern.',
        source: 'app_authenticated',
        userId: user.id,
      },
    })

    const defaultReq = await createAdminRequest({
      url: '/api/admin/vault',
      role: 'super_admin',
      email: 'super-admin@example.com',
    })

    const { GET } = await import('@/app/api/admin/vault/route')
    const defaultRes = await GET(defaultReq)
    const defaultBody = await parseResponseBody(defaultRes)

    expect(defaultRes.status).toBe(200)
    expect(defaultBody.submissions.length).toBeGreaterThan(0)
    expect(defaultBody.submissions[0].submitter.hasLinkedAccount).toBe(true)
    expect(defaultBody.submissions[0].submitter.email).toBeNull()

    const revealReq = await createAdminRequest({
      url: '/api/admin/vault?includeIdentity=1',
      role: 'super_admin',
      email: 'super-admin@example.com',
    })

    const revealRes = await GET(revealReq)
    const revealBody = await parseResponseBody(revealRes)

    expect(revealRes.status).toBe(200)
    expect(revealBody.submissions[0].submitter.email).toBe('identity-owner@example.com')

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'vault_submission.identity_viewed',
      },
    })

    expect(logs.length).toBeGreaterThan(0)
  })

  it('allows founder_admin to reveal linked identity, matching super_admin', async () => {
    const user = await createTestUser({
      email: 'founder-policy-check@example.com',
      emailVerified: true,
    })

    await prisma.vaultSubmission.create({
      data: {
        category: 'Contraception',
        question: 'Founder role now has super_admin-level identity access.',
        source: 'app_authenticated',
        userId: user.id,
      },
    })

    const founderReq = await createAdminRequest({
      url: '/api/admin/vault?includeIdentity=true',
      role: 'founder_admin',
      email: 'founder-admin@example.com',
    })

    const { GET } = await import('@/app/api/admin/vault/route')
    const founderRes = await GET(founderReq)
    const founderBody = await parseResponseBody(founderRes)

    expect(founderRes.status).toBe(200)
    expect(founderBody.submissions[0].submitter.email).toBe('founder-policy-check@example.com')
  })
})
