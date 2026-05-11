/**
 * V-Vault Response Notification Integration Test
 * Verifies: submission -> admin response -> user notification + read lifecycle
 */

import { describe, it, expect, jest, beforeAll, afterAll, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import * as authSession from '@/lib/auth/session'
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from '@/lib/admin/session'
import {
  cleanupDatabase,
  disconnectDatabase,
  createTestUser,
  createMockNextRequest,
  hasIntegrationDatabase,
  parseResponseBody,
} from './setup'

const describeWithDatabase = hasIntegrationDatabase ? describe : describe.skip

jest.setTimeout(90_000)

describeWithDatabase('V-Vault Response Notification Chain', () => {
  beforeAll(async () => {
    await cleanupDatabase()
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await cleanupDatabase()
  })

  afterAll(async () => {
    await disconnectDatabase()
  })

  it('creates a user-linked submission, responds as admin, and exposes unread notification to polling endpoint', async () => {
    const user = await createTestUser({
      email: 'vault-chain-user@example.com',
      emailVerified: true,
    })

    jest.spyOn(authSession, 'getSession').mockResolvedValue({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      iat: Math.floor(Date.now() / 1000),
    })

    const submissionReq = createMockNextRequest('POST', '/api/vault', {
      category: 'Sexual Wellness',
      question:
        'This is a private test question to validate the V-Vault response notification chain end to end.',
    })

    const { POST: submitVault } = await import('@/app/api/vault/route')
    const submissionRes = await submitVault(submissionReq)
    const submissionBody = await parseResponseBody(submissionRes)

    expect(submissionRes.status).toBe(200)
    expect(submissionBody.success).toBe(true)

    const createdSubmission = await prisma.vaultSubmission.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    expect(createdSubmission).toBeTruthy()
    expect(createdSubmission?.source).toBe('app_authenticated')

    const adminToken = await createAdminSessionToken({
      email: 'superadmin-chain@example.com',
      role: 'super_admin',
    })

    const respondReq = createMockNextRequest(
      'POST',
      `/api/admin/vault/${createdSubmission?.id}/respond`,
      {
        responseBody:
          'Thank you for trusting us. This private response confirms the notification pipeline is active.',
      },
      {
        cookie: `${ADMIN_SESSION_COOKIE}=${adminToken}`,
      }
    )

    const { POST: respondVault } = await import('@/app/api/admin/vault/[id]/respond/route')
    const respondRes = await respondVault(respondReq, {
      params: Promise.resolve({ id: createdSubmission?.id || '' }),
    })
    const respondBody = await parseResponseBody(respondRes)

    expect(respondRes.status).toBe(200)
    expect(respondBody.success).toBe(true)
    expect(respondBody.notificationCreated).toBe(true)

    const updatedSubmission = await prisma.vaultSubmission.findUnique({
      where: { id: createdSubmission?.id },
    })
    expect(updatedSubmission?.status).toBe('answered_privately')

    const createdResponse = await prisma.vaultResponse.findFirst({
      where: { submissionId: createdSubmission?.id },
      orderBy: { createdAt: 'desc' },
    })
    expect(createdResponse).toBeTruthy()

    const createdNotification = await prisma.userNotification.findFirst({
      where: {
        userId: user.id,
        type: 'vault_response',
        entityType: 'vault_submission',
        entityId: createdSubmission?.id,
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(createdNotification).toBeTruthy()
    expect(createdNotification?.isRead).toBe(false)

    const mockedSession = {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      iat: Math.floor(Date.now() / 1000),
    }

    jest.spyOn(authSession, 'requireAuth').mockResolvedValue(mockedSession)

    const notificationsReq = createMockNextRequest('GET', '/api/users/notifications?limit=10')
    const { GET: getNotifications } = await import('@/app/api/users/notifications/route')
    const notificationsRes = await getNotifications(notificationsReq)
    const notificationsBody = await parseResponseBody(notificationsRes)

    expect(notificationsRes.status).toBe(200)
    expect(notificationsBody.success).toBe(true)
    expect(notificationsBody.unreadCount).toBeGreaterThanOrEqual(1)
    expect(
      notificationsBody.notifications.some(
        (item: { id: string; type: string; entityId: string | null; isRead: boolean }) =>
          item.id === createdNotification?.id &&
          item.type === 'vault_response' &&
          item.entityId === createdSubmission?.id &&
          item.isRead === false
      )
    ).toBe(true)

    const { PATCH: patchRead } = await import('@/app/api/users/notifications/[id]/read/route')
    const markReadRes = await patchRead(createMockNextRequest('PATCH', `/api/users/notifications/${createdNotification?.id}/read`), {
      params: Promise.resolve({ id: createdNotification?.id || '' }),
    })
    const markReadBody = await parseResponseBody(markReadRes)

    expect(markReadRes.status).toBe(200)
    expect(markReadBody.success).toBe(true)
    expect(markReadBody.notification?.isRead).toBe(true)

    const refreshedNotification = await prisma.userNotification.findUnique({
      where: { id: createdNotification?.id },
    })
    expect(refreshedNotification?.isRead).toBe(true)
    expect(refreshedNotification?.readAt).toBeTruthy()

    const vaultThreadsReq = createMockNextRequest('GET', '/api/vault/me')
    const { GET: getThreads } = await import('@/app/api/vault/me/route')
    const threadsRes = await getThreads(vaultThreadsReq)
    const threadsBody = await parseResponseBody(threadsRes)

    expect(threadsRes.status).toBe(200)
    expect(threadsBody.success).toBe(true)
    expect(
      threadsBody.threads.some(
        (thread: { id: string; responses: Array<{ id: string }> }) =>
          thread.id === createdSubmission?.id &&
          thread.responses.some((response) => response.id === createdResponse?.id)
      )
    ).toBe(true)

  })

  it('persists expected shadow events and audit records for the response lifecycle', async () => {
    const user = await createTestUser({
      email: 'vault-trace-user@example.com',
      emailVerified: true,
    })

    jest.spyOn(authSession, 'getSession').mockResolvedValue({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      iat: Math.floor(Date.now() / 1000),
    })

    const { POST: submitVault } = await import('@/app/api/vault/route')
    const submissionRes = await submitVault(
      createMockNextRequest('POST', '/api/vault', {
        category: 'Contraception',
        question: 'This traceability test validates that all required lifecycle events are persisted end to end.',
      })
    )

    expect(submissionRes.status).toBe(200)

    const submission = await prisma.vaultSubmission.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    expect(submission).toBeTruthy()

    const adminToken = await createAdminSessionToken({
      email: 'superadmin-trace@example.com',
      role: 'super_admin',
    })

    const { POST: respondVault } = await import('@/app/api/admin/vault/[id]/respond/route')
    const respondRes = await respondVault(
      createMockNextRequest(
        'POST',
        `/api/admin/vault/${submission?.id}/respond`,
        {
          responseBody: 'Trace check response body with enough length for schema acceptance and event/audit assertions.',
        },
        {
          cookie: `${ADMIN_SESSION_COOKIE}=${adminToken}`,
        }
      ),
      { params: Promise.resolve({ id: submission?.id || '' }) }
    )

    expect(respondRes.status).toBe(200)

    const events = await prisma.vaultSubmissionEvent.findMany({
      where: { submissionId: submission?.id },
      orderBy: { createdAt: 'asc' },
    })

    const eventTypes = events.map((event: { eventType: string }) => event.eventType)
    expect(eventTypes).toEqual(expect.arrayContaining([
      'submission.created',
      'submission.responded',
      'submission.user_notified',
    ]))

    const responseAudit = await prisma.auditLog.findFirst({
      where: {
        action: 'vault_submission.responded',
        entityId: submission?.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(responseAudit).toBeTruthy()
  })
})
