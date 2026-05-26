'use client'

import { useState } from 'react'

export function AdminForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setError(data.error ?? 'Too many requests. Please wait and try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-sm text-emerald-900">
        If <strong>{email}</strong> matches an admin account, a reset link has been sent. The link expires in 1 hour.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 font-body text-sm text-rose-900">
          {error}
        </div>
      )}
      <div>
        <label className="block font-body text-sm font-semibold text-slate-700" htmlFor="admin-forgot-email">
          Admin email
        </label>
        <input
          id="admin-forgot-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-body text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Email me a reset link'}
      </button>
    </form>
  )
}
