import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().optional().default(''),
  DIRECT_URL: z.string().optional().default(''),
  R2_ACCOUNT_ID: z.string().optional().default(''),
  R2_ACCESS_KEY_ID: z.string().optional().default(''),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
  R2_BUCKET: z.string().optional().default(''),
  R2_PUBLIC_URL: z.string().optional().default(''),
  ADMIN_SESSION_SECRET: z.string().min(32).default('replace-this-admin-session-secret-before-production'),
  ADMIN_ACCESS_CODE: z.string().min(12).default('replace-this-admin-access-code'),
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

export const env = parsed

export function hasDatabaseConfig() {
  return Boolean(env.DATABASE_URL)
}

export function hasR2Config() {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET)
}