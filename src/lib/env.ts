import { z } from 'zod'

// Values that are never acceptable in any environment.
const KNOWN_INSECURE_SECRETS = new Set([
  'replace-this-admin-session-secret-before-production',
  'replace-this-admin-access-code',
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
  // Admin secrets are validated lazily via getAdminEnv().
  ADMIN_SESSION_SECRET: z.string().optional().default(''),
  ADMIN_ACCESS_CODE: z.string().optional().default(''),
  ADMIN_ALLOWED_USERS: z.string().default('admin@down-below.com:super_admin'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://down-below.com'),
})

const adminEnvSchema = z.object({
  ADMIN_SESSION_SECRET: z.string().min(32, 'ADMIN_SESSION_SECRET must be at least 32 characters'),
  ADMIN_ACCESS_CODE: z.string().min(12, 'ADMIN_ACCESS_CODE must be at least 12 characters'),
})

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
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  ADMIN_ACCESS_CODE: process.env.ADMIN_ACCESS_CODE,
  ADMIN_ALLOWED_USERS: process.env.ADMIN_ALLOWED_USERS,
  NEXT_PUBLIC_SITE_URL: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
})

export const env = parsed

let adminEnvCache: z.infer<typeof adminEnvSchema> | null = null

export function getAdminEnv() {
  if (adminEnvCache) {
    return adminEnvCache
  }

  const adminEnv = adminEnvSchema.parse({
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    ADMIN_ACCESS_CODE: process.env.ADMIN_ACCESS_CODE,
  })

  if (KNOWN_INSECURE_SECRETS.has(adminEnv.ADMIN_SESSION_SECRET)) {
    throw new Error(
      '[env] ADMIN_SESSION_SECRET is set to a placeholder value. Set a real secret (≥32 random bytes) in your .env file.'
    )
  }

  if (KNOWN_INSECURE_SECRETS.has(adminEnv.ADMIN_ACCESS_CODE)) {
    throw new Error(
      '[env] ADMIN_ACCESS_CODE is set to a placeholder value. Set a real access code in your .env file.'
    )
  }

  adminEnvCache = adminEnv
  return adminEnvCache
}

export function hasDatabaseConfig() {
  return Boolean(env.DATABASE_URL)
}

export function hasR2Config() {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET)
}