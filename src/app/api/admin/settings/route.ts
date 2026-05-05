import { NextRequest, NextResponse } from 'next/server'
import { siteSettingsSchema } from '@/lib/validations'
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin/session'
import { getSiteSettings, saveSiteSettings } from '@/lib/admin/repository'

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return verifyAdminSession(token)
}

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json({ settings })
}

export async function PUT(request: NextRequest) {
  const session = await requireAdmin(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = siteSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const settings = await saveSiteSettings(parsed.data, {
      email: session.email,
      role: session.role,
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update site settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}