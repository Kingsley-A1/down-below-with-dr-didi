import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminSession } from '@/lib/admin/api-guard'
import { changeAdminPassword, writeAuditLog } from '@/lib/admin/repository'
import { sendEmail } from '@/lib/email/send'
import { passwordChanged as passwordChangedTemplate } from '@/lib/email/templates'
import { env } from '@/lib/env'
import { validationError } from '@/lib/api/errors'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password may not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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

  const result = await changeAdminPassword({
    email: session.email,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
  })

  if (!result.ok) {
    if (result.reason === 'INVALID_PASSWORD') {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect.' },
        { status: 400 }
      )
    }
    return NextResponse.json({ success: false, error: 'Could not change password.' }, { status: 400 })
  }

  const signinUrl = `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/admin/sign-in`
  const template = passwordChangedTemplate({
    recipientName: session.email,
    actionUrl: signinUrl,
    supportEmail: env.RESEND_FROM_EMAIL,
  })
  await sendEmail({
    to: session.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })

  await writeAuditLog({
    action: 'admin.password_changed',
    entityType: 'admin_user',
    actorEmail: session.email,
    actorRole: session.role,
    summary: `Admin password changed by ${session.email}`,
  })

  return NextResponse.json({
    success: true,
    message: 'Password updated. Existing sessions on other devices have been signed out.',
  })
}
