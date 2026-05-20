import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { getClientIp, createRateLimiter } from '@/lib/rate-limit'
import { adminRegisterSchema } from '@/lib/validations'
import { resolveAdminRegistrationRole, createAdminSessionToken, sessionCookieOptions, ADMIN_SESSION_COOKIE } from '@/lib/admin/session'
import { env, hasDatabaseConfig } from '@/lib/env'
import { registerAdminUserAccount, writeAuditLog } from '@/lib/admin/repository'

const adminRegisterIpLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 12 })
const adminRegisterIdentityLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 6 })

type AuditLogEntry = Parameters<typeof writeAuditLog>[0]

function getPrismaErrorCode(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : null
  }

  return null
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function isMissingAdminTableError(error: unknown) {
  const code = getPrismaErrorCode(error)
  const message = getErrorMessage(error)

  return code === 'P2021' || message.includes('The table `public.AdminUser` does not exist')
}

function isPrismaMissingColumnError(error: unknown) {
  const code = getPrismaErrorCode(error)
  const message = getErrorMessage(error)

  return code === 'P2022' || message.includes('does not exist in the current database')
}

function isPrismaConnectionError(error: unknown) {
  const code = getPrismaErrorCode(error)
  const message = getErrorMessage(error)

  return (
    ['P1000', 'P1001', 'P1002', 'P1008', 'P1017'].includes(code ?? '') ||
    [
      'Connection terminated unexpectedly',
      'connect timeout',
      'ETIMEDOUT',
      'ECONNRESET',
      'getaddrinfo',
    ].some((needle) => message.includes(needle))
  )
}

function isUniqueConstraintError(error: unknown) {
  return getPrismaErrorCode(error) === 'P2002'
}

function isAdminEnvConfigurationError(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.some((issue) => String(issue.path[0] ?? '').startsWith('ADMIN_'))
  }

  return error instanceof Error && error.message.startsWith('[env]')
}

function isPrismaAdminSchemaMismatchError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const hasModelContext = error.message.includes('model `AdminUser`')
  const hasUnknownArgument =
    error.message.includes('Unknown argument `name`') ||
    error.message.includes('Unknown argument `phone`') ||
    error.message.includes('Unknown argument `passwordHash`') ||
    error.message.includes('Unknown argument `lastLoginAt`')

  return hasModelContext && hasUnknownArgument
}

function logAdminRegistrationError(request: NextRequest, error: unknown, context: Record<string, unknown>) {
  console.error(JSON.stringify({
    level: 'error',
    route: '/api/admin/register',
    requestId: request.headers.get('x-vercel-id'),
    errorName: error instanceof Error ? error.name : 'UnknownError',
    errorCode: getPrismaErrorCode(error),
    errorMessage: getErrorMessage(error),
    ...context,
  }))
}

async function safeWriteAuditLog(request: NextRequest, entry: AuditLogEntry) {
  try {
    await writeAuditLog(entry)
  } catch (error) {
    logAdminRegistrationError(request, error, {
      stage: 'audit_log',
      auditAction: entry.action,
    })
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const requestId = request.headers.get('x-vercel-id')

  console.log(JSON.stringify({
    level: 'info',
    route: '/api/admin/register',
    requestId,
    stage: 'start',
  }))

  if (!hasDatabaseConfig()) {
    return NextResponse.json({ error: 'Admin database is not configured.' }, { status: 503 })
  }

  const clientIp = getClientIp(request)

  const ipLimit = adminRegisterIpLimiter(`admin-register:ip:${clientIp}`)
  if (ipLimit.limited) {
    return NextResponse.json(
      { error: 'Too many admin registration attempts. Please wait and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((ipLimit.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const body = await request.json()
    const parsed = adminRegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid registration payload', issues: parsed.error.issues }, { status: 400 })
    }

    const email = parsed.data.email.trim().toLowerCase()
    const identityLimit = adminRegisterIdentityLimiter(`admin-register:email:${email}`)
    if (identityLimit.limited) {
      return NextResponse.json(
        { error: 'Too many admin registration attempts. Please wait and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((identityLimit.resetAt - Date.now()) / 1000)) },
        }
      )
    }

    const role = resolveAdminRegistrationRole(parsed.data.accessCode)

    if (!role) {
      await safeWriteAuditLog(request, {
        action: 'admin.register_failed',
        entityType: 'admin_user',
        actorEmail: email,
        actorRole: 'editor',
        summary: 'Admin registration denied: invalid role code',
        metadata: {
          clientIp,
          email,
        },
      })

      return NextResponse.json({ error: 'Admin registration denied' }, { status: 401 })
    }

    const account = await registerAdminUserAccount({
      name: parsed.data.name,
      email,
      phone: parsed.data.phone,
      password: parsed.data.password,
      role,
    })

    if (!account) {
      return NextResponse.json({ error: 'Admin database is not configured.' }, { status: 503 })
    }

    const token = await createAdminSessionToken({
      email,
      role: account.role,
    })

    const response = NextResponse.json({
      success: true,
      role: account.role,
      message: 'Admin registration completed successfully.',
    })

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      token,
      sessionCookieOptions(new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString())
    )

    await safeWriteAuditLog(request, {
      action: 'admin.register',
      entityType: 'admin_user',
      actorEmail: email,
      actorRole: account.role,
      summary: 'Admin registration completed',
      metadata: {
        clientIp,
        phone: account.phone,
      },
    })

    console.log(JSON.stringify({
      level: 'info',
      route: '/api/admin/register',
      requestId,
      stage: 'done',
      role: account.role,
      ms: Date.now() - startedAt,
    }))

    return response
  } catch (error) {
    logAdminRegistrationError(request, error, {
      stage: 'failed',
      ms: Date.now() - startedAt,
    })

    if (error instanceof Error && error.message === 'ADMIN_ACCOUNT_ALREADY_REGISTERED') {
      return NextResponse.json({ error: 'Admin account already exists. Please sign in instead.' }, { status: 409 })
    }

    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'Admin account already exists. Please sign in instead.' }, { status: 409 })
    }

    if (isAdminEnvConfigurationError(error)) {
      const message =
        env.NODE_ENV === 'production'
          ? 'Ask the super admin to verify the production admin registration environment variables.'
          : getErrorMessage(error)

      return NextResponse.json(
        {
          error: 'Admin registration is not configured.',
          message,
        },
        { status: 503 }
      )
    }

    if (isMissingAdminTableError(error)) {
      return NextResponse.json({ error: 'Admin database is not initialized yet.' }, { status: 503 })
    }

    if (isPrismaMissingColumnError(error)) {
      return NextResponse.json(
        {
          error: 'Admin database schema is not up to date.',
          message: 'Run the latest Prisma migrations against the production database, then retry admin registration.',
        },
        { status: 503 }
      )
    }

    if (isPrismaAdminSchemaMismatchError(error)) {
      return NextResponse.json(
        {
          error: 'Admin registration is temporarily unavailable while database client metadata is synchronizing.',
        },
        { status: 503 }
      )
    }

    if (isPrismaConnectionError(error)) {
      return NextResponse.json(
        { error: 'Admin database is temporarily unavailable. Please retry in a moment.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Failed to complete admin registration' }, { status: 500 })
  }
}
