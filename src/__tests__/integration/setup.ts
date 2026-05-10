/**
 * Integration Test Setup
 * Provides database fixtures, request helpers, and cleanup utilities
 */

import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Database cleanup - truncate all tables
 */
export async function cleanupDatabase() {
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "AuditLog" CASCADE')
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE')
  } catch (error) {
    // Handle foreign key constraints
    await prisma.auditLog.deleteMany({})
    await prisma.user.deleteMany({})
  }
}

/**
 * Create test user with optional overrides
 */
export async function createTestUser(
  overrides?: Partial<{
    email: string
    displayName: string
    phone: string
    role: string
    isActive: boolean
    emailVerified: boolean
  }>,
) {
  return prisma.user.create({
    data: {
      email: overrides?.email || 'testuser@example.com',
      displayName: overrides?.displayName || 'Test User',
      phone: overrides?.phone || '+2348012345678',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz', // Mock bcrypt hash
      role: overrides?.role || 'member',
      isActive: overrides?.isActive ?? true,
      emailVerified: overrides?.emailVerified ?? false,
      emailVerifyToken: 'test-token-' + Math.random(),
      emailVerifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
}

/**
 * Create admin test user
 */
export async function createAdminUser(
  overrides?: Partial<{ email: string; displayName: string }>,
) {
  return createTestUser({
    role: 'super_admin',
    email: overrides?.email || 'admin@example.com',
    displayName: overrides?.displayName || 'Admin User',
  })
}

/**
 * Helper to mock NextRequest with auth headers
 */
export function createMockNextRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const mockHeaders = new Map(
    Object.entries({
      'content-type': 'application/json',
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'Mozilla/5.0 (Test)',
      ...headers,
    }),
  )

  const init: RequestInit = {
    method,
    headers: mockHeaders as HeadersInit,
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

export default {
  cleanupDatabase,
  createTestUser,
  createAdminUser,
  createMockNextRequest,
  parseResponseBody,
  validRegistrationPayload,
  validLoginPayload,
  invalidPayloads,
  waitFor,
  createMockDate,
}
