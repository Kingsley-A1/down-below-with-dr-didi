'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Send, Star } from 'lucide-react'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'
import type { PublicReviewRecord } from '@/lib/reviews/repository'

const EMPTY_FORM = {
  displayName: '',
  roleLabel: '',
  location: '',
  rating: 5,
  body: '',
  consentToPublish: false,
}

type ReviewFormState = typeof EMPTY_FORM

export default function ReviewSubmissionForm() {
  const router = useRouter()
  const [form, setForm] = useState<ReviewFormState>(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submittedReview, setSubmittedReview] = useState<PublicReviewRecord | null>(null)

  function set<K extends keyof ReviewFormState>(field: K, value: ReviewFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')
    setFieldErrors({})

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await readJsonResponse<{ error?: string; message?: string; review?: PublicReviewRecord }>(response)

      if (!response.ok) {
        const parsed = parseApiError(data, 'Review could not be submitted.')
        setFieldErrors(
          Object.fromEntries(
            Object.entries(parsed.fieldErrors).map(([field, messages]) => [field, messages[0] ?? ''])
          )
        )
        setError(parsed.message)
        return
      }

      setMessage(data?.message || 'Thank you. Your review was received and will be reviewed before publishing.')
      setSubmittedReview(data?.review ?? null)
      setForm(EMPTY_FORM)
      router.refresh()
    } catch {
      setError('Review could not be submitted. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <div>
        <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Share your experience</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-slate-900">Add a review</h2>
        <p className="mt-2 font-body text-sm leading-6 text-slate-500">
          Your review is reviewed by the team before it appears publicly.
        </p>
      </div>

      {submittedReview ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="font-body text-sm font-semibold text-emerald-900">{message}</p>
              <p className="mt-2 line-clamp-3 font-body text-sm leading-6 text-emerald-950">
                &ldquo;{submittedReview.body}&rdquo;
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *" error={fieldErrors.displayName}>
          <input value={form.displayName} onChange={(event) => set('displayName', event.target.value)} required minLength={2} maxLength={100} className="input-field min-h-11" />
        </Field>
        <Field label="Role or context" error={fieldErrors.roleLabel}>
          <input value={form.roleLabel} onChange={(event) => set('roleLabel', event.target.value)} maxLength={120} placeholder="Event attendee, parent, volunteer" className="input-field min-h-11" />
        </Field>
        <Field label="Location" error={fieldErrors.location}>
          <input value={form.location} onChange={(event) => set('location', event.target.value)} maxLength={120} className="input-field min-h-11" />
        </Field>
        <Field label="Rating" error={fieldErrors.rating}>
          <div className="flex min-h-11 items-center gap-1 rounded-lg border border-slate-200 px-3">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => set('rating', rating)}
                aria-label={`${rating} star review`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-amber-500"
              >
                <Star className={`h-5 w-5 ${rating <= form.rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Review *" error={fieldErrors.body}>
        <textarea
          value={form.body}
          onChange={(event) => set('body', event.target.value)}
          required
          minLength={40}
          maxLength={900}
          rows={5}
          className="input-field min-h-36"
          placeholder="What changed for you after the outreach, session, or support?"
        />
      </Field>

      <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 font-body text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.consentToPublish}
          onChange={(event) => set('consentToPublish', event.target.checked)}
          required
          className="mt-1 h-4 w-4"
        />
        <span>I confirm this review may be reviewed by the team and published on the website.</span>
      </label>
      {fieldErrors.consentToPublish ? <p className="font-body text-xs text-red-600">{fieldErrors.consentToPublish}</p> : null}

      {message && !submittedReview ? <p className="rounded-lg bg-emerald-50 px-3 py-2 font-body text-sm font-semibold text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 font-body text-sm font-semibold text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        <Send className="h-4 w-4" />
        {busy ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {error ? <span className="block font-body text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
