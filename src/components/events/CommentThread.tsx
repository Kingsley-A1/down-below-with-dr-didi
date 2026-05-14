'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { PublicCommentRecord } from '@/lib/events/repository'

type CommentEventDetail = {
  eventSlug: string
  tempId?: string
  comment?: PublicCommentRecord
}

export default function CommentThread({
  eventSlug,
  initialComments,
}: {
  eventSlug: string
  initialComments: PublicCommentRecord[]
}) {
  const [comments, setComments] = useState(initialComments)

  useEffect(() => {
    function onCreated(event: Event) {
      const detail = (event as CustomEvent<CommentEventDetail>).detail
      if (!detail || detail.eventSlug !== eventSlug || !detail.comment) {
        return
      }

      setComments((prev) => [detail.comment!, ...prev])
    }

    function onRevert(event: Event) {
      const detail = (event as CustomEvent<CommentEventDetail>).detail
      if (!detail || detail.eventSlug !== eventSlug || !detail.tempId) {
        return
      }

      setComments((prev) => prev.filter((comment) => comment.id !== detail.tempId))
    }

    function onConfirm(event: Event) {
      const detail = (event as CustomEvent<CommentEventDetail>).detail
      if (!detail || detail.eventSlug !== eventSlug || !detail.tempId || !detail.comment) {
        return
      }

      setComments((prev) => prev.map((comment) => (comment.id === detail.tempId ? detail.comment! : comment)))
    }

    window.addEventListener('events:comment-created', onCreated)
    window.addEventListener('events:comment-revert', onRevert)
    window.addEventListener('events:comment-confirm', onConfirm)

    return () => {
      window.removeEventListener('events:comment-created', onCreated)
      window.removeEventListener('events:comment-revert', onRevert)
      window.removeEventListener('events:comment-confirm', onConfirm)
    }
  }, [eventSlug])

  if (comments.length === 0) {
    return <p className="text-sm text-slate-600">No comments yet. Be the first to contribute.</p>
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <article key={comment.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{comment.displayName}</p>
            <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{comment.body}</p>
        </article>
      ))}
    </div>
  )
}
