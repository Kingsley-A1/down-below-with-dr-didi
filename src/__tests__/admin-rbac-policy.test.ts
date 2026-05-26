import { describe, expect, it } from '@jest/globals'
import { NextResponse } from 'next/server'
import {
  adminRoles,
  canAccessRole,
  canViewVaultIdentity,
  isAdminRole,
  normaliseAdminRole,
  type AdminRole,
} from '@/lib/admin/rbac'
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

  it('enforces role hierarchy for operation access', () => {
    expect(canAccessRole('super_admin', 'super_admin')).toBe(true)
    expect(canAccessRole('founder_admin', 'super_admin')).toBe(false)
    expect(canAccessRole('super_admin', 'founder_admin')).toBe(true)
    expect(canAccessRole('editor', 'super_admin')).toBe(false)
    expect(canAccessRole('moderator', 'editor')).toBe(false)
    expect(canAccessRole('editor', 'moderator')).toBe(true)
  })

  it('enforces identity visibility as super_admin-only', () => {
    expect(canViewVaultIdentity('super_admin')).toBe(true)
    expect(canViewVaultIdentity('founder_admin')).toBe(false)
    expect(canViewVaultIdentity('editor')).toBe(false)
    expect(canViewVaultIdentity('moderator')).toBe(false)
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
    expect(body.requiredRole).toBe('super_admin')
    expect(body.currentRole).toBe('editor')
  })

  it('returns null when role requirement is satisfied', () => {
    const allowed = requireAdminRole(buildSession('super_admin'), 'editor')
    expect(allowed).toBeNull()
  })
})
