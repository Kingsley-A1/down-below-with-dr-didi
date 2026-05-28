/**
 * Admin health snapshot — super_admin only.
 *
 * Replaces the deleted /api/admin/diagnostics endpoint. Returns operational
 * metrics + env-config status so operators can verify the deploy is wired up,
 * with NO per-email lookup (closes the previous enumeration oracle).
 *
 * Auth: requires an authenticated super_admin session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasDatabaseConfig, hasEmailProvider, hasR2Config } from '@/lib/env'
import { requireAdminSession, requireAdminRole } from '@/lib/admin/api-guard'
import { OPERATOR_ERROR_REFERENCE, type OperatorErrorReference } from '@/lib/api/error-reference'
import { logApiServerError, resolveRequestId } from '@/lib/api/observability'

type HealthResponse = {
  ok: true
  requestId: string
  timestamp: string
  database: {
    configured: boolean
    reachable: boolean
  }
  email: {
    provider: 'resend' | null
    configured: boolean
  }
  storage: {
    configured: boolean
  }
  adminEnv: {
    sessionSecretSet: boolean
    accessCodesConfigured: number
  }
  adminUsers: {
    total: number
    active: number
    unverified: number
    locked: number
  }
  errorReference: OperatorErrorReference[]
}

function countConfiguredAccessCodes() {
  const codes = [
    process.env.ADMIN_ACCESS_CODE,
    process.env.ADMIN_SUPER_ADMIN_ACCESS_CODE,
    process.env.ADMIN_FOUNDER_ADMIN_ACCESS_CODE,
    process.env.ADMIN_EDITOR_ACCESS_CODE,
  ]
  return codes.filter((value) => typeof value === 'string' && /^\d{6}$/.test(value.trim())).length
}

export async function GET(request: NextRequest) {
  const requestId = resolveRequestId(request)
  const session = await requireAdminSession(request)
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'super_admin')
  if (roleError) {
    return roleError
  }

  const databaseConfigured = hasDatabaseConfig()
  let databaseReachable = false
  let adminUsersTotal = 0
  let adminUsersActive = 0
  let adminUsersUnverified = 0
  let adminUsersLocked = 0

  if (databaseConfigured) {
    try {
      const now = new Date()
      const [total, active, unverified, locked] = await Promise.all([
        prisma.adminUser.count(),
        prisma.adminUser.count({ where: { isActive: true } }),
        prisma.adminUser.count({ where: { emailVerified: false } }),
        prisma.adminUser.count({ where: { lockoutUntil: { gt: now } } }),
      ])
      databaseReachable = true
      adminUsersTotal = total
      adminUsersActive = active
      adminUsersUnverified = unverified
      adminUsersLocked = locked
    } catch (error) {
      logApiServerError({
        code: 'database_unavailable',
        message: 'Admin health database probe failed.',
        requestId,
        context: {
          request,
          error,
          identity: { email: session.email, role: session.role },
          metadata: { probe: 'admin_health' },
        },
      })
    }
  }

  const body: HealthResponse = {
    ok: true,
    requestId,
    timestamp: new Date().toISOString(),
    database: {
      configured: databaseConfigured,
      reachable: databaseReachable,
    },
    email: {
      provider: hasEmailProvider() ? 'resend' : null,
      configured: hasEmailProvider(),
    },
    storage: {
      configured: hasR2Config(),
    },
    adminEnv: {
      sessionSecretSet: Boolean(process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 32),
      accessCodesConfigured: countConfiguredAccessCodes(),
    },
    adminUsers: {
      total: adminUsersTotal,
      active: adminUsersActive,
      unverified: adminUsersUnverified,
      locked: adminUsersLocked,
    },
    errorReference: OPERATOR_ERROR_REFERENCE,
  }

  return NextResponse.json(body, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
