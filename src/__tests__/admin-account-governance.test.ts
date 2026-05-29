import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const mockVerifyAdminSession = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockValidateAdminSessionWithDatabase = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockListAdminAccounts = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockUpdateAdminAccount = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockDeleteAdminAccount = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockSendEmail = jest.fn<(...args: unknown[]) => Promise<unknown>>()

jest.mock('@/lib/admin/session', () => ({
  ADMIN_SESSION_COOKIE: 'dbfh_admin_session',
  verifyAdminSession: (...args: unknown[]) => mockVerifyAdminSession(...args),
}))

jest.mock('@/lib/admin/session-validation', () => ({
  validateAdminSessionWithDatabase: (...args: unknown[]) => mockValidateAdminSessionWithDatabase(...args),
}))

jest.mock('@/lib/admin/repository', () => ({
  listAdminAccounts: (...args: unknown[]) => mockListAdminAccounts(...args),
  updateAdminAccount: (...args: unknown[]) => mockUpdateAdminAccount(...args),
  deleteAdminAccount: (...args: unknown[]) => mockDeleteAdminAccount(...args),
}))

jest.mock('@/lib/email/send', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

const operatorSession = {
  email: 'owner@example.com',
  role: 'super_admin',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  tokenVersion: 0,
}

const targetAccount = {
  id: 'admin-2',
  email: 'editor@example.com',
  name: 'Editor Admin',
  phone: '+2348012345678',
  role: 'editor',
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

function createJsonRequest(method: string, url: string, body?: Record<string, unknown>) {
  return new NextRequest(new URL(url, 'https://www.down-below.test'), {
    method,
    headers: {
      'content-type': 'application/json',
      cookie: 'dbfh_admin_session=test-session',
      'x-request-id': 'test-request-id',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

async function readBody(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

function routeContext(id = targetAccount.id) {
  return { params: Promise.resolve({ id }) }
}

describe('admin account governance routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyAdminSession.mockResolvedValue(operatorSession)
    mockValidateAdminSessionWithDatabase.mockResolvedValue(operatorSession)
    mockListAdminAccounts.mockResolvedValue([targetAccount])
    mockUpdateAdminAccount.mockResolvedValue(targetAccount)
    mockDeleteAdminAccount.mockResolvedValue(undefined)
    mockSendEmail.mockResolvedValue({ ok: true, id: 'email-id' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('emails the target admin after an account edit', async () => {
    const { PUT } = await import('@/app/api/admin/admin-users/[id]/route')
    const response = await PUT(
      createJsonRequest('PUT', '/api/admin/admin-users/admin-2', {
        role: 'moderator',
      }),
      routeContext()
    )
    const body = await readBody(response)

    expect(response.status).toBe(200)
    expect(body.emailSent).toBe(true)
    expect(mockUpdateAdminAccount).toHaveBeenCalledWith(
      targetAccount.id,
      { role: 'moderator' },
      { email: operatorSession.email, role: operatorSession.role }
    )
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: targetAccount.email,
        subject: 'Your DownBelow admin account was updated',
      })
    )
  })

  it('suspends an admin and emails the target admin', async () => {
    const suspendedAccount = { ...targetAccount, isActive: false }
    mockUpdateAdminAccount.mockResolvedValue(suspendedAccount)

    const { POST } = await import('@/app/api/admin/admin-users/[id]/suspend/route')
    const response = await POST(createJsonRequest('POST', '/api/admin/admin-users/admin-2/suspend'), routeContext())
    const body = await readBody(response)

    expect(response.status).toBe(200)
    expect(body.emailSent).toBe(true)
    expect(mockUpdateAdminAccount).toHaveBeenCalledWith(
      targetAccount.id,
      { isActive: false },
      { email: operatorSession.email, role: operatorSession.role }
    )
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: targetAccount.email,
        subject: 'Your DownBelow admin account was suspended',
      })
    )
  })

  it('deletes an admin and emails the target admin', async () => {
    const { DELETE } = await import('@/app/api/admin/admin-users/[id]/route')
    const response = await DELETE(createJsonRequest('DELETE', '/api/admin/admin-users/admin-2'), routeContext())
    const body = await readBody(response)

    expect(response.status).toBe(200)
    expect(body.emailSent).toBe(true)
    expect(mockDeleteAdminAccount).toHaveBeenCalledWith(targetAccount.id, {
      email: operatorSession.email,
      role: operatorSession.role,
    })
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: targetAccount.email,
        subject: 'Your DownBelow admin account was deleted',
      })
    )
  })

  it('blocks self-suspension before account mutation or email', async () => {
    mockListAdminAccounts.mockResolvedValue([{ ...targetAccount, id: 'owner-id', email: operatorSession.email }])

    const { POST } = await import('@/app/api/admin/admin-users/[id]/suspend/route')
    const response = await POST(createJsonRequest('POST', '/api/admin/admin-users/owner-id/suspend'), routeContext('owner-id'))
    const body = await readBody(response)

    expect(response.status).toBe(409)
    expect(body.code).toBe('conflict')
    expect(mockUpdateAdminAccount).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})
