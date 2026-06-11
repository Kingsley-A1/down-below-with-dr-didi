'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CodeInput } from '@/components/auth/CodeInput'

const CODE_LENGTH = 6

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Registration redirects here with ?email= so the address is prefilled and
  // the user only has to type the code.
  const initialEmail = searchParams.get('email') ?? ''
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error' | 'resending'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const isSubmitting = status === 'verifying'
  const emailvalid = /^\S+@\S+\.\S+$/.test(email)
  const canSubmit = emailvalid && code.length === CODE_LENGTH && !isSubmitting

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setStatus('verifying')
    setMessage(null)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await response.json().catch(() => ({}))

      if (response.ok && data?.success) {
        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')
        setTimeout(() => router.push('/login'), 1800)
      } else {
        setStatus('error')
        setMessage(data?.error || 'Verification failed. Check the code and try again.')
      }
    } catch {
      setStatus('error')
      setMessage('We could not reach the server. Check your connection and try again.')
    }
  }

  async function handleResend() {
    if (!emailvalid) {
      setStatus('error')
      setMessage('Enter your email address first, then request a new code.')
      return
    }

    setStatus('resending')
    setMessage(null)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json().catch(() => ({}))
      setStatus('idle')
      setMessage(data?.message || 'If your account needs verification, a fresh code has been sent.')
    } catch {
      setStatus('error')
      setMessage('We could not request a new code. Try again in a moment.')
    }
  }

  if (status === 'success') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-sm border-t-2 border-emerald-600 bg-white px-8 py-10 text-center">
          <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Email verified</h1>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          <p className="mt-1 text-xs text-slate-400">Taking you to sign in…</p>
          <Link
            href="/login"
            className="mt-6 inline-block bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm border-t-2 border-emerald-600 bg-white px-8 py-10">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Email verification</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Enter your code</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            We emailed a 6-digit code to verify your account. It expires in 1 hour.
          </p>
        </header>

        {message ? (
          <div
            className={`mt-6 border-l-2 px-3 py-2.5 text-sm ${
              status === 'error'
                ? 'border-red-500 bg-red-50 text-red-800'
                : 'border-emerald-500 bg-emerald-50 text-emerald-800'
            }`}
            role={status === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {message}
          </div>
        ) : null}

        <form onSubmit={handleVerify} className="mt-6 space-y-6" noValidate>
          <div>
            <label htmlFor="verify-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </label>
            <input
              id="verify-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-0 border-b-2 border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-0"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">6-digit code</span>
            <CodeInput
              value={code}
              onChange={setCode}
              length={CODE_LENGTH}
              autoFocus={Boolean(initialEmail)}
              ariaLabel="Verification code"
              ariaDescribedBy="verify-code-help"
              idPrefix="verify-code"
            />
            <p id="verify-code-help" className="mt-2 text-xs text-slate-400">
              Paste or type the code from your email.
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? 'Verifying…' : 'Verify email'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={status === 'resending'}
            className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800 disabled:opacity-50"
          >
            {status === 'resending' ? 'Sending…' : 'Resend code'}
          </button>
          <Link href="/login" className="text-slate-500 transition-colors hover:text-slate-900">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
