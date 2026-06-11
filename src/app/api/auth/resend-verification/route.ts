import { NextRequest, NextResponse } from 'next/server'
import { regenerateEmailVerificationCode } from '@/lib/admin/user-repository'
import { sendEmail } from '@/lib/email/send'
import { verifyEmail as verifyEmailTemplate } from '@/lib/email/templates'
import { resendVerificationSchema } from '@/lib/validations'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const RESEND_WINDOW_MS = 60 * 60 * 1000

const GENERIC_OK = NextResponse.json(
  {
    success: true,
    message: 'If your account needs verification, a fresh code has been sent.',
  },
  { status: 200 }
)

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const ipLimit = await checkRateLimit({ key: `auth-resend:ip:${ip}`, windowMs: RESEND_WINDOW_MS, limit: 10 })
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

  const parsed = resendVerificationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'A valid email is required' }, { status: 400 })
  }

  const email = parsed.data.email

  const emailLimit = await checkRateLimit({ key: `auth-resend:email:${email}`, windowMs: RESEND_WINDOW_MS, limit: 3 })
  if (emailLimit.limited) {
    // Generic to avoid revealing existence.
    return GENERIC_OK
  }

  try {
    const result = await regenerateEmailVerificationCode(email)
    if (!result) {
      return GENERIC_OK
    }

    const template = verifyEmailTemplate({
      recipientName: result.user.displayName,
      code: result.verificationCode,
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
