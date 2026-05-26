/**
 * Admin Diagnostics Endpoint
 * ==========================
 * Provides detailed diagnostics for admin authentication issues.
 *
 * Both GET and POST require an authenticated admin session — these handlers
 * leak account-existence and hash-format hints that would otherwise enable
 * account enumeration if exposed publicly.
 *
 * GET  /api/admin/diagnostics  → system-wide admin health
 * POST /api/admin/diagnostics  → login-attempt diagnostics (signed-in admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getAdminHealthStatus,
  authenticateAdminUserWithDiagnostics,
} from '@/lib/admin/auth-diagnostics'
import { requireAdminSession } from '@/lib/admin/api-guard'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const health = await getAdminHealthStatus()
    return NextResponse.json({
      success: true,
      health,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to check system health' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { email?: string; password?: string }
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const result = await authenticateAdminUserWithDiagnostics(
      email.trim().toLowerCase(),
      password,
      { logAttempt: true }
    )

    return NextResponse.json({
      success: result.success,
      email: result.attempt.email,
      reason: result.attempt.reason,
      timestamp: result.attempt.timestamp,
      diagnostics: result.attempt.diagnostics,
      ...(result.success && { account: result.account }),
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Diagnostic error', message: errorMsg },
      { status: 500 }
    )
  }
}
