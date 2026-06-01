import { env } from '@/lib/env'
import { constantTimeCompare } from '@/lib/security'
import { isAdminRole, isTopLevelAdmin, type AdminRole } from '@/lib/admin/rbac'
import { resolveAdminRegistrationRole } from '@/lib/admin/session'

export type AdminRegistrationDecision =
  | { ok: true; role: AdminRole; source: 'role_code' | 'invite_token' }
  | { ok: false; reason: 'invalid_invite' | 'email_not_allowed' }

type AllowedAdminEntry = {
  email: string
  roles: Set<AdminRole | '*'>
}

type InviteTokenEntry = {
  email: string
  role: AdminRole
  token: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function parseAllowedAdminEntry(entry: string): AllowedAdminEntry | null {
  const [rawEmail, rawRoles] = entry.split(':')
  const email = normalizeEmail(rawEmail ?? '')

  if (!email) {
    return null
  }

  const roles = new Set<AdminRole | '*'>()
  const roleParts = (rawRoles || '*').split('|')

  for (const role of roleParts) {
    const normalizedRole = role.trim()
    if (normalizedRole === '*') {
      roles.add('*')
    } else if (isAdminRole(normalizedRole)) {
      roles.add(normalizedRole)
    }
  }

  if (roles.size === 0) {
    return null
  }

  return { email, roles }
}

function parseAllowedAdminEntries(): AllowedAdminEntry[] {
  return (process.env.ADMIN_ALLOWED_USERS ?? env.ADMIN_ALLOWED_USERS ?? '')
    .split(',')
    .map((entry) => parseAllowedAdminEntry(entry.trim()))
    .filter((entry): entry is AllowedAdminEntry => Boolean(entry))
}

function parseInviteTokenEntry(entry: string): InviteTokenEntry | null {
  const [rawEmail, rawRole, rawToken] = entry.split(':')
  const email = normalizeEmail(rawEmail ?? '')
  const role = rawRole?.trim()
  const token = rawToken?.trim()

  if (!email || !token || !isAdminRole(role)) {
    return null
  }

  return { email, role, token }
}

function parseInviteTokenEntries(): InviteTokenEntry[] {
  return (process.env.ADMIN_INVITE_TOKENS ?? env.ADMIN_INVITE_TOKENS ?? '')
    .split(',')
    .map((entry) => parseInviteTokenEntry(entry.trim()))
    .filter((entry): entry is InviteTokenEntry => Boolean(entry))
}

export function isAdminEmailAllowedForRole(email: string, role: AdminRole): boolean {
  const normalizedEmail = normalizeEmail(email)
  const allowlist = parseAllowedAdminEntries()
  const entry = allowlist.find((candidate) => candidate.email === normalizedEmail)

  if (!entry) {
    return false
  }

  return entry.roles.has('*') || entry.roles.has(role)
}

/**
 * A role is "restricted" when at least one `ADMIN_ALLOWED_USERS` entry pins it
 * to a specific email. Restricted roles may only be registered by an
 * allow-listed email; roles that nobody pins are authorised by a valid role
 * access code alone.
 *
 * A wildcard grant (`email:*`) grants that email every role but does NOT, by
 * itself, lock a role down — it is a privilege, not a restriction. This lets
 * leadership pin the highest-trust roles (e.g. super_admin) to known emails
 * while still handing out lower-role codes without pre-registering every
 * operator's address in the environment.
 */
export function isRoleRestrictedByAllowlist(role: AdminRole): boolean {
  return parseAllowedAdminEntries().some((entry) => entry.roles.has(role))
}

/**
 * Whether a registering email must appear in `ADMIN_ALLOWED_USERS` for the
 * given role. Top-level admins (super_admin, founder_admin) are ALWAYS pinned —
 * they hold full authority, so a leaked role code alone must never be enough to
 * mint one; the email must also be allow-listed. Lower roles are pinned only
 * when an `ADMIN_ALLOWED_USERS` entry explicitly names them.
 */
function roleRequiresAllowlistedEmail(role: AdminRole): boolean {
  return isTopLevelAdmin(role) || isRoleRestrictedByAllowlist(role)
}

export function resolveAdminRegistrationDecision(input: {
  email: string
  accessCode: string
}): AdminRegistrationDecision {
  const email = normalizeEmail(input.email)
  const accessCode = input.accessCode.trim()
  const roleFromCode = resolveAdminRegistrationRole(accessCode)

  if (roleFromCode) {
    // The role access code proves which role the operator may register for.
    // Top-level roles (super_admin, founder_admin) ALWAYS require an
    // allow-listed email — full authority can never be claimed by code alone.
    // Lower roles (editor, moderator) are authorised by a valid code unless
    // `ADMIN_ALLOWED_USERS` explicitly pins them, so their codes stay usable
    // without pre-registering every operator's address in the environment.
    if (roleRequiresAllowlistedEmail(roleFromCode) && !isAdminEmailAllowedForRole(email, roleFromCode)) {
      return { ok: false, reason: 'email_not_allowed' }
    }

    return { ok: true, role: roleFromCode, source: 'role_code' }
  }

  for (const invite of parseInviteTokenEntries()) {
    if (invite.email === email && constantTimeCompare(invite.token, accessCode)) {
      return { ok: true, role: invite.role, source: 'invite_token' }
    }
  }

  return { ok: false, reason: 'invalid_invite' }
}
