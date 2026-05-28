import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resetAdminPassword, writeAuditLog } from '@/lib/admin/repository'
import { sendEmail } from '@/lib/email/send'
import { passwordChanged as passwordChangedTemplate } from '@/lib/email/templates'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { serverError, validationError } from '@/lib/api/errors'

const RESET_WINDOW_MS = 15 * 60 * 1000

const schema = z.object({
  token: z.string().trim().min(20, 'Invalid reset token'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password may not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const ipLimit = await checkRateLimit({ key: `admin-reset:ip:${ip}`, windowMs: RESET_WINDOW_MS, limit: 10 })
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

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error)
  }

  try {
    const updated = await resetAdminPassword(parsed.data.token, parsed.data.password)
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link. Request a new one.' },
        { status: 400 }
      )
    }

    const signinUrl = `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/admin/sign-in`
    const template = passwordChangedTemplate({
      recipientName: updated.name ?? updated.email,
      actionUrl: signinUrl,
      supportEmail: env.RESEND_FROM_EMAIL,
    })
    await sendEmail({
      to: updated.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    await writeAuditLog({
      action: 'admin.password_reset',
      entityType: 'admin_user',
      entityId: updated.id,
      actorEmail: updated.email,
      actorRole: updated.role,
      summary: `Admin password reset for ${updated.email}`,
    })

    return NextResponse.json({ success: true, message: 'Password reset. You can now sign in.' })
  } catch (error) {
    return serverError('Password reset failed', { request, error })
  }
}
