import type { Metadata } from 'next'
import { HeartHandshake, Quote, Star } from 'lucide-react'
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
  const reviews = await getPublishedReviews(session?.userId)
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <main className="section-pad" style={{ backgroundColor: 'var(--color-surface)' }}>
      <section className="mx-auto max-w-container px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(2,12,27,0.06)] sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-body text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                <HeartHandshake className="h-4 w-4" />
                What people are saying
              </div>
              <h1 className="mt-4 font-heading text-4xl font-bold text-slate-900 sm:text-5xl">Reviews</h1>
              <p className="mt-4 max-w-3xl font-body text-base leading-7 text-slate-600">
                Real words from people who have experienced the education, outreach, and support work of Down Below Family Health Initiative.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Metric label="Published reviews" value={reviews.length.toString()} />
                <Metric label="Average rating" value={averageRating ? averageRating.toFixed(1) : '5.0'} />
                <Metric label="Helpful marks" value={reviews.reduce((sum, review) => sum + review.helpfulCount, 0).toString()} />
              </div>
            </div>

            <div className="grid gap-4">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_22px_rgba(2,12,27,0.05)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <h2 className="mt-3 font-heading text-xl font-bold text-slate-900">{review.displayName}</h2>
                      <p className="font-body text-sm text-slate-500">
                        {[review.roleLabel, review.location].filter(Boolean).join(' - ')}
                      </p>
                    </div>
                    <Quote className="hidden h-8 w-8 text-emerald-100 sm:block" />
                  </div>

                  <p className="mt-4 font-body text-base leading-7 text-slate-700">{review.body}</p>

                  {review.adminReply ? (
                    <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Team reply</p>
                      <p className="mt-2 font-body text-sm leading-6 text-emerald-950">{review.adminReply}</p>
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
          </div>

          <aside className="lg:sticky lg:top-24">
            <ReviewSubmissionForm />
          </aside>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
