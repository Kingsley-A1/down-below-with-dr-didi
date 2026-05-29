import { NextRequest, NextResponse } from 'next/server'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { deleteAdminReview, updateAdminReview } from '@/lib/reviews/repository'
import { adminReviewUpdateSchema } from '@/lib/validations'
import { validationError } from '@/lib/api/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'editor')
  if (roleError) {
    return roleError
  }

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = adminReviewUpdateSchema.safeParse({ ...body, id })

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const { id: parsedId, ...data } = parsed.data
    if (parsedId !== id) {
      return NextResponse.json({ error: 'Review id mismatch' }, { status: 400 })
    }

    const review = await updateAdminReview(
      id,
      {
        ...data,
        ...(data.roleLabel !== undefined && { roleLabel: data.roleLabel || '' }),
        ...(data.location !== undefined && { location: data.location || '' }),
        ...(data.adminReply !== undefined && { adminReply: data.adminReply || '' }),
        ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt || '' }),
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, review })
  } catch (error) {
    return mapApiError(error, 'Failed to update review', { request, identity: { email: session.email, role: session.role } })
  }
}

export async function DELETE(
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
    await deleteAdminReview(id, { email: session.email, role: session.role })
    return NextResponse.json({ success: true })
  } catch (error) {
    return mapApiError(error, 'Failed to delete review', { request, identity: { email: session.email, role: session.role } })
  }
}
