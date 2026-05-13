/**
 * Enhanced Admin Authentication System
 * ====================================
 * Provides comprehensive logging, error recovery, and diagnostics
 * 
 * Features:
 * - Detailed auth attempt logging
 * - Automatic recovery suggestions
 * - Session validation
 * - Account health checks
 */

import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { hasDatabaseConfig } from '@/lib/env'
import type { AdminRole } from '@/lib/admin/rbac'

export type AdminAuthDiagnostics = {
  email: string
  exists: boolean
  isActive: boolean
  hasPasswordHash: boolean
  passwordHashLength?: number
  passwordHashPrefix?: string
  lastLoginAt?: Date
  createdAt?: Date
  updatedAt?: Date
  diagnostics: {
    issues: string[]
    suggestions: string[]
    status: 'healthy' | 'degraded' | 'critical'
  }
}

export type AdminAuthAttempt = {
  email: string
  timestamp: Date
  success: boolean
  reason?: string
  diagnostics?: AdminAuthDiagnostics
}

/**
 * Diagnostic function to check admin account health
 * Returns detailed information about why authentication might be failing
 */
export async function diagnoseAdminAuth(email: string): Promise<AdminAuthDiagnostics> {
  if (!hasDatabaseConfig()) {
    return {
      email,
      exists: false,
      isActive: false,
      hasPasswordHash: false,
      diagnostics: {
        issues: ['Database not configured'],
        suggestions: ['Ensure DATABASE_URL environment variable is set'],
        status: 'critical'
      }
    }
  }

  const normalizedEmail = email.trim().toLowerCase()
  
  try {
    const account = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
      select: {
        email: true,
        isActive: true,
        passwordHash: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!account) {
      return {
        email: normalizedEmail,
        exists: false,
        isActive: false,
        hasPasswordHash: false,
        diagnostics: {
          issues: ['Admin account does not exist'],
          suggestions: [
            'Register the admin account via /api/admin/register',
            'Verify email address is correct',
            'Check if account was deleted'
          ],
          status: 'critical'
        }
      }
    }

    const issues: string[] = []
    const suggestions: string[] = []

    // Check if account is active
    if (!account.isActive) {
      issues.push('Account is marked as inactive')
      suggestions.push('Contact database admin to activate account')
      suggestions.push(`Run: UPDATE "AdminUser" SET "isActive" = true WHERE email = '${normalizedEmail}';`)
    }

    // Check if password hash exists
    if (!account.passwordHash) {
      issues.push('Password hash is NULL in database')
      suggestions.push('Re-register the admin account via /api/admin/register')
      suggestions.push('If registration was attempted before, account may have been partially created')
    }

    // Validate password hash format
    if (account.passwordHash) {
      const hashLen = account.passwordHash.length
      const hashPrefix = account.passwordHash.substring(0, 4)
      
      if (hashLen !== 60 || !['$2a$', '$2b$', '$2y$'].includes(hashPrefix)) {
        issues.push(`Password hash has invalid bcrypt format (length: ${hashLen}, prefix: ${hashPrefix})`)
        suggestions.push('Password hash is corrupted; re-register to create new hash')
      }
    }

    const status = issues.length === 0 ? 'healthy' : issues.length <= 1 ? 'degraded' : 'critical'

    return {
      email: normalizedEmail,
      exists: true,
      isActive: account.isActive,
      hasPasswordHash: !!account.passwordHash,
      passwordHashLength: account.passwordHash?.length,
      passwordHashPrefix: account.passwordHash?.substring(0, 4),
      lastLoginAt: account.lastLoginAt || undefined,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      diagnostics: {
        issues,
        suggestions,
        status
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      email: normalizedEmail,
      exists: false,
      isActive: false,
      hasPasswordHash: false,
      diagnostics: {
        issues: [`Database error: ${errorMsg}`],
        suggestions: ['Check database connection', 'Verify credentials are correct'],
        status: 'critical'
      }
    }
  }
}

/**
 * Enhanced authentication with detailed logging
 * Logs every attempt for security audit trail
 */
export async function authenticateAdminUserWithDiagnostics(
  email: string,
  password: string,
  options?: { logAttempt?: boolean }
): Promise<{
  success: boolean
  account?: { email: string; role: AdminRole; isActive: boolean }
  attempt: AdminAuthAttempt
}> {
  const { logAttempt = true } = options || {}
  const normalizedEmail = email.trim().toLowerCase()
  const timestamp = new Date()

  const attempt: AdminAuthAttempt = {
    email: normalizedEmail,
    timestamp,
    success: false
  }

  try {
    if (!hasDatabaseConfig()) {
      attempt.reason = 'DATABASE_NOT_CONFIGURED'
      return { success: false, attempt }
    }

    const account = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
      select: {
        email: true,
        role: true,
        isActive: true,
        passwordHash: true,
      }
    })

    // Account doesn't exist
    if (!account) {
      attempt.reason = 'ACCOUNT_NOT_FOUND'
      attempt.diagnostics = await diagnoseAdminAuth(normalizedEmail)
      
      if (logAttempt) {
        await logAuthAttempt(attempt)
      }
      
      return { success: false, attempt }
    }

    // Account not active
    if (!account.isActive) {
      attempt.reason = 'ACCOUNT_INACTIVE'
      attempt.diagnostics = await diagnoseAdminAuth(normalizedEmail)
      
      if (logAttempt) {
        await logAuthAttempt(attempt)
      }
      
      return { success: false, attempt }
    }

    // Password hash missing
    if (!account.passwordHash) {
      attempt.reason = 'PASSWORD_HASH_MISSING'
      attempt.diagnostics = await diagnoseAdminAuth(normalizedEmail)
      
      if (logAttempt) {
        await logAuthAttempt(attempt)
      }
      
      return { success: false, attempt }
    }

    // Verify password
    const passwordValid = await verifyPassword(password, account.passwordHash)

    if (!passwordValid) {
      attempt.reason = 'INVALID_PASSWORD'
      
      if (logAttempt) {
        await logAuthAttempt(attempt)
      }
      
      return { success: false, attempt }
    }

    // Success!
    attempt.success = true
    
    if (logAttempt) {
      await logAuthAttempt(attempt)
    }

    return {
      success: true,
      account: {
        email: account.email,
        role: account.role,
        isActive: account.isActive
      },
      attempt
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    attempt.reason = `ERROR: ${errorMsg}`
    
    if (logAttempt) {
      await logAuthAttempt(attempt)
    }
    
    return { success: false, attempt }
  }
}

