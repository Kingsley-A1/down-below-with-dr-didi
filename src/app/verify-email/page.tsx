'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const CODE_LENGTH = 6

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
              <p className="text-center text-gray-600">Loading…</p>
            </div>
          </div>
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
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error' | 'resending'>('idle')
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

  const isSubmitting = status === 'verifying'
  const canSubmit = /^\S+@\S+\.\S+$/.test(email) && code.length === CODE_LENGTH && !isSubmitting

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
    if (!/^\S+@\S+\.\S+$/.test(email)) {
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="space-y-4 rounded-lg bg-white px-6 py-8 text-center shadow sm:px-10">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Email verified!</h1>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">Taking you to sign in…</p>
            <Link
              href="/login"
              className="mt-2 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white px-6 py-8 shadow sm:px-10">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Email verification</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Enter your verification code</h1>
            <p className="mt-2 text-sm text-gray-600">
              We emailed you a 6-digit code. Enter it below to activate your account. The code expires in 1 hour.
            </p>
          </div>

          {message ? (
            <div
              className={`mb-5 rounded-md border px-4 py-3 text-sm ${
                status === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
              role={status === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {message}
            </div>
          ) : null}

          <form onSubmit={handleVerify} className="space-y-5" noValidate>
            <div>
              <label htmlFor="verify-email" className="mb-2 block text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                id="verify-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="verify-code" className="mb-2 block text-sm font-semibold text-gray-700">
                6-digit code
              </label>
              <input
                ref={codeInputRef}
                id="verify-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={CODE_LENGTH}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
                aria-describedby="verify-code-help"
                className="w-full rounded-md border border-gray-300 px-3 py-3 text-center font-mono text-2xl tracking-[0.5em] text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="000000"
                required
              />
              <p id="verify-code-help" className="mt-1 text-xs text-gray-500">
                Paste or type the code from your email.
              </p>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying…' : 'Verify email'}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-4 text-center text-sm text-gray-600">
            Didn&apos;t get a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={status === 'resending'}
              className="font-semibold text-emerald-700 underline underline-offset-4 hover:text-emerald-800 disabled:opacity-50"
            >
              {status === 'resending' ? 'Sending…' : 'Resend code'}
            </button>
            <span className="mx-2 text-gray-300">·</span>
            <Link href="/login" className="font-semibold text-gray-900 underline underline-offset-4">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
