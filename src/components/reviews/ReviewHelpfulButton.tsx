'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThumbsUp } from 'lucide-react'

export default function ReviewHelpfulButton({
  reviewId,
  initialCount,
  initialHelpful,
}: {
  reviewId: string
  initialCount: number
  initialHelpful: boolean
}) {
  const [helpful, setHelpful] = useState(initialHelpful)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)

  async function toggleHelpful() {
    if (busy || reviewId.startsWith('seed-review-')) {
      return
    }

    setBusy(true)
    setAuthRequired(false)

    const nextHelpful = !helpful
    setHelpful(nextHelpful)
    setCount((current) => Math.max(0, current + (nextHelpful ? 1 : -1)))

    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: nextHelpful ? 'POST' : 'DELETE',
      })

      if (response.status === 401) {
        setHelpful(!nextHelpful)
        setCount((current) => Math.max(0, current + (nextHelpful ? -1 : 1)))
        setAuthRequired(true)
        return
      }

      if (!response.ok) {
        setHelpful(!nextHelpful)
        setCount((current) => Math.max(0, current + (nextHelpful ? -1 : 1)))
        return
      }

      const data = (await response.json()) as { helpful?: boolean; count?: number }
      setHelpful(Boolean(data.helpful))
      if (typeof data.count === 'number') {
        setCount(data.count)
      }
    } catch {
      setHelpful(!nextHelpful)
      setCount((current) => Math.max(0, current + (nextHelpful ? -1 : 1)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggleHelpful}
        disabled={busy || reviewId.startsWith('seed-review-')}
        aria-pressed={helpful}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 font-body text-sm font-semibold transition-colors disabled:opacity-60 ${
          helpful
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
        }`}
      >
        <ThumbsUp className={`h-4 w-4 ${helpful ? 'fill-current' : ''}`} />
        <span>{count}</span>
        <span>found this helpful</span>
      </button>

      {authRequired ? (
        <p className="font-body text-xs text-slate-600" role="status">
          <Link href={`/login?next=${encodeURIComponent('/review')}`} className="font-semibold text-slate-900 underline underline-offset-2">
            Log in
          </Link>{' '}
          to mark reviews as helpful.
        </p>
      ) : null}
    </div>
  )
}
