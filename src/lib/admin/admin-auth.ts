/**
 * Admin authentication — the single entry point used by POST /api/admin/session.
 *
 * Replaces the previous `auth-diagnostics.ts` surface. We deliberately bundle
 * the "no such account" / "wrong password" / "password hash missing" branches
 * into one public `invalid_credentials` code so the response cannot be used as
 * an account-enumeration oracle. The detailed cause is still recorded in the
 * server audit log for incident response.
 */

import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { hasDatabaseConfig } from '@/lib/env'
import type { AdminRole } from '@/lib/admin/rbac'

const LOCKOUT_THRESHOLD = 5
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export type AdminAuthFailureCode =
  | 'database_not_configured'
  | 'invalid_credentials'
  | 'account_inactive'
  | 'account_locked'
  | 'account_locked_now'
  | 'email_not_verified'
  | 'server_error'

export type AuthenticatedAdmin = {
  email: string
  role: AdminRole
  isActive: boolean
  tokenVersion: number
}

export type AdminAuthResult =
  | { ok: true; account: AuthenticatedAdmin }
  | { ok: false; code: AdminAuthFailureCode }

type InternalReason =
  | AdminAuthFailureCode
  | 'account_not_found'
  | 'password_hash_missing'
  | 'invalid_password'

type AuthLogInput =
  | { email: string; success: true }
  | { email: string; success: false; reason: InternalReason }

async function logAuthAttempt(input: AuthLogInput) {
  try {
    if (!hasDatabaseConfig()) {
      return
    }

    const summary = input.success ? 'Admin login successful' : `Admin login failed: ${input.reason}`

    await prisma.auditLog.create({
      data: {
        action: input.success ? 'admin.auth_success' : 'admin.auth_failed',
        entityType: 'admin_auth_attempt',
        actorEmail: input.email,
        actorRole: 'editor', // neutral role for auth records
        summary,
        metadata: {
          reason: input.success ? 'success' : input.reason,
          email: input.email,
          timestamp: new Date().toISOString(),
        },
      },
    })
  } catch (error) {
    // Audit-log failures must never break authentication.
    console.error('[admin-auth] Failed to write audit log', error)
  }
}

export async function authenticateAdminUser(
  email: string,
  password: string
): Promise<AdminAuthResult> {
  const normalizedEmail = email.trim().toLowerCase()

  try {
    if (!hasDatabaseConfig()) {
      return { ok: false, code: 'database_not_configured' }
    }

    const account = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
      select: {
        email: true,
        role: true,
        isActive: true,
        passwordHash: true,
        emailVerified: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        tokenVersion: true,
      },
    })

    if (!account) {
      await logAuthAttempt({ email: normalizedEmail, success: false, reason: 'account_not_found' })
      return { ok: false, code: 'invalid_credentials' }
    }

    // Refuse a locked account even if the password is correct, until the
    // lockout window elapses. Returned before the password is checked so an
    // attacker can't use response timing to confirm credentials.
    if (account.lockoutUntil && account.lockoutUntil.getTime() > Date.now()) {
      await logAuthAttempt({ email: normalizedEmail, success: false, reason: 'account_locked' })
      return { ok: false, code: 'account_locked' }
    }

    if (!account.isActive) {
      await logAuthAttempt({ email: normalizedEmail, success: false, reason: 'account_inactive' })
      return { ok: false, code: 'account_inactive' }
    }

    // Treat a missing hash as a generic credentials failure — externally
    // indistinguishable from a wrong password. The audit log captures the
    // detail so operators can repair the account.
    if (!account.passwordHash) {
      await logAuthAttempt({ email: normalizedEmail, success: false, reason: 'password_hash_missing' })
      return { ok: false, code: 'invalid_credentials' }
    }

    const passwordValid = await verifyPassword(password, account.passwordHash)

    if (!passwordValid) {
      const nextAttempts = (account.failedLoginAttempts ?? 0) + 1
      const shouldLock = nextAttempts >= LOCKOUT_THRESHOLD
      const lockoutUntil = shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null

      try {
        await prisma.adminUser.update({
          where: { email: normalizedEmail },
          data: {
            failedLoginAttempts: shouldLock ? 0 : nextAttempts,
            ...(shouldLock && { lockoutUntil }),
          },
        })
      } catch (updateError) {
        console.error('[admin-auth] Failed to record login failure', updateError)
      }

      const reason: InternalReason = shouldLock ? 'account_locked_now' : 'invalid_password'
      await logAuthAttempt({ email: normalizedEmail, success: false, reason })
      return { ok: false, code: shouldLock ? 'account_locked_now' : 'invalid_credentials' }
    }

    if (!account.emailVerified) {
      await logAuthAttempt({ email: normalizedEmail, success: false, reason: 'email_not_verified' })
      return { ok: false, code: 'email_not_verified' }
    }

    // Success: clear lockout state and stamp lastLoginAt. Failures here are
    // non-fatal — the admin is still authenticated; we just log the issue.
    try {
      await prisma.adminUser.update({
        where: { email: normalizedEmail },
        data: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      })
    } catch (updateError) {
      console.error('[admin-auth] Failed to stamp lastLoginAt', updateError)
    }

    await logAuthAttempt({ email: normalizedEmail, success: true })

    return {
      ok: true,
      account: {
        email: account.email,
        role: account.role,
        isActive: account.isActive,
        tokenVersion: account.tokenVersion ?? 0,
      },
    }
  } catch (error) {
    console.error('[admin-auth] Authentication threw', error)
    return { ok: false, code: 'server_error' }
  }
}
