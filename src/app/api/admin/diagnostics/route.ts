/**
 * Admin Diagnostics Endpoint
 * ==========================
 * Provides detailed diagnostics for admin authentication issues
 *
 * GET /api/admin/diagnostics
 * - Returns: System-wide health status (requires authentication)
 *
 * POST /api/admin/diagnostics
 * - Returns: Login attempt diagnostics payload
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getAdminHealthStatus,
  authenticateAdminUserWithDiagnostics 
} from '@/lib/admin/auth-diagnostics'
import { requireAdminSession } from '@/lib/admin/api-guard'

/**
 * GET /api/admin/diagnostics
 * System-wide health check (requires authentication)
 */
export async function GET(request: NextRequest) {
  // Require admin session
  const session = await requireAdminSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const health = await getAdminHealthStatus()
    return NextResponse.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/diagnostics/login
 * Test login and get detailed diagnostics
 * Useful for troubleshooting login failures
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
      skipLogging?: boolean
    }
    const { email, password, skipLogging } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const result = await authenticateAdminUserWithDiagnostics(
      email.trim().toLowerCase(),
      password,
      { logAttempt: !Boolean(skipLogging) }
    )

    return NextResponse.json({
      success: result.success,
      email: result.attempt.email,
      reason: result.attempt.reason,
      timestamp: result.attempt.timestamp,
      diagnostics: result.attempt.diagnostics,
      ...(result.success && { account: result.account })
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Diagnostic error', message: errorMsg },
      { status: 500 }
    )
  }
}
