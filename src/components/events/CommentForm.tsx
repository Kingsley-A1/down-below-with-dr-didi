'use client'

import { useState } from 'react'
import Link from 'next/link'

type CommentEventDetail = {
  eventSlug: string
  tempId?: string
  comment?: {
    id: string
    eventId: string
    displayName: string
    body: string
    createdAt: string
  }
}

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, '')
}

export default function CommentForm({
  eventSlug,
  isAuthenticated,
  disabled = false,
}: {
  eventSlug: string
  isAuthenticated: boolean
  disabled?: boolean
}) {
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = stripHtml(body).trim()
    if (trimmed.length < 2) {
      setError('Comment must be at least 2 characters.')
      return
    }

    setBusy(true)
    setError('')

    const tempId = `temp-${Date.now()}`

    window.dispatchEvent(new CustomEvent<CommentEventDetail>('events:comment-created', {
      detail: {
        eventSlug,
        tempId,
        comment: {
          id: tempId,
          eventId: '',
          displayName: 'You',
          body: trimmed,
          createdAt: new Date().toISOString(),
        },
      },
    }))

    setBody('')

    try {
      const response = await fetch(`/api/events/${eventSlug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        window.dispatchEvent(new CustomEvent<CommentEventDetail>('events:comment-revert', {
          detail: { eventSlug, tempId },
        }))
        setError(data.error || 'Failed to post comment.')
        return
      }

      window.dispatchEvent(new CustomEvent<CommentEventDetail>('events:comment-confirm', {
        detail: {
          eventSlug,
          tempId,
          comment: data.comment,
        },
      }))
    } catch {
      window.dispatchEvent(new CustomEvent<CommentEventDetail>('events:comment-revert', {
        detail: { eventSlug, tempId },
      }))
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-slate-600">
        <Link href={`/login?next=${encodeURIComponent(`/events/${eventSlug}`)}`} className="font-semibold text-slate-900 underline underline-offset-2">
          Log in
        </Link>{' '}
        to join the conversation.
      </p>
    )
  }

  const normalizedBody = stripHtml(body).trim()
  const canSubmit = normalizedBody.length >= 2 && !busy && !disabled

  return (
    <form onSubmit={submitComment} className="space-y-3">
      <label htmlFor="event-comment" className="block text-sm font-semibold text-slate-800">
        Add a comment
      </label>
      <textarea
        id="event-comment"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2000}
        disabled={disabled}
        placeholder="Add your comment..."
        aria-describedby="event-comment-help event-comment-error"
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
      />
      <div className="flex items-center justify-between">
        <span id="event-comment-help" className="text-xs text-slate-500">
          {disabled ? 'Comments are paused for this event.' : `${body.length}/2000`}
        </span>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Posting...' : 'Post comment'}
        </button>
      </div>
      {error ? (
        <p id="event-comment-error" className="text-xs font-semibold text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
