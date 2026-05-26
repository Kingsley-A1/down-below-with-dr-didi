import { NextRequest, NextResponse } from 'next/server'
import { resetPassword, getUserByEmail } from '@/lib/admin/user-repository'
import { prisma } from '@/lib/prisma'
import { userResetPasswordSchema } from '@/lib/validations'
import { sendEmail } from '@/lib/email/send'
import { passwordChanged as passwordChangedTemplate } from '@/lib/email/templates'
import { env, hasDatabaseConfig } from '@/lib/env'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'

const resetByIp = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 })

function buildSigninUrl() {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  return `${base}/login`
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const ipLimit = resetByIp(`auth-reset:ip:${ip}`)
  if (ipLimit.limited) {
    return NextResponse.json(
      { success: false, error: 'Too many reset attempts. Please wait and try again.' },
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

  const parsed = userResetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json(
      { success: false, error: 'Authentication database is not configured.' },
      { status: 503 }
    )
  }

  try {
    // Look up the email associated with the token so we can send a
    // confirmation email after the change. The token is single-use.
    const userRecord = await prisma.user.findUnique({
      where: { resetToken: parsed.data.token },
      select: { email: true },
    })

    const changed = await resetPassword(parsed.data.token, parsed.data.password)
    if (!changed) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link. Request a new one.' },
        { status: 400 }
      )
    }

    if (userRecord?.email) {
      const user = await getUserByEmail(userRecord.email)
      if (user) {
        const template = passwordChangedTemplate({
          recipientName: user.displayName,
          actionUrl: buildSigninUrl(),
          supportEmail: env.RESEND_FROM_EMAIL,
        })
        await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully. You can now log in.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { success: false, error: 'Password reset failed' },
      { status: 500 }
    )
  }
}
