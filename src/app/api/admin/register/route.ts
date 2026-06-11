import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { adminRegisterSchema } from '@/lib/validations'
import { env, hasDatabaseConfig } from '@/lib/env'
import { registerAdminUserAccount, writeAuditLog } from '@/lib/admin/repository'
import { sendEmail } from '@/lib/email/send'
import { verifyAdminEmail as verifyAdminEmailTemplate } from '@/lib/email/templates'
import { duplicateEmail, rateLimited, serverError, serviceUnavailable, validationError } from '@/lib/api/errors'
import { resolveRequestId } from '@/lib/api/observability'
import { resolveAdminRegistrationDecision } from '@/lib/admin/registration-policy'
import { isAppError } from '@/lib/app-error'

const ADMIN_REGISTER_WINDOW_MS = 60 * 60 * 1000
const ADMIN_REGISTER_IP_LIMIT = 12
const ADMIN_REGISTER_IDENTITY_LIMIT = 6

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

function logAdminRegistrationError(requestId: string, error: unknown, context: Record<string, unknown>) {
  console.error(JSON.stringify({
    level: 'error',
    route: '/api/admin/register',
    requestId,
    errorName: error instanceof Error ? error.name : 'UnknownError',
    errorCode: getPrismaErrorCode(error),
    errorMessage: getErrorMessage(error),
    ...context,
  }))
}

