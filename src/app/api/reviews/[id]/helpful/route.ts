import { NextRequest, NextResponse } from 'next/server'
import { mapApiError } from '@/lib/admin/api-guard'
import { getSession } from '@/lib/auth/session'
import { markReviewHelpful, unmarkReviewHelpful } from '@/lib/reviews/repository'

const REVIEW_VISITOR_COOKIE = 'downbelow_review_visitor'

function getVisitorKey(request: NextRequest) {
  return request.cookies.get(REVIEW_VISITOR_COOKIE)?.value || crypto.randomUUID()
}

function setVisitorCookie(response: NextResponse, visitorKey: string) {
  response.cookies.set(REVIEW_VISITOR_COOKIE, visitorKey, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const visitorKey = session ? null : getVisitorKey(request)
    const { id } = await params
    const count = await markReviewHelpful(id, {
      userId: session?.userId || null,
      visitorKey,
    })
    const response = NextResponse.json({ success: true, helpful: true, count })

    if (!session && visitorKey) {
      setVisitorCookie(response, visitorKey)
    }

    return response
  } catch (error) {
    return mapApiError(error, 'Failed to mark review helpful')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const visitorKey = session ? null : request.cookies.get(REVIEW_VISITOR_COOKIE)?.value || null
    const { id } = await params

    if (!session && !visitorKey) {
      return NextResponse.json({ success: true, helpful: false })
    }

    const count = await unmarkReviewHelpful(id, {
      userId: session?.userId || null,
      visitorKey,
    })

    return NextResponse.json({ success: true, helpful: false, count })
  } catch (error) {
    return mapApiError(error, 'Failed to update review helpful state')
  }
}
