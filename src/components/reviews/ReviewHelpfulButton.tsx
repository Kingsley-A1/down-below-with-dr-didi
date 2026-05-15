'use client'

import { useState } from 'react'
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
  const [error, setError] = useState('')

  async function toggleHelpful() {
    if (busy) {
      return
    }

    setBusy(true)
    setError('')

    const nextHelpful = !helpful
    setHelpful(nextHelpful)
    setCount((current) => Math.max(0, current + (nextHelpful ? 1 : -1)))

    if (reviewId.startsWith('seed-review-')) {
      setBusy(false)
      return
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: nextHelpful ? 'POST' : 'DELETE',
      })

      if (!response.ok) {
        setHelpful(!nextHelpful)
        setCount((current) => Math.max(0, current + (nextHelpful ? -1 : 1)))
        setError('Could not update this yet. Please try again.')
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
      setError('Could not update this yet. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggleHelpful}
        disabled={busy}
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

      {error ? (
        <p className="font-body text-xs text-rose-600" role="status">
          {error}
        </p>
      ) : null}
    </div>
  )
}
