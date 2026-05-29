'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { firstFieldErrorMessages, parseApiError, readJsonResponse } from '@/lib/api/client-error'

export function AdminResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const missingTokenError = 'This link is missing a reset token. Request a new email.'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) return
    setError(null)
    setFieldErrors({})
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const data = await readJsonResponse(res)
      if (!res.ok) {
        const parsedError = parseApiError(data, 'Could not reset password.')
        setFieldErrors(firstFieldErrorMessages(parsedError.fieldErrors))
        setError(parsedError.message)
        return
      }
      router.push('/admin/sign-in?message=Password reset. Please sign in.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 font-body text-sm text-rose-900">
          {missingTokenError}
        </div>
        <Link
          href="/admin/forgot-password"
          className="inline-block rounded-md bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white hover:bg-slate-800"
        >
          Request a new reset link
        </Link>
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
        <label className="block font-body text-sm font-semibold text-slate-700" htmlFor="admin-new-password">
          New password
        </label>
        <input
          id="admin-new-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-body text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <p className="mt-1 font-body text-xs text-slate-500">
          Must contain uppercase, lowercase, number, and special character. 8–128 characters.
        </p>
        {fieldErrors.password ? <p className="mt-1 font-body text-xs text-red-600">{fieldErrors.password}</p> : null}
      </div>
      <div>
        <label className="block font-body text-sm font-semibold text-slate-700" htmlFor="admin-confirm-password">
          Confirm password
        </label>
        <input
          id="admin-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-body text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {fieldErrors.confirmPassword ? <p className="mt-1 font-body text-xs text-red-600">{fieldErrors.confirmPassword}</p> : null}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  )
}
