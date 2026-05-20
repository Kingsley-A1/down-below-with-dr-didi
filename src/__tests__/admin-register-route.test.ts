import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

jest.setTimeout(60_000)

const mockGetAdminEnv = jest.fn<() => unknown>()
const mockHasDatabaseConfig = jest.fn<() => boolean>()
const mockRegisterAdminUserAccount = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockWriteAuditLog = jest.fn<(...args: unknown[]) => Promise<unknown>>()

jest.mock('@/lib/env', () => ({
  env: { NODE_ENV: 'test' },
  getAdminEnv: () => mockGetAdminEnv(),
  hasDatabaseConfig: () => mockHasDatabaseConfig(),
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
      ADMIN_ACCESS_CODE: '',
      ADMIN_SUPER_ADMIN_ACCESS_CODE: '741206',
      ADMIN_FOUNDER_ADMIN_ACCESS_CODE: '404653',
      ADMIN_EDITOR_ACCESS_CODE: '246810',
      ADMIN_SUPPORT_PHONE: '+2348012345678',
    })
    mockRegisterAdminUserAccount.mockResolvedValue({
      email: 'goodeals.ng@gmail.com',
      phone: '+2349036826272',
      role: 'editor',
    })
    mockWriteAuditLog.mockRejectedValue(new Error('AuditLog write failed'))

    const { POST } = await import('@/app/api/admin/register/route')
    const response = await POST(createAdminRegisterRequest(validPayload))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.role).toBe('editor')
    expect(response.cookies.get('dbfh_admin_session')?.value).toBeTruthy()
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
