export const adminRoles = ['super_admin', 'founder_admin', 'editor', 'moderator'] as const

export type AdminRole = (typeof adminRoles)[number]

// founder_admin and super_admin share the top rank — they are equal in power
// and differ only by name and registration code. moderator and editor remain
// distinct, lower tiers.
const roleRank: Record<AdminRole, number> = {
  moderator: 1,
  editor: 2,
  founder_admin: 4,
  super_admin: 4,
}

export function isAdminRole(value: string): value is AdminRole {
  return adminRoles.includes(value as AdminRole)
}

export function canAccessRole(currentRole: AdminRole, requiredRole: AdminRole) {
  return roleRank[currentRole] >= roleRank[requiredRole]
}

/**
 * Top-level admins (super_admin, founder_admin) have full, identical authority.
 * Use this for the highest-trust capabilities — vault identity reveal, admin
 * account management, destructive deletes — and for registration pinning, where
 * both roles must always be tied to an allow-listed email.
 */
export function isTopLevelAdmin(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'founder_admin'
}

export function canViewVaultIdentity(role: AdminRole) {
  return isTopLevelAdmin(role)
}

/**
 * Vault moderation (status updates) and private responses require editor or
 * higher. Moderators may list submissions (always identity-masked) but not act
 * on them.
 */
export function canModerateVault(role: AdminRole) {
  return canAccessRole(role, 'editor')
}

export function normaliseAdminRole(value: string | undefined): AdminRole {
  if (!value) {
    return 'editor'
  }

  return isAdminRole(value) ? value : 'editor'
}