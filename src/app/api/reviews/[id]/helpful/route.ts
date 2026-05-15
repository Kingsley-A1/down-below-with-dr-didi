import { NextRequest, NextResponse } from 'next/server'
import { mapApiError } from '@/lib/admin/api-guard'
import { requireAuth } from '@/lib/auth/session'
import { markReviewHelpful, unmarkReviewHelpful } from '@/lib/reviews/repository'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const count = await markReviewHelpful(id, session.userId)

    return NextResponse.json({ success: true, helpful: true, count })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized: No active session') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return mapApiError(error, 'Failed to mark review helpful')
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const count = await unmarkReviewHelpful(id, session.userId)

    return NextResponse.json({ success: true, helpful: false, count })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized: No active session') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return mapApiError(error, 'Failed to update review helpful state')
  }
}
