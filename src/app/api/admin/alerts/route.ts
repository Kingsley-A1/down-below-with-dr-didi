import { NextRequest, NextResponse } from 'next/server'
import { createSiteAlert, listSiteAlerts } from '@/lib/admin/repository'
import { siteAlertSchema } from '@/lib/validations'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'editor')
  if (roleError) {
    return roleError
  }

  try {
    const alerts = await listSiteAlerts()
    return NextResponse.json({ alerts })
  } catch (error) {
    return mapApiError(error, 'Failed to list alerts')
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'editor')
  if (roleError) {
    return roleError
  }

  try {
    const body = await request.json()
    const parsed = siteAlertSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const { startsAt, endsAt, ...rest } = parsed.data

    const alert = await createSiteAlert(
      {
        ...rest,
        ...(startsAt ? { startsAt } : {}),
        ...(endsAt ? { endsAt } : {}),
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, alert }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to create alert')
  }
}