async function safeWriteAuditLog(requestId: string, entry: AuditLogEntry) {
  try {
    await writeAuditLog(entry)
  } catch (error) {
    logAdminRegistrationError(requestId, error, {
      stage: 'audit_log',
      auditAction: entry.action,
    })
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const requestId = resolveRequestId(request)

  console.log(JSON.stringify({
    level: 'info',
    route: '/api/admin/register',
    requestId,
    stage: 'start',
  }))

  if (!hasDatabaseConfig()) {
    return serviceUnavailable('database_unavailable', 'Admin database is not configured.', {
      request,
      requestId,
      action: 'Set DATABASE_URL and run migrations before admin registration.',
    })
  }

  const clientIp = getClientIp(request)

  const ipLimit = await checkRateLimit({
    key: `admin-register:ip:${clientIp}`,
    windowMs: ADMIN_REGISTER_WINDOW_MS,
    limit: ADMIN_REGISTER_IP_LIMIT,
  })
  if (ipLimit.limited) {
    return rateLimited(
      Math.ceil((ipLimit.resetAt - Date.now()) / 1000),
      'Too many admin registration attempts. Please wait and try again.'
    )
  }

  try {
    const body = await request.json()
    const parsed = adminRegisterSchema.safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const email = parsed.data.email.trim().toLowerCase()
    const identityLimit = await checkRateLimit({
      key: `admin-register:email:${email}`,
      windowMs: ADMIN_REGISTER_WINDOW_MS,
      limit: ADMIN_REGISTER_IDENTITY_LIMIT,
    })
    if (identityLimit.limited) {
      return rateLimited(
        Math.ceil((identityLimit.resetAt - Date.now()) / 1000),
        'Too many admin registration attempts. Please wait and try again.'
      )
    }

    const registrationDecision = resolveAdminRegistrationDecision({
      email,
      accessCode: parsed.data.accessCode,
    })

    if (!registrationDecision.ok) {
      // Surface the denial reason in the server logs (no PII) so production
      // 401s are diagnosable from the platform logs, not only the DB audit
      // trail. `invalid_invite` => the access code matched no role (code
      // mismatch); `email_not_allowed` => the code resolved a role but the
      // email is not in ADMIN_ALLOWED_USERS for it.
      console.warn(JSON.stringify({
        level: 'warn',
        route: '/api/admin/register',
        requestId,
        stage: 'denied',
        reason: registrationDecision.reason,
      }))

      await safeWriteAuditLog(requestId, {
        action: 'admin.register_failed',
        entityType: 'admin_user',
        actorEmail: email,
        actorRole: 'editor',
        summary: 'Admin registration denied',
        metadata: {
          clientIp,
          email,
          reason: registrationDecision.reason,
        },
      })

      return NextResponse.json({ error: 'Admin registration denied' }, { status: 401 })
    }

    const account = await registerAdminUserAccount({
      name: parsed.data.name,
      email,
      phone: parsed.data.phone,
      password: parsed.data.password,
      role: registrationDecision.role,
    })

    if (!account) {
      return serviceUnavailable('database_unavailable', 'Admin database is not configured.', {
        request,
        requestId,
        action: 'Set DATABASE_URL and run migrations before admin registration.',
      })
    }

    // Send verification email. Admin sign-in is gated on emailVerified — no
    // session cookie is set here, the admin has to enter the emailed code first.
    const template = verifyAdminEmailTemplate({
      recipientName: account.name ?? account.email,
      code: account.verificationCode,
      expiresInMinutes: Math.round((account.verificationExpiresAt.getTime() - Date.now()) / 60_000),
      role: account.role,
    })

    const sendResult = await sendEmail({
      to: account.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    const response = NextResponse.json({
      success: true,
      role: account.role,
      requiresEmailVerification: true,
      emailSent: sendResult.ok,
      message: 'Admin registration received. Enter the 6-digit code we emailed you to verify before signing in.',
    })

    await safeWriteAuditLog(requestId, {
      action: 'admin.register',
      entityType: 'admin_user',
      actorEmail: email,
      actorRole: account.role,
      summary: 'Admin registration completed (pending email verification)',
      metadata: {
        clientIp,
        phone: account.phone,
        emailSent: sendResult.ok,
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
    logAdminRegistrationError(requestId, error, {
      stage: 'failed',
      ms: Date.now() - startedAt,
    })

    if (isAppError(error) && error.code === 'duplicate_email') {
      return duplicateEmail('email')
    }

    if (isUniqueConstraintError(error)) {
      return duplicateEmail('email')
    }

    if (isAdminEnvConfigurationError(error)) {
      // Generic public response; the detailed `[env] ...` cause is already in
      // the server log via logAdminRegistrationError. Operators see it via
      // GET /api/admin/health (super_admin only) or in non-prod via a header.
      const response = serviceUnavailable('service_unavailable', 'Admin registration is not configured.', {
        request,
        requestId,
        error,
        action: 'Ask the super admin to verify the production admin registration environment variables.',
      })

      if (env.NODE_ENV !== 'production') {
        response.headers.set('X-Operator-Hint', getErrorMessage(error).slice(0, 200))
      }

      return response
    }

    if (isMissingAdminTableError(error)) {
      return serviceUnavailable('database_unavailable', 'Admin database is not initialized yet.', {
        request,
        requestId,
        error,
        action: 'Run Prisma migrations and verify DATABASE_URL before admin registration.',
      })
    }

    if (isPrismaMissingColumnError(error)) {
      return serviceUnavailable('database_unavailable', 'Admin database schema is not up to date.', {
        request,
        requestId,
        error,
        action: 'Run the latest Prisma migrations against the production database, then retry admin registration.',
      })
    }

    if (isPrismaAdminSchemaMismatchError(error)) {
      return serviceUnavailable(
        'database_unavailable',
        'Admin registration is temporarily unavailable while database client metadata is synchronizing.',
        {
          request,
          requestId,
          error,
          action: 'Regenerate the Prisma client and redeploy before retrying admin registration.',
        }
      )
    }

    if (isPrismaConnectionError(error)) {
      return serviceUnavailable('database_unavailable', 'Admin database is temporarily unavailable. Please retry in a moment.', {
        request,
        requestId,
        error,
        action: 'Check database connectivity, credentials, and provider status.',
      })
    }

    return serverError('Failed to complete admin registration', { request, requestId, error })
  }
}
