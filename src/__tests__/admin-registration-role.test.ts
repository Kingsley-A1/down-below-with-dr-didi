import { afterEach, describe, expect, it } from '@jest/globals'
import {
  isAdminEmailAllowedForRole,
  isRoleRestrictedByAllowlist,
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

  it('authorises an unrestricted role by access code alone', () => {
    // moderator is not pinned in ADMIN_ALLOWED_USERS, so a valid moderator code
    // is sufficient for any registering email.
    configureAdminEnv()

    expect(isRoleRestrictedByAllowlist('moderator')).toBe(false)
    expect(
      resolveAdminRegistrationDecision({
        email: 'new-moderator@example.com',
        accessCode: '987654',
      })
    ).toEqual({ ok: true, role: 'moderator', source: 'role_code' })
  })

  it('locks top-level roles to allow-listed emails while lower role codes self-register', () => {
    // founder_admin now has full super_admin power, so it is pinned just like
    // super_admin: a valid code is not enough — the email must be allow-listed.
    // editor/moderator stay code-only unless explicitly pinned.
    configureAdminEnv({
      ADMIN_ALLOWED_USERS: 'founder@example.com:super_admin,co-founder@example.com:founder_admin',
    })

    expect(isRoleRestrictedByAllowlist('super_admin')).toBe(true)
    expect(isRoleRestrictedByAllowlist('founder_admin')).toBe(true)
    expect(isRoleRestrictedByAllowlist('editor')).toBe(false)

    // super_admin: only the pinned founder email.
    expect(
      resolveAdminRegistrationDecision({ email: 'founder@example.com', accessCode: '741206' })
    ).toEqual({ ok: true, role: 'super_admin', source: 'role_code' })
    expect(
      resolveAdminRegistrationDecision({ email: 'outsider@example.com', accessCode: '741206' })
    ).toEqual({ ok: false, reason: 'email_not_allowed' })

    // founder_admin: only the pinned co-founder email — the code alone is not enough.
    expect(
      resolveAdminRegistrationDecision({ email: 'co-founder@example.com', accessCode: '483951' })
    ).toEqual({ ok: true, role: 'founder_admin', source: 'role_code' })
    expect(
      resolveAdminRegistrationDecision({ email: 'outsider@example.com', accessCode: '483951' })
    ).toEqual({ ok: false, reason: 'email_not_allowed' })

    // editor stays open to any email by code alone.
    expect(
      resolveAdminRegistrationDecision({ email: 'new-editor@example.com', accessCode: '246810' })
    ).toEqual({ ok: true, role: 'editor', source: 'role_code' })
  })

  it('locks founder_admin even when it is not explicitly pinned in the allowlist', () => {
    // Only super_admin is pinned here; founder_admin is still treated as a
    // top-level role, so its code cannot self-register an unlisted email.
    configureAdminEnv({ ADMIN_ALLOWED_USERS: 'founder@example.com:super_admin' })

    expect(isRoleRestrictedByAllowlist('founder_admin')).toBe(false)
    expect(
      resolveAdminRegistrationDecision({ email: 'anyone@example.com', accessCode: '483951' })
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

  it('resolves the original report: founder code 404653 and editor code 246810 are no longer denied at registration', () => {
    // Reproduces the reported symptom ("they register and see Admin Access
    // Denied") with the project's real role codes, under the intended pinning
    // config: super_admin + founder_admin are pinned to specific emails, while
    // editor and moderator self-register by code. A denied decision here is
    // exactly what the register route turns into the 401 "Admin registration
    // denied" the user saw.
    configureAdminEnv({
      ADMIN_SUPER_ADMIN_ACCESS_CODE: '826272',
      ADMIN_FOUNDER_ADMIN_ACCESS_CODE: '404653',
      ADMIN_EDITOR_ACCESS_CODE: '246810',
      ADMIN_ALLOWED_USERS: 'deblessedking001@gmail.com:super_admin,cofounder@example.com:founder_admin',
    })

    // Editor (246810): self-registers for any email — the denial is gone.
    expect(
      resolveAdminRegistrationDecision({ email: 'new-editor@example.com', accessCode: '246810' })
    ).toEqual({ ok: true, role: 'editor', source: 'role_code' })

    // Founder (404653): registers when the email is allow-listed (the pinning the
    // owner chose), so a trusted co-lead is no longer blocked.
    expect(
      resolveAdminRegistrationDecision({ email: 'cofounder@example.com', accessCode: '404653' })
    ).toEqual({ ok: true, role: 'founder_admin', source: 'role_code' })

    // Founder (404653) for a non-allow-listed email stays denied by design — the
    // top role can't be claimed by code alone.
    expect(
      resolveAdminRegistrationDecision({ email: 'stranger@example.com', accessCode: '404653' })
    ).toEqual({ ok: false, reason: 'email_not_allowed' })

    // super_admin still resolves for the pinned founder email.
    expect(
      resolveAdminRegistrationDecision({ email: 'deblessedking001@gmail.com', accessCode: '826272' })
    ).toEqual({ ok: true, role: 'super_admin', source: 'role_code' })
  })
})
