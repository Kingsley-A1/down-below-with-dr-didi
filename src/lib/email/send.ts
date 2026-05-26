import { getResendClient } from '@/lib/email/client'
import { getEmailEnv, hasEmailProvider, env } from '@/lib/env'

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean }

/**
 * Send an email via Resend. Never throws — always returns a result so handlers
 * can decide whether a delivery failure should block the user-facing flow.
 *
 * Skips the send (returns `{ ok: false, skipped: true }`) if RESEND_API_KEY is
 * not configured. In development we additionally log the would-be payload so
 * verification flows still work without external dependencies.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!hasEmailProvider()) {
    if (env.NODE_ENV !== 'production') {
      console.warn('[email] RESEND_API_KEY not set — skipping send', {
        to: input.to,
        subject: input.subject,
      })
    }
    return { ok: false, skipped: true, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const { RESEND_FROM_EMAIL, RESEND_FROM_NAME } = getEmailEnv()
    const client = getResendClient()

    const result = await client.emails.send({
      from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    })

    if (result.error) {
      console.error('[email] Resend send failed', {
        to: input.to,
        subject: input.subject,
        error: result.error,
      })
      return { ok: false, error: result.error.message ?? 'Unknown Resend error' }
    }

    if (!result.data?.id) {
      return { ok: false, error: 'Resend returned no message id' }
    }

    return { ok: true, id: result.data.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[email] Resend send threw', {
      to: input.to,
      subject: input.subject,
      error: message,
    })
    return { ok: false, error: message }
  }
}
