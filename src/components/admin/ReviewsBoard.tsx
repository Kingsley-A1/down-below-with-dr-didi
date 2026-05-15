'use client'

import { useMemo, useState } from 'react'
import { MessageSquareReply, Plus, Star, ThumbsUp, Trash2 } from 'lucide-react'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import type { AdminReviewRecord, ReviewSource, ReviewStatus } from '@/lib/reviews/repository'

const STATUS_OPTIONS: ReviewStatus[] = ['draft', 'published', 'archived']
const SOURCE_OPTIONS: ReviewSource[] = ['public_submission', 'admin_created', 'seed']

const EMPTY_FORM = {
  displayName: '',
  roleLabel: '',
  location: '',
  rating: 5,
  body: '',
  status: 'published' as ReviewStatus,
  source: 'admin_created' as ReviewSource,
  sortOrder: 0,
  adminReply: '',
  publishedAt: '',
}

type FormState = typeof EMPTY_FORM

function getTone(message: string) {
  const value = message.toLowerCase()
  return value.includes('failed') || value.includes('required') ? 'error' : 'success'
}

export default function ReviewsBoard({ initialReviews }: { initialReviews: AdminReviewRecord[] }) {
  const [reviews, setReviews] = useState(initialReviews)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('all')
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const visibleReviews = useMemo(
    () => filter === 'all' ? reviews : reviews.filter((review) => review.status === filter),
    [filter, reviews]
  )

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function refresh() {
    const response = await fetch('/api/admin/reviews', { cache: 'no-store' })
    const data = (await response.json()) as { reviews?: AdminReviewRecord[] }
    setReviews(data.reviews || [])
  }

  function startCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setMessage('')
  }

  function startEdit(review: AdminReviewRecord) {
    setEditId(review.id)
    setForm({
      displayName: review.displayName,
      roleLabel: review.roleLabel || '',
      location: review.location || '',
      rating: review.rating,
      body: review.body,
      status: review.status,
      source: review.source,
      sortOrder: review.sortOrder,
      adminReply: review.adminReply || '',
      publishedAt: review.publishedAt ? new Date(review.publishedAt).toISOString().slice(0, 16) : '',
    })
    setShowForm(true)
    setMessage('')
  }

  function cancelForm() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    const url = editId ? `/api/admin/reviews/${editId}` : '/api/admin/reviews'
    const method = editId ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : '',
        }),
      })
      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setMessage(data.error || 'Save failed')
        return
      }

      setMessage(editId ? 'Review updated.' : 'Review created.')
      await refresh()
      cancelForm()
    } catch {
      setMessage('Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function deleteReview(review: AdminReviewRecord) {
    if (!confirm(`Delete review from "${review.displayName}"? This cannot be undone.`)) {
      return
    }

    setBusy(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/reviews/${review.id}`, { method: 'DELETE' })
      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setMessage(data.error || 'Delete failed')
        return
      }

      setMessage('Review deleted.')
      await refresh()
    } catch {
      setMessage('Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', ...STATUS_OPTIONS] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full px-4 py-2 font-body text-sm font-semibold capitalize ${
                filter === status ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
          <span className="font-body text-xs text-slate-400">{visibleReviews.length} review{visibleReviews.length === 1 ? '' : 's'}</span>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 font-body text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add Review
        </button>
      </div>

      {message ? <AdminInlineStatus tone={getTone(message)} message={message} /> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:grid-cols-2">
          <Field label="Name *">
            <input value={form.displayName} onChange={(event) => set('displayName', event.target.value)} required minLength={2} maxLength={100} className="input-field" />
          </Field>
          <Field label="Role or context">
            <input value={form.roleLabel} onChange={(event) => set('roleLabel', event.target.value)} maxLength={120} className="input-field" />
          </Field>
          <Field label="Location">
            <input value={form.location} onChange={(event) => set('location', event.target.value)} maxLength={120} className="input-field" />
          </Field>
          <Field label="Rating">
            <select value={form.rating} onChange={(event) => set('rating', Number(event.target.value))} className="input-field">
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => set('status', event.target.value as ReviewStatus)} className="input-field">
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
          <Field label="Source">
            <select value={form.source} onChange={(event) => set('source', event.target.value as ReviewSource)} className="input-field">
              {SOURCE_OPTIONS.map((source) => <option key={source} value={source}>{source.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
          <Field label="Sort order">
            <input type="number" min={0} value={form.sortOrder} onChange={(event) => set('sortOrder', Number(event.target.value))} className="input-field" />
          </Field>
          <Field label="Published date">
            <input type="datetime-local" value={form.publishedAt} onChange={(event) => set('publishedAt', event.target.value)} className="input-field" />
          </Field>
          <div className="lg:col-span-2">
            <Field label="Review *">
              <textarea value={form.body} onChange={(event) => set('body', event.target.value)} required minLength={40} maxLength={900} rows={4} className="input-field" />
            </Field>
          </div>
          <div className="lg:col-span-2">
            <Field label="Admin reply">
              <textarea value={form.adminReply} onChange={(event) => set('adminReply', event.target.value)} maxLength={900} rows={3} className="input-field" />
            </Field>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end lg:col-span-2">
            <button type="button" onClick={cancelForm} className="rounded-xl border border-slate-300 px-5 py-2.5 font-body text-sm font-semibold text-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="rounded-xl bg-slate-900 px-5 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-60">
              {busy ? 'Saving...' : editId ? 'Update Review' : 'Create Review'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4">
        {visibleReviews.map((review) => (
          <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={review.status} />
                  <span className="font-body text-xs text-slate-400">{review.source.replace(/_/g, ' ')}</span>
                </div>
                <h2 className="mt-2 font-heading text-xl font-bold text-slate-900">{review.displayName}</h2>
                <p className="font-body text-sm text-slate-500">{[review.roleLabel, review.location].filter(Boolean).join(' - ')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-body text-xs font-semibold text-amber-800">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {review.rating}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-body text-xs font-semibold text-emerald-800">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {review.helpfulCount}
                </span>
              </div>
            </div>
            <p className="mt-4 font-body text-sm leading-6 text-slate-700">{review.body}</p>
            {review.adminReply ? (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                  <MessageSquareReply className="h-3.5 w-3.5" />
                  Reply
                </p>
                <p className="mt-2 font-body text-sm text-emerald-950">{review.adminReply}</p>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => startEdit(review)} className="rounded-full border border-slate-300 px-4 py-2 font-body text-sm font-semibold text-slate-700">
                Edit
              </button>
              <button type="button" disabled={busy} onClick={() => void deleteReview(review)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 font-body text-sm font-semibold text-red-700 disabled:opacity-60">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const styles: Record<ReviewStatus, string> = {
    published: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    draft: 'bg-amber-50 text-amber-800 border-amber-200',
    archived: 'bg-slate-50 text-slate-600 border-slate-200',
  }

  return (
    <span className={`rounded-full border px-2.5 py-1 font-body text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}
