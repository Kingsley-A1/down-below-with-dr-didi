import { NextRequest, NextResponse } from 'next/server'
import { createVaultResponse } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { vaultResponseSchema } from '@/lib/validations'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'super_admin')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = vaultResponseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const result = await createVaultResponse(
      {
        submissionId: id,
        responseBody: parsed.data.responseBody,
      },
      {
        email: session.email,
        role: session.role,
      }
    )

    return NextResponse.json({
      success: true,
      response: result.response,
      notificationCreated: result.notificationCreated,
    })
  } catch (error) {
    return mapApiError(error, 'Failed to create V-Vault response')
  }
}
