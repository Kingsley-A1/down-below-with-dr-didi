'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'

type Status = 'idle' | 'verifying' | 'success' | 'error' | 'resending'

export function AdminVerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>(() => (token ? 'verifying' : 'idle'))
  const [message, setMessage] = useState<string | null>(null)
  const [resendEmail, setResendEmail] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    let isActive = true
    let redirectTimer: ReturnType<typeof setTimeout> | undefined

    fetch('/api/admin/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await readJsonResponse<{ success?: boolean; message?: string }>(res)
        if (!isActive) {
          return
        }

        if (res.ok && data?.success) {
          setStatus('success')
          setMessage(data.message ?? 'Email verified.')
          redirectTimer = setTimeout(() => router.push('/admin/sign-in'), 1500)
        } else {
          setStatus('error')
          setMessage(parseApiError(data, 'Verification failed.').message)
        }
      })
      .catch(() => {
        if (!isActive) {
          return
        }
        setStatus('error')
        setMessage('Network error verifying your email.')
      })

    return () => {
      isActive = false
      if (redirectTimer) {
        clearTimeout(redirectTimer)
      }
    }
  }, [token, router])

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!resendEmail) return
    setStatus('resending')
    try {
      const res = await fetch('/api/admin/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      })
      const data = await readJsonResponse<{ message?: string }>(res)
      if (!res.ok) {
        setStatus('error')
        setMessage(parseApiError(data, 'Could not request a new link. Try again in a moment.').message)
        return
      }

      setMessage(data?.message ?? 'If your account needs verification, a fresh link has been sent.')
      setStatus('idle')
    } catch {
      setStatus('error')
      setMessage('Could not request a new link. Try again in a moment.')
    }
  }

  if (status === 'verifying') {
    return <p className="font-body text-sm text-slate-600">Verifying your email…</p>
  }

  if (status === 'success') {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 font-body text-sm text-emerald-900">
        {message} Redirecting to admin sign-in…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`rounded-md border px-4 py-3 font-body text-sm ${status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleResend} className="space-y-3">
        <label className="block font-body text-sm font-semibold text-slate-700" htmlFor="admin-resend-email">
          Need a new verification link?
        </label>
        <input
          id="admin-resend-email"
          type="email"
          autoComplete="email"
          required
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          placeholder="your-admin@email.com"
          className="block w-full rounded-md border border-slate-300 px-3 py-2 font-body text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={status === 'resending'}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {status === 'resending' ? 'Sending…' : 'Send a new verification email'}
        </button>
      </form>
    </div>
  )
}
