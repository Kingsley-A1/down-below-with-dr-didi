import { z } from 'zod'

// Values that are never acceptable in any environment.
const KNOWN_INSECURE_SECRETS = new Set([
  'replace-this-admin-session-secret-before-production',
  'replace-this-admin-access-code',
  'dev-secret-change-in-production',
  'replace-with-32-byte-random-hex-secret',
  'replace-with-a-long-random-secret-at-least-32-characters',
])

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().optional().default(''),
  DIRECT_URL: z.string().optional().default(''),
  R2_ACCOUNT_ID: z.string().optional().default(''),
  R2_ACCESS_KEY_ID: z.string().optional().default(''),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
  R2_BUCKET: z.string().optional().default(''),
  R2_PUBLIC_URL: z.string().optional().default(''),
  // Public user JWT secret. Validated lazily via getJwtSecret() so tests/builds
  // without env still parse, but any code path that needs it fails loudly.
  JWT_SECRET: z.string().trim().optional().default(''),
  // Admin secrets are validated lazily via getAdminEnv().
  ADMIN_SESSION_SECRET: z.string().trim().optional().default(''),
  ADMIN_ACCESS_CODE: z.string().trim().optional().default(''),
  ADMIN_SUPER_ADMIN_ACCESS_CODE: z.string().trim().optional().default(''),
  ADMIN_FOUNDER_ADMIN_ACCESS_CODE: z.string().trim().optional().default(''),
  ADMIN_EDITOR_ACCESS_CODE: z.string().trim().optional().default(''),
  ADMIN_ALLOWED_USERS: z.string().default('deblessedking001@gmail.com:super_admin')|| process.env.ADMIN_ALLOWED_USERS,
  // Optional comma-separated invite tokens: email:role:token
  ADMIN_INVITE_TOKENS: z.string().optional().default(''),
  VAULT_SUBMISSIONS_ENABLED: z.string().optional().default('true'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://down-below.com'),
  // Resend (email) — validated lazily via getEmailEnv() so non-email request
  // paths don't fail on missing config in dev. Required when any email is sent.
  RESEND_API_KEY: z.string().trim().optional().default(''),
  RESEND_FROM_EMAIL: z.string().trim().optional().default('no-reply@down-below.com'),
  RESEND_FROM_NAME: z.string().trim().optional().default('Dr. Didi · DownBelow'),
})

const requiredAdminAccessCodeSchema = (key: string) =>
  z.string().trim().regex(/^\d{6}$/, `${key} must be exactly 6 digits`)

const adminEnvSchema = z.object({
  ADMIN_SESSION_SECRET: z.string().trim().min(32, 'ADMIN_SESSION_SECRET must be at least 32 characters'),
  // ADMIN_ACCESS_CODE is the moderator-role code (standardised at 246810).
  // Promoted to required so an empty value can't silently disable moderator
  // registration (previously the moderator entry was filtered out).
  ADMIN_ACCESS_CODE: requiredAdminAccessCodeSchema('ADMIN_ACCESS_CODE'),
  ADMIN_SUPER_ADMIN_ACCESS_CODE: requiredAdminAccessCodeSchema('ADMIN_SUPER_ADMIN_ACCESS_CODE'),
  ADMIN_FOUNDER_ADMIN_ACCESS_CODE: requiredAdminAccessCodeSchema('ADMIN_FOUNDER_ADMIN_ACCESS_CODE'),
  ADMIN_EDITOR_ACCESS_CODE: requiredAdminAccessCodeSchema('ADMIN_EDITOR_ACCESS_CODE'),
})

const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().trim().min(10, 'RESEND_API_KEY is required (get one at https://resend.com)'),
  RESEND_FROM_EMAIL: z.string().trim().email('RESEND_FROM_EMAIL must be a valid email address'),
  RESEND_FROM_NAME: z.string().trim().min(1, 'RESEND_FROM_NAME is required'),
})

type EmailEnv = z.infer<typeof emailEnvSchema>

let emailEnvCache: { signature: string; value: EmailEnv } | null = null

function getRawEmailEnv() {
  return {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
  }
}

function normalizeSiteUrl(value: string | undefined) {
  const fallback = 'https://down-below.com'

  if (!value) {
    return fallback
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return fallback
  }

  try {
    return new URL(trimmed).toString()
  } catch {
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
      try {
        return new URL(`https://${trimmed}`).toString()
      } catch {
        return fallback
      }
    }

    return fallback
  }
}

const parsed = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  ADMIN_ACCESS_CODE: process.env.ADMIN_ACCESS_CODE,
  ADMIN_SUPER_ADMIN_ACCESS_CODE: process.env.ADMIN_SUPER_ADMIN_ACCESS_CODE,
  ADMIN_FOUNDER_ADMIN_ACCESS_CODE: process.env.ADMIN_FOUNDER_ADMIN_ACCESS_CODE,
  ADMIN_EDITOR_ACCESS_CODE: process.env.ADMIN_EDITOR_ACCESS_CODE,
  ADMIN_ALLOWED_USERS: process.env.ADMIN_ALLOWED_USERS,
  ADMIN_INVITE_TOKENS: process.env.ADMIN_INVITE_TOKENS,
  VAULT_SUBMISSIONS_ENABLED: process.env.VAULT_SUBMISSIONS_ENABLED,
  NEXT_PUBLIC_SITE_URL: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
})

