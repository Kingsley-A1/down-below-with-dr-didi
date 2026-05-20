import { afterEach, describe, expect, it } from '@jest/globals'
import { resolveAdminRegistrationRole } from '@/lib/admin/session'
import { adminRegisterSchema } from '@/lib/validations'

const ADMIN_ENV_KEYS = [
  'ADMIN_SESSION_SECRET',
  'ADMIN_ACCESS_CODE',
  'ADMIN_SUPER_ADMIN_ACCESS_CODE',
  'ADMIN_FOUNDER_ADMIN_ACCESS_CODE',
  'ADMIN_EDITOR_ACCESS_CODE',
  'ADMIN_SUPPORT_PHONE',
] as const

const originalAdminEnv = Object.fromEntries(
  ADMIN_ENV_KEYS.map((key) => [key, process.env[key]])
) as Record<(typeof ADMIN_ENV_KEYS)[number], string | undefined>

function restoreAdminEnv() {
  for (const key of ADMIN_ENV_KEYS) {
    const originalValue = originalAdminEnv[key]

    if (originalValue === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = originalValue
    }
  }
}

function configureAdminEnv(overrides?: Partial<Record<(typeof ADMIN_ENV_KEYS)[number], string>>) {
  const values = {
    ADMIN_SESSION_SECRET: 'test-admin-session-secret-32-characters',
    ADMIN_ACCESS_CODE: '',
    ADMIN_SUPER_ADMIN_ACCESS_CODE: '741206',
    ADMIN_FOUNDER_ADMIN_ACCESS_CODE: '483951',
    ADMIN_EDITOR_ACCESS_CODE: '246810',
    ADMIN_SUPPORT_PHONE: '+2348012345678',
    ...overrides,
  }

  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value
  }
}

describe('Admin registration role codes', () => {
  afterEach(() => {
    restoreAdminEnv()
  })

  it('resolves the configured editor access code', () => {
    configureAdminEnv()

    expect(resolveAdminRegistrationRole('246810')).toBe('editor')
  })

  it('refreshes role-code configuration when runtime env changes in the same process', () => {
    configureAdminEnv({ ADMIN_EDITOR_ACCESS_CODE: '246810' })

    expect(resolveAdminRegistrationRole('246810')).toBe('editor')

    process.env.ADMIN_EDITOR_ACCESS_CODE = '135790'

    expect(resolveAdminRegistrationRole('246810')).toBeNull()
    expect(resolveAdminRegistrationRole('135790')).toBe('editor')
  })

  it('normalizes the admin registration access code before role lookup', () => {
    configureAdminEnv()

    const parsed = adminRegisterSchema.parse({
      name: 'BLESSED KING',
      email: 'goodeals.ng@gmail.com',
      phone: '+2349036826272',
      password: 'Kingsley.A100',
      confirmPassword: 'Kingsley.A100',
      accessCode: ' 246810 ',
    })

    expect(parsed.accessCode).toBe('246810')
    expect(resolveAdminRegistrationRole(parsed.accessCode)).toBe('editor')
  })
})
