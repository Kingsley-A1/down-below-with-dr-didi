import { describe, expect, it } from '@jest/globals'
import { NextResponse } from 'next/server'
import {
  adminRoles,
  canAccessRole,
  canModerateVault,
  canViewVaultIdentity,
  isAdminRole,
  isTopLevelAdmin,
  normaliseAdminRole,
  type AdminRole,
} from '@/lib/admin/rbac'
import { sanitizeAdminNextPath } from '@/lib/admin/redirects'
import { requireAdminRole } from '@/lib/admin/api-guard'
import type { AdminSession } from '@/lib/admin/session'

function buildSession(role: AdminRole): AdminSession {
  return {
    email: `${role}@example.com`,
    role,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    tokenVersion: 0,
  }
}

describe('Admin RBAC and Vault identity policy', () => {
  it('recognizes supported admin roles including founder_admin', () => {
    expect(adminRoles).toContain('founder_admin')
    expect(isAdminRole('super_admin')).toBe(true)
    expect(isAdminRole('founder_admin')).toBe(true)
    expect(isAdminRole('editor')).toBe(true)
    expect(isAdminRole('moderator')).toBe(true)
    expect(isAdminRole('member')).toBe(false)
  })

  it('treats founder_admin and super_admin as equal top-level admins', () => {
    expect(canAccessRole('super_admin', 'super_admin')).toBe(true)
    // founder_admin now has full super_admin authority.
    expect(canAccessRole('founder_admin', 'super_admin')).toBe(true)
    expect(canAccessRole('super_admin', 'founder_admin')).toBe(true)
    expect(canAccessRole('editor', 'super_admin')).toBe(false)
    expect(canAccessRole('moderator', 'editor')).toBe(false)
    expect(canAccessRole('editor', 'moderator')).toBe(true)

    expect(isTopLevelAdmin('super_admin')).toBe(true)
    expect(isTopLevelAdmin('founder_admin')).toBe(true)
    expect(isTopLevelAdmin('editor')).toBe(false)
    expect(isTopLevelAdmin('moderator')).toBe(false)
  })

  it('enforces identity visibility as top-level-admin-only', () => {
    expect(canViewVaultIdentity('super_admin')).toBe(true)
    expect(canViewVaultIdentity('founder_admin')).toBe(true)
    expect(canViewVaultIdentity('editor')).toBe(false)
    expect(canViewVaultIdentity('moderator')).toBe(false)
  })

  it('allows vault moderation for editor and up, but not moderators', () => {
    expect(canModerateVault('super_admin')).toBe(true)
    expect(canModerateVault('founder_admin')).toBe(true)
    expect(canModerateVault('editor')).toBe(true)
    expect(canModerateVault('moderator')).toBe(false)
  })

  it('normalizes unknown roles to editor for safety', () => {
    expect(normaliseAdminRole(undefined)).toBe('editor')
    expect(normaliseAdminRole('unknown')).toBe('editor')
    expect(normaliseAdminRole('founder_admin')).toBe('founder_admin')
  })

  it('returns structured 403 response when role requirement fails', async () => {
    const denied = requireAdminRole(buildSession('editor'), 'super_admin') as NextResponse
    expect(denied).toBeTruthy()

    const body = await denied.json()
    expect(denied.status).toBe(403)
    expect(body.code).toBe('permission_denied')
    expect(body.error).toContain('super_admin')
  })

  it('returns null when role requirement is satisfied', () => {
    const allowed = requireAdminRole(buildSession('super_admin'), 'editor')
    expect(allowed).toBeNull()
  })

  it('allows only internal admin next redirects', () => {
    expect(sanitizeAdminNextPath('/admin/vault?status=new')).toBe('/admin/vault?status=new')
    expect(sanitizeAdminNextPath('https://evil.example/admin')).toBe('/admin')
    expect(sanitizeAdminNextPath('//evil.example/admin')).toBe('/admin')
    expect(sanitizeAdminNextPath('/login')).toBe('/admin')
  })
})
