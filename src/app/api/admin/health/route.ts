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
import { requireAdminSession, requireAdminRole } from '@/lib/admin/api-guard'
import { getAdminHealthSnapshot } from '@/lib/admin/health'
import { logApiServerError, resolveRequestId } from '@/lib/api/observability'

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

  const body = await getAdminHealthSnapshot({
    requestId,
    onProbeError: ({ probe, error }) => {
      logApiServerError({
        code: 'database_unavailable',
        message: `Admin health database probe failed for ${probe.model}.`,
        requestId,
        context: {
          request,
          error,
          identity: { email: session.email, role: session.role },
          metadata: { probe: 'admin_health', model: probe.model },
        },
      })
    },
  })

  return NextResponse.json(body, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
