'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'
import { CodeInput } from '@/components/auth/CodeInput'

type Status = 'idle' | 'verifying' | 'success' | 'error' | 'resending'

const CODE_LENGTH = 6

export function AdminVerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Admin registration redirects here with ?email= so the address is prefilled.
  const initialEmail = searchParams.get('email') ?? ''
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const isVerifying = status === 'verifying'
  const emailValid = /^\S+@\S+\.\S+$/.test(email)
  const canSubmit = emailValid && code.length === CODE_LENGTH && !isVerifying

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
    if (!emailValid) {
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
      <div className="border-l-2 border-emerald-500 bg-emerald-50 px-3 py-2.5 font-body text-sm text-emerald-900">
        {message} Redirecting to admin sign-in…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div
          className={`border-l-2 px-3 py-2.5 font-body text-sm ${
            status === 'error' ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-emerald-500 bg-emerald-50 text-emerald-900'
          }`}
          role={status === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message}
        </div>
      ) : null}

      <form onSubmit={handleVerify} className="space-y-6" noValidate>
        <div>
          <label className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="admin-verify-email">
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
            className="block w-full border-0 border-b-2 border-slate-300 bg-transparent px-0 py-2 font-body text-sm text-slate-900 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-0"
          />
        </div>

        <div>
          <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-wide text-slate-500">6-digit code</span>
          <CodeInput
            value={code}
            onChange={setCode}
            length={CODE_LENGTH}
            autoFocus={Boolean(initialEmail)}
            ariaLabel="Admin verification code"
            ariaDescribedBy="admin-verify-code-help"
            idPrefix="admin-verify-code"
          />
          <p id="admin-verify-code-help" className="mt-2 font-body text-xs text-slate-400">
            Enter the code from your email. It expires in 1 hour.
          </p>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-slate-900 px-4 py-3 font-body text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isVerifying ? 'Verifying…' : 'Verify admin email'}
        </button>
      </form>

      <div className="font-body text-sm text-slate-600">
        Didn&apos;t get a code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={status === 'resending'}
          className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800 disabled:opacity-50"
        >
          {status === 'resending' ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
