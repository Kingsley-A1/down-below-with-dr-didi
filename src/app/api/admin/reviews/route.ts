import { NextRequest, NextResponse } from 'next/server'
import { mapApiError, requireAdminRole, requireAdminSession } from '@/lib/admin/api-guard'
import { createAdminReview, getAllReviews } from '@/lib/reviews/repository'
import { adminReviewSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roleError = requireAdminRole(session, 'moderator')
  if (roleError) {
    return roleError
  }

  try {
    const reviews = await getAllReviews()
    return NextResponse.json({ reviews })
  } catch (error) {
    return mapApiError(error, 'Failed to fetch reviews')
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
    const parsed = adminReviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const review = await createAdminReview(
      {
        ...parsed.data,
        roleLabel: parsed.data.roleLabel || undefined,
        location: parsed.data.location || undefined,
        adminReply: parsed.data.adminReply || undefined,
        publishedAt: parsed.data.publishedAt || undefined,
      },
      { email: session.email, role: session.role }
    )

    return NextResponse.json({ success: true, review }, { status: 201 })
  } catch (error) {
    return mapApiError(error, 'Failed to create review')
  }
}
