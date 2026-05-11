import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, createRateLimiter } from '@/lib/rate-limit'
import { adminRegisterSchema } from '@/lib/validations'
import { resolveAdminRegistrationRole, createAdminSessionToken, sessionCookieOptions, ADMIN_SESSION_COOKIE } from '@/lib/admin/session'
import { hasDatabaseConfig } from '@/lib/env'
import { registerAdminUserAccount, writeAuditLog } from '@/lib/admin/repository'

const adminRegisterIpLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 12 })
const adminRegisterIdentityLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, limit: 6 })

function isMissingAdminTableError(error: unknown) {
  return error instanceof Error && error.message.includes('The table `public.AdminUser` does not exist')
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

export async function POST(request: NextRequest) {
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
      await writeAuditLog({
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

    await writeAuditLog({
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

    return response
  } catch (error) {
    if (error instanceof Error && error.message === 'ADMIN_ACCOUNT_ALREADY_REGISTERED') {
      return NextResponse.json({ error: 'Admin account already exists. Please sign in instead.' }, { status: 409 })
    }

    if (isMissingAdminTableError(error)) {
      return NextResponse.json({ error: 'Admin database is not initialized yet.' }, { status: 503 })
    }

    if (isPrismaAdminSchemaMismatchError(error)) {
      return NextResponse.json(
        {
          error: 'Admin registration is temporarily unavailable while database client metadata is synchronizing.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Failed to complete admin registration' }, { status: 500 })
  }
}
