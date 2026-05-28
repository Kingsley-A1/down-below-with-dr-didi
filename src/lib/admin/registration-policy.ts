import { env } from '@/lib/env'
import { constantTimeCompare } from '@/lib/security'
import { isAdminRole, type AdminRole } from '@/lib/admin/rbac'
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

export function resolveAdminRegistrationDecision(input: {
  email: string
  accessCode: string
}): AdminRegistrationDecision {
  const email = normalizeEmail(input.email)
  const accessCode = input.accessCode.trim()
  const roleFromCode = resolveAdminRegistrationRole(accessCode)

  if (roleFromCode) {
    return isAdminEmailAllowedForRole(email, roleFromCode)
      ? { ok: true, role: roleFromCode, source: 'role_code' }
      : { ok: false, reason: 'email_not_allowed' }
  }

  for (const invite of parseInviteTokenEntries()) {
    if (invite.email === email && constantTimeCompare(invite.token, accessCode)) {
      return { ok: true, role: invite.role, source: 'invite_token' }
    }
  }

  return { ok: false, reason: 'invalid_invite' }
}
