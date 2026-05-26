import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { regenerateEmailVerificationToken } from '@/lib/admin/user-repository'
import { sendEmail } from '@/lib/email/send'
import { verifyEmail as verifyEmailTemplate } from '@/lib/email/templates'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'
import { env } from '@/lib/env'

// 3 resends per email per hour — enough for a user retrying with typos but
// not enough for someone using us as a free email bombing service.
const resendByEmail = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 3 })
// 10 resends per IP per hour — defence-in-depth.
const resendByIp = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 10 })

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

function buildVerifyUrl(token: string) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  return `${base}/verify-email?token=${encodeURIComponent(token)}`
}

const GENERIC_OK = NextResponse.json(
  {
    success: true,
    message: 'If your account needs verification, a fresh link has been sent.',
  },
  { status: 200 }
)

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const ipLimit = resendByIp(`auth-resend:ip:${ip}`)
  if (ipLimit.limited) {
    return NextResponse.json(
      { success: false, error: 'Too many resend attempts. Please wait and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((ipLimit.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'A valid email is required' }, { status: 400 })
  }

  const email = parsed.data.email

  const emailLimit = resendByEmail(`auth-resend:email:${email}`)
  if (emailLimit.limited) {
    // Generic to avoid revealing existence; 429 still signals rate limiting.
    return GENERIC_OK
  }

  try {
    const result = await regenerateEmailVerificationToken(email)
    if (!result) {
      return GENERIC_OK
    }

    const verifyUrl = buildVerifyUrl(result.verificationToken)
    const template = verifyEmailTemplate({
      recipientName: result.user.displayName,
      actionUrl: verifyUrl,
      expiresInMinutes: Math.round((result.verificationExpiresAt.getTime() - Date.now()) / 60_000),
    })

    await sendEmail({
      to: result.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    return GENERIC_OK
  } catch (error) {
    console.error('Resend verification error:', error)
    return GENERIC_OK
  }
}
