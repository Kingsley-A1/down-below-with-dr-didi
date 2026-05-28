import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requestPasswordReset, getUserByEmail } from '@/lib/admin/user-repository'
import { sendEmail } from '@/lib/email/send'
import { passwordReset as passwordResetTemplate } from '@/lib/email/templates'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { env } from '@/lib/env'

const REQUEST_WINDOW_MS = 60 * 60 * 1000

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

function buildResetUrl(token: string) {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  return `${base}/reset-password?token=${encodeURIComponent(token)}`
}

const GENERIC_OK = NextResponse.json(
  {
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  },
  { status: 200 }
)

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const ipLimit = await checkRateLimit({ key: `auth-forgot:ip:${ip}`, windowMs: REQUEST_WINDOW_MS, limit: 10 })
  if (ipLimit.limited) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait and try again.' },
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

  const emailLimit = await checkRateLimit({ key: `auth-forgot:email:${email}`, windowMs: REQUEST_WINDOW_MS, limit: 3 })
  if (emailLimit.limited) {
    return GENERIC_OK
  }

  try {
    const token = await requestPasswordReset(email)
    if (!token) {
      return GENERIC_OK
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return GENERIC_OK
    }

    const resetUrl = buildResetUrl(token)
    const template = passwordResetTemplate({
      recipientName: user.displayName,
      actionUrl: resetUrl,
      expiresInMinutes: 60,
    })

    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    return GENERIC_OK
  } catch (error) {
    console.error('Forgot password error:', error)
    return GENERIC_OK
  }
}
