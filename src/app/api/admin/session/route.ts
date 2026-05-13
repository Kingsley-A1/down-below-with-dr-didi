import { NextRequest, NextResponse } from 'next/server'
import { adminLoginSchema } from '@/lib/validations'
import { createAdminSessionToken, sessionCookieOptions, ADMIN_SESSION_COOKIE } from '@/lib/admin/session'
import { authenticateAdminUserWithDiagnostics } from '@/lib/admin/auth-diagnostics'
import { env } from '@/lib/env'

function isMissingAdminTableError(error: unknown) {
  return error instanceof Error && error.message.includes('The table `public.AdminUser` does not exist')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = adminLoginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid admin credentials', issues: parsed.error.issues }, { status: 400 })
    }

    const email = parsed.data.email.trim().toLowerCase()
    
    // Use enhanced authentication with diagnostics
    const authResult = await authenticateAdminUserWithDiagnostics(email, parsed.data.password)

    if (!authResult.success || !authResult.account) {
      const baseHint = 'Verify your credentials, then run account recovery if access still fails.'
      const suggestion = authResult.attempt.diagnostics?.diagnostics.suggestions?.[0]
      const hint = env.NODE_ENV === 'production' ? baseHint : suggestion || baseHint

      return NextResponse.json({
        error: 'Admin access denied',
        hint,
        troubleshoot: 'Double-check your email and password, then retry.',
        recover: 'Use the self-service recovery page if access is still denied.',
      }, { status: 401 })
    }

    const token = await createAdminSessionToken({
      email,
      role: authResult.account.role,
    })

    const response = NextResponse.json({
      success: true,
      role: authResult.account.role,
    })

    response.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions(new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString()))

    return response
  } catch (error) {
    if (isMissingAdminTableError(error)) {
      return NextResponse.json({ error: 'Admin database is not initialized yet.' }, { status: 503 })
    }

    return NextResponse.json({ error: 'Failed to create admin session' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })

  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  })

  return response
}