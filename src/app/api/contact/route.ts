import { NextRequest, NextResponse } from 'next/server'
import { contactSchema } from '@/lib/validations'
import { createContactSubmission } from '@/lib/admin/repository'
import { contactLimiter, getClientIp } from '@/lib/rate-limit'
import { mapApiError } from '@/lib/admin/api-guard'

export async function POST(req: NextRequest) {
  const rl = contactLimiter(getClientIp(req))
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
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, phone, preferredDate, preferredTime, message } = parsed.data

    await createContactSubmission({ firstName, lastName, email, phone, preferredDate, preferredTime, message })

    return NextResponse.json({ success: true, message: 'Booking request received' })
  } catch (error) {
    return mapApiError(error, 'Failed to process request')
  }
}
