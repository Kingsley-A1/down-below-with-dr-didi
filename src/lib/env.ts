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
  // No defaults — the app must not run with placeholder secrets.
  ADMIN_SESSION_SECRET: z.string().min(32, 'ADMIN_SESSION_SECRET must be at least 32 characters'),
  ADMIN_ACCESS_CODE: z.string().min(12, 'ADMIN_ACCESS_CODE must be at least 12 characters'),
  ADMIN_ALLOWED_USERS: z.string().default('admin@down-below.com.ng:super_admin'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://down-below.com.ng'),
})

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
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://down-below.com.ng',
})

// Fail fast on known-insecure placeholder values in any environment.
if (KNOWN_INSECURE_SECRETS.has(parsed.ADMIN_SESSION_SECRET)) {
  throw new Error(
    '[env] ADMIN_SESSION_SECRET is set to a placeholder value. Set a real secret (≥32 random bytes) in your .env file.'
  )
}

if (KNOWN_INSECURE_SECRETS.has(parsed.ADMIN_ACCESS_CODE)) {
  throw new Error(
    '[env] ADMIN_ACCESS_CODE is set to a placeholder value. Set a real access code in your .env file.'
  )
}

export const env = parsed

export function hasDatabaseConfig() {
  return Boolean(env.DATABASE_URL)
}

export function hasR2Config() {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET)
}