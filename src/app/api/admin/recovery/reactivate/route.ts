/**
 * Admin Account Recovery Endpoint
 * ===============================
 * Allows admins to repair corrupted accounts
 * 
 * POST /api/admin/recovery/reactivate
 * - Re-register or activate an existing admin account
 * - Requires: email, password, accessCode
 * - Returns: Success status and recovery details
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasDatabaseConfig } from '@/lib/env'
import { hashPassword } from '@/lib/auth/password'
import { resolveAdminRegistrationRole } from '@/lib/admin/session'
import { writeAuditLog } from '@/lib/admin/repository'
import { diagnoseAdminAuth } from '@/lib/admin/auth-diagnostics'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'
import { adminRecoverySchema } from '@/lib/validations'

const adminRecoveryIpLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 12 })
const adminRecoveryIdentityLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 6 })

async function safeWriteAuditLog(entry: {
  action: string
  entityType: string
  actorEmail: string
  actorRole: 'editor' | 'moderator' | 'founder_admin' | 'super_admin'
  summary: string
  metadata?: Record<string, unknown>
}) {
  try {
    await writeAuditLog(entry)
  } catch {
    // Recovery flow must not fail because audit logging fails.
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!hasDatabaseConfig()) {
      return NextResponse.json(
        { error: 'Admin database is not configured' },
        { status: 503 }
      )
    }

    const clientIp = getClientIp(request)

    const ipLimit = adminRecoveryIpLimiter(`admin-recovery:ip:${clientIp}`)
    if (ipLimit.limited) {
      return NextResponse.json(
        { error: 'Too many recovery attempts. Please wait and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((ipLimit.resetAt - Date.now()) / 1000)) },
        }
      )
    }

    const body = await request.json()
    const parsed = adminRecoverySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid recovery payload', issues: parsed.error.issues }, { status: 400 })
    }

    const { email, password, accessCode } = parsed.data

    const identityLimit = adminRecoveryIdentityLimiter(`admin-recovery:email:${email}`)
    if (identityLimit.limited) {
      return NextResponse.json(
        { error: 'Too many recovery attempts. Please wait and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((identityLimit.resetAt - Date.now()) / 1000)) },
        }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check access code validity
    const role = resolveAdminRegistrationRole(accessCode.trim())
    if (!role) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      )
    }

    // Get current account status
    const diagnostics = await diagnoseAdminAuth(normalizedEmail)

    // If account doesn't exist, this is a registration, not recovery
    if (!diagnostics.exists) {
      return NextResponse.json(
        {
          error: 'Account does not exist',
          diagnostics,
          suggestion: 'Use /api/admin/register endpoint instead'
        },
        { status: 404 }
      )
    }

    // Proceed with recovery
    const passwordHash = await hashPassword(password)

    try {
      const updated = await prisma.adminUser.update({
        where: { email: normalizedEmail },
        data: {
          passwordHash,
          isActive: true,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          updatedAt: true,
        }
      })

      // Log recovery action
      await safeWriteAuditLog({
        action: 'admin.account_recovered',
        entityType: 'admin_user',
        actorEmail: normalizedEmail,
        actorRole: 'editor',
        summary: 'Admin account recovered and reactivated',
        metadata: {
          clientIp,
          issuesBefore: diagnostics.diagnostics.issues,
          fixedAt: new Date().toISOString()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Admin account has been recovered and reactivated',
        account: {
          email: updated.email,
          name: updated.name,
          role: updated.role,
          isActive: updated.isActive,
          updatedAt: updated.updatedAt
        },
        next_steps: [
          'Clear your browser cookies',
          'Try logging in at /admin/sign-in',
          'Contact support if issues persist'
        ]
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'

      await safeWriteAuditLog({
        action: 'admin.account_recovery_failed',
        entityType: 'admin_user',
        actorEmail: normalizedEmail,
        actorRole: 'editor',
        summary: `Admin account recovery failed: ${errorMsg}`,
        metadata: { clientIp, error: errorMsg }
      })

      return NextResponse.json(
        {
          error: 'Failed to recover account',
          message: 'Could not complete account recovery. Please retry in a moment or contact support.',
          diagnostics
        },
        { status: 500 }
      )
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Recovery error', message: errorMsg },
      { status: 500 }
    )
  }
}
