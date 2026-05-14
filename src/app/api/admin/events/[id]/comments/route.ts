import { NextRequest, NextResponse } from 'next/server'
import { getEventComments } from '@/lib/admin/repository'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    const comments = await getEventComments(id)
    return NextResponse.json({ comments })
  } catch (error) {
    return mapApiError(error, 'Failed to fetch event comments')
  }
}
