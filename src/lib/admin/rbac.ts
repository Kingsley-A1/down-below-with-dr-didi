export const adminRoles = ['super_admin', 'founder_admin', 'editor', 'moderator'] as const

export type AdminRole = (typeof adminRoles)[number]

const roleRank: Record<AdminRole, number> = {
  moderator: 1,
  editor: 2,
  founder_admin: 3,
  super_admin: 4,
}

export function isAdminRole(value: string): value is AdminRole {
  return adminRoles.includes(value as AdminRole)
}

export function canAccessRole(currentRole: AdminRole, requiredRole: AdminRole) {
  return roleRank[currentRole] >= roleRank[requiredRole]
}

export function canViewVaultIdentity(role: AdminRole) {
  return role === 'super_admin'
}

export function normaliseAdminRole(value: string | undefined): AdminRole {
  if (!value) {
    return 'editor'
  }

  return isAdminRole(value) ? value : 'editor'
}