import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, type UserSession } from '@/lib/auth/session'
import { listUserVaultThreads } from '@/lib/admin/repository'
import { serverError, serviceUnavailable } from '@/lib/api/errors'
import { isTransientPrismaError } from '@/lib/prisma-retry'

export async function GET(request: NextRequest) {
  let session: UserSession | null = null

  try {
    session = await requireAuth()

    const rawLimit = Number(request.nextUrl.searchParams.get('limit') || '20')
    const take = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 20

    const threads = await listUserVaultThreads(session.userId, { take })

    return NextResponse.json({
      success: true,
      threads,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized: No active session') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const context = {
      request,
      error,
      identity: session ? { userId: session.userId, email: session.email, role: session.role } : undefined,
    }

    if (isTransientPrismaError(error)) {
      return serviceUnavailable('database_unavailable', 'V-Vault threads are temporarily unavailable.', {
        ...context,
        action: 'Check database connectivity, then retry loading the user V-Vault thread.',
      })
    }

    return serverError('Failed to list V-Vault threads', context)
  }
}
