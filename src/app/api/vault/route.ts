import { NextRequest, NextResponse } from 'next/server'
import { vaultSchema } from '@/lib/validations'
import { createVaultSubmission } from '@/lib/admin/repository'
import { vaultLimiter, getClientIp } from '@/lib/rate-limit'
import { isVaultSubmissionsEnabled } from '@/lib/env'
import { mapApiError } from '@/lib/admin/api-guard'
import { getSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  if (!isVaultSubmissionsEnabled()) {
    return NextResponse.json(
      {
        error: 'Anonymous V-Vault submissions are currently paused.',
      },
      { status: 503 }
    )
  }

  const rl = vaultLimiter(getClientIp(req))
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before submitting again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const session = await getSession()

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
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 }
      )
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
    return mapApiError(error, 'Failed to process request')
  }
}
