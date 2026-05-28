import { NextRequest, NextResponse } from 'next/server'
import { vaultSchema } from '@/lib/validations'
import { createVaultSubmission } from '@/lib/admin/repository'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { isVaultSubmissionsEnabled } from '@/lib/env'
import { mapApiError } from '@/lib/admin/api-guard'
import { getSession, type UserSession } from '@/lib/auth/session'
import { serviceUnavailable, validationError } from '@/lib/api/errors'

export async function POST(req: NextRequest) {
  if (!isVaultSubmissionsEnabled()) {
    return serviceUnavailable('service_unavailable', 'Anonymous V-Vault submissions are currently paused.', {
      request: req,
      action: 'Enable V-Vault submissions when the team is ready to receive new questions.',
    })
  }

  const rl = await checkRateLimit({
    key: `vault:ip:${getClientIp(req)}`,
    windowMs: 10 * 60 * 1000,
    limit: 10,
  })
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before submitting again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  let session: UserSession | null = null

  try {
    session = await getSession()

    if (!session) {
      return NextResponse.json(
        {
          error: 'You need to be logged in to submit to V-Vault.',
        },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = vaultSchema.safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const { category, question } = parsed.data

    await createVaultSubmission({
      category,
      question,
      userId: session.userId,
      source: 'app_authenticated',
    })

    return NextResponse.json({ success: true, message: 'Question received' })
  } catch (error) {
    return mapApiError(error, 'Failed to process request', {
      request: req,
      identity: session ? { userId: session.userId, email: session.email, role: session.role } : undefined,
    })
  }
}
