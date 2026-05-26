import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requestAdminPasswordReset } from '@/lib/admin/repository'
import { sendEmail } from '@/lib/email/send'
import { adminPasswordReset as adminPasswordResetTemplate } from '@/lib/email/templates'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'
import { env } from '@/lib/env'

const byIp = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 10 })
const byEmail = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 3 })

const schema = z.object({ email: z.string().trim().toLowerCase().email() })

const GENERIC_OK = NextResponse.json({
  success: true,
  message: 'If an admin account exists for that email, a reset link has been sent.',
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const ipLimit = byIp(`admin-forgot:ip:${ip}`)
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
  const emailLimit = byEmail(`admin-forgot:email:${email}`)
  if (emailLimit.limited) {
    return GENERIC_OK
  }

  try {
    const result = await requestAdminPasswordReset(email)
    if (result) {
      const resetUrl = `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/admin/reset-password?token=${encodeURIComponent(result.resetToken)}`
      const template = adminPasswordResetTemplate({
        recipientName: result.account.name ?? result.account.email,
        actionUrl: resetUrl,
        expiresInMinutes: Math.round((result.resetTokenExpiry.getTime() - Date.now()) / 60_000),
      })
      await sendEmail({
        to: result.account.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })
    }
  } catch (error) {
    console.error('Admin forgot-password error:', error)
  }

  return GENERIC_OK
}
