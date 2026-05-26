import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { HeartHandshake, MessageCircleHeart, Quote, Star } from 'lucide-react'
import ReviewHelpfulButton from '@/components/reviews/ReviewHelpfulButton'
import ReviewSubmissionForm from '@/components/reviews/ReviewSubmissionForm'
import { getSession } from '@/lib/auth/session'
import { getPublishedReviews } from '@/lib/reviews/repository'
import { canonicalUrl } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reviews',
  description: 'What people are saying about Down Below Family Health Initiative.',
  alternates: {
    canonical: canonicalUrl('/review'),
  },
}

export default async function ReviewPage() {
  const session = await getSession()
  const cookieStore = await cookies()
  const reviewVisitorKey = cookieStore.get('downbelow_review_visitor')?.value || null
  const reviews = await getPublishedReviews({
    userId: session?.userId || null,
    visitorKey: session ? null : reviewVisitorKey,
  })
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0
  const helpfulMarks = reviews.reduce((sum, review) => sum + review.helpfulCount, 0)

  return (
    <main className="pt-24 pb-12 sm:pt-28 sm:pb-16" style={{ backgroundColor: 'var(--color-surface)' }}>
      <section
        className="mx-auto"
        style={{ width: 'min(calc(100vw - 2.5rem), 1280px)' }}
      >
        <header className="mb-7 border-b border-slate-200 pb-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_390px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-body text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                What people are saying
              </div>
              <h1 className="mt-4 max-w-3xl break-words font-heading text-3xl font-bold leading-tight text-slate-950 sm:text-5xl">
                Real stories from real people.
              </h1>
              <p className="mt-3 max-w-3xl font-body text-base leading-7 text-slate-600">
                Public reviews from outreach participants, community members, volunteers, and people who have experienced DownBelow&apos;s care and teaching.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              <Metric label="Reviews" value={reviews.length.toString()} />
              <Metric label="Rating" value={averageRating ? averageRating.toFixed(1) : '5.0'} />
              <Metric label="Helpful" value={helpfulMarks.toString()} />
            </div>
          </div>
        </header>

        <div className="grid gap-7 lg:grid-cols-[1fr_390px] lg:items-start">
          <aside className="order-1 lg:sticky lg:top-24 lg:order-2">
            <ReviewSubmissionForm />
          </aside>

          <section className="order-2 space-y-5 lg:order-1">
            <div className="flex items-center gap-2">
              <MessageCircleHeart className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              <h2 className="font-heading text-2xl font-bold text-slate-950">Latest reviews</h2>
            </div>

            {reviews.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-5">
                <p className="font-body text-sm leading-6 text-slate-600">No public reviews yet. Be the first to share your experience.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-heading text-sm font-bold text-emerald-800">
                          {review.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-current' : ''}`} aria-hidden="true" />
                            ))}
                          </div>
                          <h3 className="mt-2 font-heading text-lg font-bold leading-tight text-slate-950 sm:text-xl">
                            {review.displayName}
                          </h3>
                          <p className="mt-1 font-body text-sm leading-6 text-slate-500">
                            {[review.roleLabel, review.location].filter(Boolean).join(' - ')}
                          </p>
                        </div>
                      </div>
                      <Quote className="hidden h-7 w-7 shrink-0 text-emerald-100 sm:block" aria-hidden="true" />
                    </div>

                    <p className="mt-4 font-body text-base leading-7 text-slate-700">{review.body}</p>

                    {review.adminReply ? (
                      <div className="mt-4 border-l-2 border-emerald-300 pl-4">
                        <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Team reply</p>
                        <p className="mt-2 font-body text-sm leading-6 text-slate-700">{review.adminReply}</p>
                      </div>
                    ) : null}

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <ReviewHelpfulButton
                        reviewId={review.id}
                        initialCount={review.helpfulCount}
                        initialHelpful={review.viewerHasMarkedHelpful}
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
      <p className="font-body text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
    </div>
  )
}
