import { NextRequest, NextResponse } from 'next/server'
import { mapApiError } from '@/lib/admin/api-guard'
import { getSession } from '@/lib/auth/session'
import { createPublicReview, getPublishedReviews } from '@/lib/reviews/repository'
import { publicReviewSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getSession()
    const reviews = await getPublishedReviews(session?.userId)
    return NextResponse.json({ reviews })
  } catch (error) {
    return mapApiError(error, 'Failed to fetch reviews')
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json()
    const parsed = publicReviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
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
        message: 'Thank you. Your review has been submitted for moderation.',
      },
      { status: 201 }
    )
  } catch (error) {
    return mapApiError(error, 'Failed to submit review')
  }
}
