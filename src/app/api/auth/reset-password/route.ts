import { NextRequest, NextResponse } from 'next/server'
import { resetPassword, getUserByEmail } from '@/lib/admin/user-repository'
import { prisma } from '@/lib/prisma'
import { userResetPasswordSchema } from '@/lib/validations'
import { sendEmail } from '@/lib/email/send'
import { passwordChanged as passwordChangedTemplate } from '@/lib/email/templates'
import { env, hasDatabaseConfig } from '@/lib/env'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { serverError, serviceUnavailable, validationError } from '@/lib/api/errors'

const RESET_WINDOW_MS = 15 * 60 * 1000

function buildSigninUrl() {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  return `${base}/login`
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const ipLimit = await checkRateLimit({ key: `auth-reset:ip:${ip}`, windowMs: RESET_WINDOW_MS, limit: 10 })
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
    return validationError(parsed.error)
  }

  if (!hasDatabaseConfig()) {
    return serviceUnavailable('database_unavailable', 'Authentication database is not configured.', {
      request,
      action: 'Set DATABASE_URL and run migrations before resetting passwords.',
    })
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
    return serverError('Password reset failed', { request, error })
  }
}
