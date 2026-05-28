import { afterEach, describe, expect, it } from '@jest/globals'
import {
  isAdminEmailAllowedForRole,
  resolveAdminRegistrationDecision,
} from '@/lib/admin/registration-policy'
import { resolveAdminRegistrationRole } from '@/lib/admin/session'
import { adminRegisterSchema } from '@/lib/validations'

const ADMIN_ENV_KEYS = [
  'ADMIN_SESSION_SECRET',
  'ADMIN_ACCESS_CODE',
  'ADMIN_SUPER_ADMIN_ACCESS_CODE',
  'ADMIN_FOUNDER_ADMIN_ACCESS_CODE',
  'ADMIN_EDITOR_ACCESS_CODE',
  'ADMIN_SUPPORT_PHONE',
  'ADMIN_ALLOWED_USERS',
  'ADMIN_INVITE_TOKENS',
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
    // ADMIN_ACCESS_CODE is now required (moderator role). Use a value that
    // doesn't collide with the other role codes the tests assert.
    ADMIN_ACCESS_CODE: '987654',
    ADMIN_SUPER_ADMIN_ACCESS_CODE: '741206',
    ADMIN_FOUNDER_ADMIN_ACCESS_CODE: '483951',
    ADMIN_EDITOR_ACCESS_CODE: '246810',
    ADMIN_SUPPORT_PHONE: '+2348012345678',
    ADMIN_ALLOWED_USERS: 'goodeals.ng@gmail.com:editor,founder@example.com:founder_admin|super_admin',
    ADMIN_INVITE_TOKENS: 'invitee@example.com:moderator:invite-token-abcdef',
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

  it('requires the email to be allowed for the role code', () => {
    configureAdminEnv()

    expect(isAdminEmailAllowedForRole('goodeals.ng@gmail.com', 'editor')).toBe(true)
    expect(isAdminEmailAllowedForRole('goodeals.ng@gmail.com', 'super_admin')).toBe(false)

    expect(
      resolveAdminRegistrationDecision({
        email: 'goodeals.ng@gmail.com',
        accessCode: '246810',
      })
    ).toEqual({ ok: true, role: 'editor', source: 'role_code' })

    expect(
      resolveAdminRegistrationDecision({
        email: 'outsider@example.com',
        accessCode: '246810',
      })
    ).toEqual({ ok: false, reason: 'email_not_allowed' })
  })

  it('supports email-specific invite tokens', () => {
    configureAdminEnv()

    expect(
      resolveAdminRegistrationDecision({
        email: 'invitee@example.com',
        accessCode: 'invite-token-abcdef',
      })
    ).toEqual({ ok: true, role: 'moderator', source: 'invite_token' })

    expect(
      resolveAdminRegistrationDecision({
        email: 'other@example.com',
        accessCode: 'invite-token-abcdef',
      })
    ).toEqual({ ok: false, reason: 'invalid_invite' })
  })
})
