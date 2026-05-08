import { NextRequest, NextResponse } from 'next/server'
import { vaultSchema } from '@/lib/validations'
import { createVaultSubmission } from '@/lib/admin/repository'
import { vaultLimiter, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
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
    const body = await req.json()
    const parsed = vaultSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { category, question } = parsed.data

    await createVaultSubmission({ category, question })

    return NextResponse.json({ success: true, message: 'Question received' })
  } catch {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
