import { NextRequest, NextResponse } from 'next/server'
import { contactSchema } from '@/lib/validations'
import { createContactSubmission } from '@/lib/admin/repository'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { mapApiError } from '@/lib/admin/api-guard'
import { validationError } from '@/lib/api/errors'

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit({
    key: `contact:ip:${getClientIp(req)}`,
    windowMs: 10 * 60 * 1000,
    limit: 5,
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

  try {
    const body = await req.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const { firstName, lastName, email, phone, preferredDate, preferredTime, message } = parsed.data

    await createContactSubmission({ firstName, lastName, email, phone, preferredDate, preferredTime, message })

    return NextResponse.json({ success: true, message: 'Booking request received' })
  } catch (error) {
    return mapApiError(error, 'Failed to process request', { request: req })
  }
}
