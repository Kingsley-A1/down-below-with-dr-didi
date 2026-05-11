import { NextRequest, NextResponse } from 'next/server'
import { siteSettingsSchema } from '@/lib/validations'
import { getSiteSettings, saveSiteSettings } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  const settings = await getSiteSettings()
  return NextResponse.json({ settings })
}

export async function PUT(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'super_admin')
  if (roleError) {
    return roleError
  }

  try {
    const body = await request.json()
    const parsed = siteSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    // Normalise optional image fields to empty string so the contract with
    // SiteSettingsState (which requires string, not string | undefined) is met.
    const settings = await saveSiteSettings(
      {
        ...parsed.data,
        heroImageUrl: parsed.data.heroImageUrl ?? '',
        heroImageAlt: parsed.data.heroImageAlt ?? '',
      },
      {
        email: session.email,
        role: session.role,
      }
    )

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    return mapApiError(error, 'Failed to update site settings')
  }
}