/**
 * Log authentication attempt for security audit trail
 */
async function logAuthAttempt(attempt: AdminAuthAttempt): Promise<void> {
  try {
    if (!hasDatabaseConfig()) return

    // Log to AuditLog for security trail
    await prisma.auditLog.create({
      data: {
        action: attempt.success ? 'admin.auth_success' : 'admin.auth_failed',
        entityType: 'admin_auth_attempt',
        actorEmail: attempt.email,
        actorRole: 'editor', // Neutral role for auth attempts
        summary: attempt.success
          ? `Admin login successful`
          : `Admin login failed: ${attempt.reason}`,
        metadata: {
          reason: attempt.reason,
          email: attempt.email,
          timestamp: attempt.timestamp.toISOString(),
          diagnostics: attempt.diagnostics?.diagnostics
        }
      }
    })
  } catch {
    // Silently fail - don't let logging errors break authentication
    console.error('Failed to log auth attempt', attempt)
  }
}

/**
 * Get admin account health status
 * Useful for debugging ongoing issues
 */
export async function getAdminHealthStatus(): Promise<{
  databaseConnected: boolean
  adminUsersCount: number
  activeAdminsCount: number
  accountsWithoutPasswordHash: number
  issues: string[]
}> {
  const issues: string[] = []

  if (!hasDatabaseConfig()) {
    return {
      databaseConnected: false,
      adminUsersCount: 0,
      activeAdminsCount: 0,
      accountsWithoutPasswordHash: 0,
      issues: ['Database not configured']
    }
  }

  try {
    const adminUsers = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        isActive: true,
        passwordHash: true,
      }
    })

    const activeAdmins = adminUsers.filter(a => a.isActive).length
    const accountsWithoutHash = adminUsers.filter(a => !a.passwordHash).length

    if (accountsWithoutHash > 0) {
      issues.push(`Found ${accountsWithoutHash} admin account(s) without password hash`)
    }

    return {
      databaseConnected: true,
      adminUsersCount: adminUsers.length,
      activeAdminsCount: activeAdmins,
      accountsWithoutPasswordHash: accountsWithoutHash,
      issues
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      databaseConnected: false,
      adminUsersCount: 0,
      activeAdminsCount: 0,
      accountsWithoutPasswordHash: 0,
      issues: [`Failed to check health: ${errorMsg}`]
    }
  }
}