export const env = parsed

type AdminEnv = z.infer<typeof adminEnvSchema>

let adminEnvCache: { signature: string; value: AdminEnv } | null = null

function getRawAdminEnv() {
  return {
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    ADMIN_ACCESS_CODE: process.env.ADMIN_ACCESS_CODE,
    ADMIN_SUPER_ADMIN_ACCESS_CODE: process.env.ADMIN_SUPER_ADMIN_ACCESS_CODE,
    ADMIN_FOUNDER_ADMIN_ACCESS_CODE: process.env.ADMIN_FOUNDER_ADMIN_ACCESS_CODE,
    ADMIN_EDITOR_ACCESS_CODE: process.env.ADMIN_EDITOR_ACCESS_CODE,
  }
}

export function getAdminHealthEnvStatus() {
  const rawAdminEnv = getRawAdminEnv()
  const accessCodes = [
    rawAdminEnv.ADMIN_ACCESS_CODE,
    rawAdminEnv.ADMIN_SUPER_ADMIN_ACCESS_CODE,
    rawAdminEnv.ADMIN_FOUNDER_ADMIN_ACCESS_CODE,
    rawAdminEnv.ADMIN_EDITOR_ACCESS_CODE,
  ]

  return {
    sessionSecretSet: Boolean(rawAdminEnv.ADMIN_SESSION_SECRET?.trim() && rawAdminEnv.ADMIN_SESSION_SECRET.trim().length >= 32),
    accessCodesConfigured: accessCodes.filter((value) => typeof value === 'string' && /^\d{6}$/.test(value.trim())).length,
  }
}

export function getAdminEnv() {
  const rawAdminEnv = getRawAdminEnv()
  const signature = JSON.stringify(rawAdminEnv)

  if (adminEnvCache?.signature === signature) {
    return adminEnvCache.value
  }

  const adminEnv = adminEnvSchema.parse(rawAdminEnv)

  if (KNOWN_INSECURE_SECRETS.has(adminEnv.ADMIN_SESSION_SECRET)) {
    throw new Error(
      '[env] ADMIN_SESSION_SECRET is set to a placeholder value. Set a real secret (≥32 random bytes) in your .env file.'
    )
  }

  const adminCodes = [
    adminEnv.ADMIN_ACCESS_CODE,
    adminEnv.ADMIN_SUPER_ADMIN_ACCESS_CODE,
    adminEnv.ADMIN_FOUNDER_ADMIN_ACCESS_CODE,
    adminEnv.ADMIN_EDITOR_ACCESS_CODE,
  ].filter(Boolean)

  if (new Set(adminCodes).size !== adminCodes.length) {
    throw new Error('[env] Admin registration codes must be unique per role.')
  }

  adminEnvCache = { signature, value: adminEnv }
  return adminEnvCache.value
}

export function hasDatabaseConfig() {
  return Boolean(env.DATABASE_URL)
}

export function hasR2Config() {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET)
}

export function isVaultSubmissionsEnabled() {
  const flag = env.VAULT_SUBMISSIONS_ENABLED.trim().toLowerCase()
  return !['0', 'false', 'off', 'disabled', 'no'].includes(flag)
}

let jwtSecretCache: { value: string } | null = null

/**
 * Returns the validated public user JWT signing secret. Throws if unset, too
 * short, or set to a known placeholder. Call lazily — auth code only.
 */
export function getJwtSecret(): string {
  if (jwtSecretCache) {
    return jwtSecretCache.value
  }

  const raw = (process.env.JWT_SECRET ?? '').trim()

  if (!raw) {
    throw new Error('[env] JWT_SECRET is not set. Generate one with `openssl rand -hex 32` and add to .env.')
  }

  if (raw.length < 32) {
    throw new Error('[env] JWT_SECRET must be at least 32 characters.')
  }

  if (KNOWN_INSECURE_SECRETS.has(raw)) {
    throw new Error('[env] JWT_SECRET is set to a placeholder value. Set a real secret (≥32 random bytes).')
  }

  jwtSecretCache = { value: raw }
  return raw
}

export function hasEmailProvider() {
  return Boolean(process.env.RESEND_API_KEY?.trim())
}

export function getEmailEnv() {
  const rawEmailEnv = getRawEmailEnv()
  const signature = JSON.stringify(rawEmailEnv)

  if (emailEnvCache?.signature === signature) {
    return emailEnvCache.value
  }

  const emailEnv = emailEnvSchema.parse(rawEmailEnv)

  emailEnvCache = { signature, value: emailEnv }
  return emailEnvCache.value
}
