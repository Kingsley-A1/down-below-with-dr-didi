'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function LikeButton({
  eventSlug,
  initialCount,
  initialLiked,
  disabled,
}: {
  eventSlug: string
  initialCount: number
  initialLiked: boolean
  disabled?: boolean
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)

  async function toggleLike() {
    if (busy || disabled) {
      return
    }

    setBusy(true)
    setAuthRequired(false)

    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)))

    try {
      const response = await fetch(`/api/events/${eventSlug}/like`, {
        method: nextLiked ? 'POST' : 'DELETE',
      })

      if (response.status === 401) {
        setLiked(!nextLiked)
        setCount((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)))
        setAuthRequired(true)
        return
      }

      if (!response.ok) {
        setLiked(!nextLiked)
        setCount((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)))
        return
      }

      const data = await response.json()
      setLiked(Boolean(data.liked))
      setCount((prev) => (typeof data.count === 'number' ? data.count : prev))
    } catch {
      setLiked(!nextLiked)
      setCount((prev) => Math.max(0, prev + (nextLiked ? -1 : 1)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggleLike}
        disabled={busy || disabled}
        aria-pressed={liked}
        aria-label={liked ? `Unlike this event. ${count} likes` : `Like this event. ${count} likes`}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          liked
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
        }`}
      >
        <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
        <span>{count}</span>
      </button>

      {authRequired ? (
        <p className="text-xs text-slate-600" role="status">
          <Link href={`/login?next=${encodeURIComponent(`/events/${eventSlug}`)}`} className="font-semibold text-slate-900 underline underline-offset-2">
            Log in
          </Link>{' '}
          to like this event.
        </p>
      ) : null}

      {disabled ? <p className="text-xs text-slate-500">Engagement is paused for this event.</p> : null}
    </div>
  )
}
