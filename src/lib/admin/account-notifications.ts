import { sendEmail, type SendEmailResult } from '@/lib/email/send'
import {
  adminAccountCreated,
  adminAccountDeleted,
  adminAccountSuspended,
  adminAccountUpdated,
} from '@/lib/email/templates'
import { env } from '@/lib/env'
import type { AdminAccountRecord } from '@/lib/admin/repository'

type AdminAccountNotificationAction = 'created' | 'updated' | 'suspended' | 'deleted'

interface NotifyAdminAccountChangeInput {
  action: AdminAccountNotificationAction
  account: AdminAccountRecord
  actorEmail: string
  changedFields?: string[]
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email address',
  phone: 'Phone number',
  role: 'Role',
  isActive: 'Account status',
  password: 'Password',
}

function getRecipientName(account: AdminAccountRecord): string {
  return account.name?.trim() || account.email
}

function getAdminSignInUrl(): string {
  return `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/admin/sign-in`
}

function getChangedFieldLabels(changedFields: string[] | undefined): string[] {
  return [...new Set(changedFields ?? [])]
    .filter((field) => field !== 'id')
    .map((field) => FIELD_LABELS[field] ?? field)
}

export async function notifyAdminAccountChange(input: NotifyAdminAccountChangeInput): Promise<SendEmailResult> {
  const recipientName = getRecipientName(input.account)
  const supportEmail = env.RESEND_FROM_EMAIL
  const template =
    input.action === 'created'
      ? adminAccountCreated({
          recipientName,
          actionUrl: getAdminSignInUrl(),
          role: input.account.role,
          actorEmail: input.actorEmail,
        })
      : input.action === 'updated'
      ? adminAccountUpdated({
          recipientName,
          actionUrl: getAdminSignInUrl(),
          role: input.account.role,
          changedFields: getChangedFieldLabels(input.changedFields),
          actorEmail: input.actorEmail,
        })
      : input.action === 'suspended'
        ? adminAccountSuspended({
            recipientName,
            actorEmail: input.actorEmail,
            supportEmail,
          })
        : adminAccountDeleted({
            recipientName,
            actorEmail: input.actorEmail,
            supportEmail,
          })

  return sendEmail({
    to: input.account.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}
