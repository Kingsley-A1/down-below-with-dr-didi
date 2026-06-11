import { NextRequest, NextResponse } from 'next/server'
import {
  verifyAdminEmailCode,
  regenerateAdminEmailVerificationCode,
  writeAuditLog,
} from '@/lib/admin/repository'
import { sendEmail } from '@/lib/email/send'
import {
  welcomeAdmin as welcomeAdminTemplate,
  verifyAdminEmail as verifyAdminEmailTemplate,
} from '@/lib/email/templates'
import { adminVerifyEmailSchema, resendVerificationSchema } from '@/lib/validations'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { serverError } from '@/lib/api/errors'

const VERIFY_WINDOW_MS = 15 * 60 * 1000
const RESEND_WINDOW_MS = 60 * 60 * 1000

function adminSignInUrl() {
  return `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/admin/sign-in`
}

/**
 * POST /api/admin/verify-email
 * Body: { email, code } → marks the admin as verified.
 *   OR  { email }       → re-sends a verification code if the account is unverified.
 *
 * We respond generically on the resend branch to avoid leaking which emails
 * belong to admin accounts.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const ipLimit = await checkRateLimit({ key: `admin-verify:ip:${ip}`, windowMs: VERIFY_WINDOW_MS, limit: 15 })
  if (ipLimit.limited) {
    return NextResponse.json(
      { success: false, error: 'Too many verification attempts. Please wait and try again.' },
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

  // Verify branch: a code is present.
  const verifyParsed = adminVerifyEmailSchema.safeParse(body)
  if (verifyParsed.success) {
    const { email, code } = verifyParsed.data

    const emailLimit = await checkRateLimit({ key: `admin-verify:email:${email}`, windowMs: VERIFY_WINDOW_MS, limit: 10 })
    if (emailLimit.limited) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please wait and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((emailLimit.resetAt - Date.now()) / 1000)) },
        }
      )
    }

    try {
      const result = await verifyAdminEmailCode(email, code)
      if (!result.verified) {
        return NextResponse.json(
          {
            success: false,
            error:
              result.reason === 'expired'
                ? 'This verification code has expired. Request a new one and try again.'
                : 'That code is invalid. Check the 6-digit code and try again.',
          },
          { status: 400 }
        )
      }

      const verified = result.account
      const signinUrl = adminSignInUrl()
      const template = welcomeAdminTemplate({
        recipientName: verified.name ?? verified.email,
        actionUrl: signinUrl,
        role: verified.role,
      })
      await sendEmail({
        to: verified.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      await writeAuditLog({
        action: 'admin.email_verified',
        entityType: 'admin_user',
        entityId: verified.id,
        actorEmail: verified.email,
        actorRole: verified.role,
        summary: `Admin email verified for ${verified.email}`,
      })

      return NextResponse.json({
        success: true,
        message: 'Email verified. You can now sign in.',
        signinUrl,
      })
    } catch (error) {
      return serverError('Verification failed.', { request, error })
    }
  }

  // Resend branch: only an email is present.
  const resendParsed = resendVerificationSchema.safeParse(body)
  if (resendParsed.success) {
    const email = resendParsed.data.email
    const emailLimit = await checkRateLimit({ key: `admin-verify-resend:${email}`, windowMs: RESEND_WINDOW_MS, limit: 3 })
    if (emailLimit.limited) {
      return NextResponse.json({ success: true, message: 'If your account needs verification, a fresh code has been sent.' })
    }

    try {
      const result = await regenerateAdminEmailVerificationCode(email)
      if (result) {
        const template = verifyAdminEmailTemplate({
          recipientName: result.account.name ?? result.account.email,
          code: result.verificationCode,
          expiresInMinutes: Math.round((result.verificationExpiresAt.getTime() - Date.now()) / 60_000),
          role: result.account.role,
        })
        await sendEmail({
          to: result.account.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
      }
    } catch (error) {
      console.error('Admin verification resend error:', error)
    }

    return NextResponse.json({ success: true, message: 'If your account needs verification, a fresh code has been sent.' })
  }

  return NextResponse.json(
    { success: false, error: 'A verification code or email is required.' },
    { status: 400 }
  )
}
