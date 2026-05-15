'use client'

import { useState } from 'react'
import { Send, Star } from 'lucide-react'

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
  const [form, setForm] = useState<ReviewFormState>(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function set<K extends keyof ReviewFormState>(field: K, value: ReviewFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = (await response.json()) as { error?: string; message?: string }

      if (!response.ok) {
        setError(data.error || 'Review could not be submitted.')
        return
      }

      setMessage(data.message || 'Thank you. Your review has been submitted for moderation.')
      setForm(EMPTY_FORM)
    } catch {
      setError('Review could not be submitted. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(2,12,27,0.06)]">
      <div>
        <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Share your experience</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-slate-900">Add a review</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *">
          <input value={form.displayName} onChange={(event) => set('displayName', event.target.value)} required minLength={2} maxLength={100} className="input-field" />
        </Field>
        <Field label="Role or context">
          <input value={form.roleLabel} onChange={(event) => set('roleLabel', event.target.value)} maxLength={120} placeholder="Event attendee, parent, volunteer" className="input-field" />
        </Field>
        <Field label="Location">
          <input value={form.location} onChange={(event) => set('location', event.target.value)} maxLength={120} className="input-field" />
        </Field>
        <Field label="Rating">
          <div className="flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 px-3">
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

      <Field label="Review *">
        <textarea
          value={form.body}
          onChange={(event) => set('body', event.target.value)}
          required
          minLength={40}
          maxLength={900}
          rows={5}
          className="input-field"
          placeholder="What changed for you after the outreach, session, or support?"
        />
      </Field>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 font-body text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.consentToPublish}
          onChange={(event) => set('consentToPublish', event.target.checked)}
          required
          className="mt-1 h-4 w-4"
        />
        <span>I confirm this review may be reviewed by the team and published on the website.</span>
      </label>

      {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 font-body text-sm font-semibold text-emerald-800">{message}</p> : null}
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 font-body text-sm font-semibold text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {busy ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
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
