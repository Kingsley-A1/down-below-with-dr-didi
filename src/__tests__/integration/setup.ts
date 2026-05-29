/**
 * Integration Test Setup
 * Provides database fixtures, request helpers, and cleanup utilities
 */

import { prisma } from '@/lib/prisma'
import { getRateLimiter } from '@/lib/auth/rate-limiter'
import { resetRateLimitFallbacksForTests } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export const hasIntegrationDatabase = Boolean(process.env.DATABASE_URL)

const TEST_PASSWORD_HASH = '$2b$10$eJu50XvCLWvA14C6.G38FuXn8WZiQgvW7rp58QHXixraKtHQDRcN6'

/**
 * Database cleanup - truncate all tables
 */
export async function cleanupDatabase() {
  getRateLimiter().destroy()
  resetRateLimitFallbacksForTests()

  // CockroachDB does not support all PostgreSQL TRUNCATE semantics with dropping indexes,
  // so we use ordered deleteMany calls for deterministic cleanup in tests.
  await prisma.vaultSubmissionEvent.deleteMany({}).catch(() => undefined)
  await prisma.userNotification.deleteMany({}).catch(() => undefined)
  await prisma.vaultResponse.deleteMany({}).catch(() => undefined)
  await prisma.vaultSubmission.deleteMany({}).catch(() => undefined)
  await prisma.auditLog.deleteMany({})
  await prisma.adminUser.deleteMany({}).catch(() => undefined)
  await prisma.user.deleteMany({})
}

export async function disconnectDatabase() {
  await prisma.$disconnect()
}

/**
 * Create test user with optional overrides
 */
export async function createTestUser(
  overrides?: Partial<{
    email: string
    displayName: string
    phone: string
    passwordHash: string
    role: string
    isActive: boolean
    emailVerified: boolean
    emailVerifyToken: string | null
    emailVerifyTokenExpiry: Date | null
    phoneVerifyCode: string | null
    phoneVerifyExpiry: Date | null
  }>,
) {
  return prisma.user.create({
    data: {
      email: overrides?.email || 'testuser@example.com',
      displayName: overrides?.displayName || 'Test User',
      phone: overrides?.phone || '+2348012345678',
      passwordHash: overrides?.passwordHash || TEST_PASSWORD_HASH,
      role: overrides?.role || 'member',
      isActive: overrides?.isActive ?? true,
      emailVerified: overrides?.emailVerified ?? false,
      emailVerifyToken:
        overrides?.emailVerifyToken !== undefined
          ? overrides.emailVerifyToken
          : 'test-token-' + Math.random(),
      emailVerifyTokenExpiry:
        overrides?.emailVerifyTokenExpiry !== undefined
          ? overrides.emailVerifyTokenExpiry
          : new Date(Date.now() + 24 * 60 * 60 * 1000),
      phoneVerifyCode: overrides?.phoneVerifyCode,
      phoneVerifyExpiry: overrides?.phoneVerifyExpiry,
    },
  })
}

/**
 * Create admin test user
 */
/**
 * Ensure an AdminUser row exists for the given email/role. Idempotent.
 * Tests must call this (or createAdminUser) before issuing a cookie for that
 * email, because requireAdminSession re-reads the AdminUser row per request
 * (Phase F: src/lib/admin/api-guard.ts).
 */
export async function ensureAdminUser(
  email: string,
  role: 'super_admin' | 'founder_admin' | 'editor' | 'moderator' = 'super_admin',
) {
  return prisma.adminUser.upsert({
    where: { email },
    update: {
      role,
      isActive: true,
      emailVerified: true,
      tokenVersion: 0,
      passwordHash: TEST_PASSWORD_HASH,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    },
    create: {
      email,
      name: 'Admin User',
      role,
      isActive: true,
      emailVerified: true,
      tokenVersion: 0,
      passwordHash: TEST_PASSWORD_HASH,
    },
  })
}

