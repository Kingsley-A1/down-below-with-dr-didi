import { NextRequest, NextResponse } from 'next/server'
import { adminSignInSchema } from '@/lib/validations'
import { createAdminSessionToken, getAllowedAdminUser, sessionCookieOptions, ADMIN_SESSION_COOKIE } from '@/lib/admin/session'
import { upsertAdminUserRecord, writeAuditLog } from '@/lib/admin/repository'
import { env } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = adminSignInSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid admin credentials', issues: parsed.error.issues }, { status: 400 })
    }

    const email = parsed.data.email.trim().toLowerCase()
    const allowedUser = getAllowedAdminUser(email)

    if (!allowedUser || parsed.data.accessCode !== env.ADMIN_ACCESS_CODE) {
      return NextResponse.json({ error: 'Admin access denied' }, { status: 401 })
    }

    await upsertAdminUserRecord(email, allowedUser.role)

    const token = await createAdminSessionToken({
      email,
      role: allowedUser.role,
    })

    const response = NextResponse.json({
      success: true,
      role: allowedUser.role,
    })

    response.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions(new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString()))

    await writeAuditLog({
      action: 'admin.sign_in',
      entityType: 'admin_session',
      actorEmail: email,
      actorRole: allowedUser.role,
      summary: 'Admin user signed in',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Failed to create admin session' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
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