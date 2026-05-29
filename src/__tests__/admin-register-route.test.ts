import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

jest.setTimeout(60_000)

const mockGetAdminEnv = jest.fn<() => unknown>()
const mockHasDatabaseConfig = jest.fn<() => boolean>()
const mockRegisterAdminUserAccount = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockWriteAuditLog = jest.fn<(...args: unknown[]) => Promise<unknown>>()

jest.mock('@/lib/env', () => ({
  env: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_SITE_URL: 'https://test.down-below.com',
    RESEND_FROM_EMAIL: 'no-reply@test.down-below.com',
    RESEND_FROM_NAME: 'Test',
    ADMIN_ALLOWED_USERS: 'goodeals.ng@gmail.com:editor',
    ADMIN_INVITE_TOKENS: '',
  },
  getAdminEnv: () => mockGetAdminEnv(),
  hasDatabaseConfig: () => mockHasDatabaseConfig(),
  hasEmailProvider: () => false,
  getEmailEnv: () => {
    throw new Error('Email provider not configured in test')
  },
}))

jest.mock('@/lib/admin/repository', () => ({
  registerAdminUserAccount: (...args: unknown[]) => mockRegisterAdminUserAccount(...args),
  writeAuditLog: (...args: unknown[]) => mockWriteAuditLog(...args),
}))

function createAdminRegisterRequest(body: Record<string, unknown>) {
  return new NextRequest('https://www.down-below.com/api/admin/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '192.168.1.10',
      'x-vercel-id': 'test-request-id',
    },
    body: JSON.stringify(body),
  })
}

const validPayload = {
  name: 'BLESSED KING',
  email: 'goodeals.ng@gmail.com',
  phone: '+2349036826272',
  password: 'Kingsley.A100',
  confirmPassword: 'Kingsley.A100',
  accessCode: '246810',
}

describe('POST /api/admin/register', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
    jest.clearAllMocks()
  })

  it('does not fail registration when audit logging fails after account creation', async () => {
    mockHasDatabaseConfig.mockReturnValue(true)
    mockGetAdminEnv.mockReturnValue({
      ADMIN_SESSION_SECRET: 'test-admin-session-secret-32-characters',
      ADMIN_ACCESS_CODE: '987654',
      ADMIN_SUPER_ADMIN_ACCESS_CODE: '741206',
      ADMIN_FOUNDER_ADMIN_ACCESS_CODE: '404653',
      ADMIN_EDITOR_ACCESS_CODE: '246810',
    })
    mockRegisterAdminUserAccount.mockResolvedValue({
      id: 'admin-test-id',
      email: 'goodeals.ng@gmail.com',
      name: 'BLESSED KING',
      phone: '+2349036826272',
      role: 'editor',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verificationToken: 'test-verification-token-32-bytes-long-hex-string-1234567890abcdef',
      verificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    mockWriteAuditLog.mockRejectedValue(new Error('AuditLog write failed'))

    const { POST } = await import('@/app/api/admin/register/route')
    const response = await POST(createAdminRegisterRequest(validPayload))
    const body = await response.json()

    // New flow: registration succeeds but DOES NOT set a session cookie.
    // The admin must verify their email via the Resend link before signing in.
    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.role).toBe('editor')
    expect(body.requiresEmailVerification).toBe(true)
    expect(response.cookies.get('dbfh_admin_session')?.value).toBeFalsy()
  })

  it('returns a service configuration error when admin role-code env is invalid', async () => {
    mockHasDatabaseConfig.mockReturnValue(true)
    mockGetAdminEnv.mockImplementation(() => {
      throw new Error('[env] Admin registration codes must be unique per role.')
    })

    const { POST } = await import('@/app/api/admin/register/route')
    const response = await POST(createAdminRegisterRequest(validPayload))
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toBe('Admin registration is not configured.')
    expect(mockRegisterAdminUserAccount).not.toHaveBeenCalled()
  })
})