export async function createAdminUser(
  overrides?: Partial<{ email: string; displayName: string; role: string }>,
) {
  const email = overrides?.email || 'admin@example.com'
  const role = (overrides?.role || 'super_admin') as
    | 'super_admin'
    | 'founder_admin'
    | 'editor'
    | 'moderator'

  // Keep the legacy `User` row so any test reading `prisma.user` still works.
  const user = await createTestUser({
    role,
    email,
    displayName: overrides?.displayName || 'Admin User',
  })

  // Phase F: requireAdminSession in src/lib/admin/api-guard.ts now re-reads
  // the AdminUser row on every API call (isActive + emailVerified + tokenVersion).
  // Tests must therefore have a matching AdminUser record, not just a User row.
  await prisma.adminUser.upsert({
    where: { email },
    update: {
      role,
      isActive: true,
      emailVerified: true,
      tokenVersion: 0,
      passwordHash: TEST_PASSWORD_HASH,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    },
    create: {
      email,
      name: overrides?.displayName || 'Admin User',
      role,
      isActive: true,
      emailVerified: true,
      tokenVersion: 0,
      passwordHash: TEST_PASSWORD_HASH,
    },
  })

  return user
}

/**
 * Helper to mock NextRequest with auth headers
 */
export function createMockNextRequest(
  url: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
): NextRequest
export function createMockNextRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
) : NextRequest
export function createMockNextRequest(
  methodOrUrl: string,
  urlOrBody?: string | Record<string, unknown>,
  bodyOrHeaders?: Record<string, unknown> | Record<string, string>,
  headersMaybe?: Record<string, string>,
): NextRequest {
  const hasExplicitMethod = typeof urlOrBody === 'string'

  const method = hasExplicitMethod ? methodOrUrl : 'GET'
  const url = hasExplicitMethod ? (urlOrBody as string) : methodOrUrl
  const body = (hasExplicitMethod ? bodyOrHeaders : urlOrBody) as Record<string, unknown> | undefined
  const headers = (hasExplicitMethod ? headersMaybe : bodyOrHeaders) as Record<string, string> | undefined

  const init: ConstructorParameters<typeof NextRequest>[1] = {
    method,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'Mozilla/5.0 (Test)',
      ...headers,
    },
  }

  if (body) {
    init.body = JSON.stringify(body)
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), init)
}

/**
 * Extract response body as JSON
 */
export async function parseResponseBody(response: NextResponse | Response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

/**
 * Test fixture: valid registration payload
 */
export const validRegistrationPayload = {
  email: 'newuser@example.com',
  displayName: 'New User',
  phone: '+2348012345678',
  password: 'TestPassword@123',
  confirmPassword: 'TestPassword@123',
}

/**
 * Test fixture: valid login payload
 */
export const validLoginPayload = {
  email: 'testuser@example.com',
  password: 'TestPassword@123',
}

/**
 * Test fixture: invalid payloads
 */
export const invalidPayloads = {
  weakPassword: {
    email: 'test@example.com',
    password: 'weak',
    confirmPassword: 'weak',
  },
  invalidEmail: {
    email: 'not-an-email',
    password: 'TestPassword@123',
    confirmPassword: 'TestPassword@123',
  },
  passwordMismatch: {
    email: 'test@example.com',
    password: 'TestPassword@123',
    confirmPassword: 'DifferentPassword@123',
  },
}

/**
 * Wait for async operation with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 1000,
) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return true
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  return false
}

/**
 * Mock time advancement for token expiry tests
 */
export function createMockDate(offsetMs: number = 0) {
  return new Date(Date.now() + offsetMs)
}

const integrationTestSetup = {
  cleanupDatabase,
  disconnectDatabase,
  createTestUser,
  createAdminUser,
  ensureAdminUser,
  createMockNextRequest,
  parseResponseBody,
  validRegistrationPayload,
  validLoginPayload,
  invalidPayloads,
  waitFor,
  createMockDate,
}

export default integrationTestSetup
