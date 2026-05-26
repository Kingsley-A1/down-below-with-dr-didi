import { Resend } from 'resend'
import { getEmailEnv } from '@/lib/env'

let cached: { key: string; client: Resend } | null = null

export function getResendClient(): Resend {
  const { RESEND_API_KEY } = getEmailEnv()

  if (cached?.key === RESEND_API_KEY) {
    return cached.client
  }

  const client = new Resend(RESEND_API_KEY)
  cached = { key: RESEND_API_KEY, client }
  return client
}
