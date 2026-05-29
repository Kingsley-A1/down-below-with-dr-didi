import { NextRequest, NextResponse } from 'next/server'
import { mapApiError } from '@/lib/admin/api-guard'
import { getSession } from '@/lib/auth/session'
import { createPublicReview, getPublishedReviews } from '@/lib/reviews/repository'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { publicReviewSchema } from '@/lib/validations'
import { validationError } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const reviewVisitorKey = request.cookies.get('downbelow_review_visitor')?.value || null
    const reviews = await getPublishedReviews({
      userId: session?.userId || null,
      visitorKey: session ? null : reviewVisitorKey,
    })
    return NextResponse.json({ reviews })
  } catch (error) {
    return mapApiError(error, 'Failed to fetch reviews', { request })
  }
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit({
    key: `review-submit:ip:${getClientIp(request)}`,
    windowMs: 60 * 60 * 1000,
    limit: 3,
  })

  if (rl.limited) {
    return NextResponse.json(
      { error: 'Too many review submissions. Please wait before trying again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const session = await getSession()
    const body = await request.json()
    const parsed = publicReviewSchema.safeParse(body)

    if (!parsed.success) {
      return validationError(parsed.error)
    }

    const review = await createPublicReview({
      displayName: parsed.data.displayName,
      roleLabel: parsed.data.roleLabel || undefined,
      location: parsed.data.location || undefined,
      rating: parsed.data.rating,
      body: parsed.data.body,
      userId: session?.userId,
    })

    return NextResponse.json(
      {
        success: true,
        review,
        message: 'Thank you. Your review was received and will be reviewed before publishing.',
      },
      { status: 201 }
    )
  } catch (error) {
    return mapApiError(error, 'Failed to submit review', { request })
  }
}
