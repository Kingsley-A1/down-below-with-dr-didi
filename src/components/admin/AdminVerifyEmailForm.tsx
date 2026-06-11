'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'

type Status = 'idle' | 'verifying' | 'success' | 'error' | 'resending'

const CODE_LENGTH = 6

export function AdminVerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Admin registration redirects here with ?email= so the address is prefilled.
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)

  // When the email is prefilled, move focus straight to the code field.
  useEffect(() => {
    if (email) {
      codeInputRef.current?.focus()
    }
    // Only on mount: the prefill is the single case we want to auto-focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isVerifying = status === 'verifying'
  const canSubmit = /^\S+@\S+\.\S+$/.test(email) && code.length === CODE_LENGTH && !isVerifying

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    setStatus('verifying')
    setMessage(null)
    try {
      const res = await fetch('/api/admin/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await readJsonResponse<{ success?: boolean; message?: string }>(res)

      if (res.ok && data?.success) {
        setStatus('success')
        setMessage(data.message ?? 'Email verified.')
        setTimeout(() => router.push('/admin/sign-in'), 1500)
      } else {
        setStatus('error')
        setMessage(parseApiError(data, 'Verification failed.').message)
      }
    } catch {
      setStatus('error')
      setMessage('Network error verifying your email.')
    }
  }

  const handleResend = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error')
      setMessage('Enter your admin email first, then request a new code.')
      return
    }

    setStatus('resending')
    setMessage(null)
    try {
      const res = await fetch('/api/admin/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await readJsonResponse<{ message?: string }>(res)
      if (!res.ok) {
        setStatus('error')
        setMessage(parseApiError(data, 'Could not request a new code. Try again in a moment.').message)
        return
      }
      setStatus('idle')
      setMessage(data?.message ?? 'If your account needs verification, a fresh code has been sent.')
    } catch {
      setStatus('error')
      setMessage('Could not request a new code. Try again in a moment.')
    }
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
      {message ? (
        <div
          className={`rounded-md border px-4 py-3 font-body text-sm ${
            status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
          role={status === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message}
        </div>
      ) : null}

      <form onSubmit={handleVerify} className="space-y-4" noValidate>
        <div>
          <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-verify-email">
            Admin email
          </label>
          <input
            id="admin-verify-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-admin@email.com"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 font-body text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-verify-code">
            6-digit code
          </label>
          <input
            ref={codeInputRef}
            id="admin-verify-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            aria-describedby="admin-verify-code-help"
            placeholder="000000"
            className="block w-full rounded-md border border-slate-300 px-3 py-3 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p id="admin-verify-code-help" className="mt-1 font-body text-xs text-slate-500">
            Enter the code from your email. It expires in 1 hour.
          </p>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-body text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isVerifying ? 'Verifying…' : 'Verify admin email'}
        </button>
      </form>

      <div className="text-center font-body text-sm text-slate-600">
        Didn&apos;t get a code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={status === 'resending'}
          className="font-semibold text-emerald-700 underline underline-offset-4 hover:text-emerald-800 disabled:opacity-50"
        >
          {status === 'resending' ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
