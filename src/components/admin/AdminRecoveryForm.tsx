'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

type ToastState = {
  kind: 'success' | 'error'
  message: string
}

type RecoveryResponse = {
  success?: boolean
  error?: string
  message?: string
  next_steps?: string[]
}

export default function AdminRecoveryForm({ supportPhone }: { supportPhone: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showAccessCode, setShowAccessCode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [nextSteps, setNextSteps] = useState<string[]>([])
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => {
      setToast(null)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [toast])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setNextSteps([])
    setToast(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password || !accessCode) {
      setFormError('Email, password, and access code are required.')
      setToast({ kind: 'error', message: 'Recovery failed. Complete all fields and try again.' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/recovery/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          accessCode,
        }),
      })

      let payload: RecoveryResponse = {}
      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        payload = await response.json()
      }

      if (!response.ok || !payload.success) {
        const message = payload.error || payload.message || 'Recovery failed. Please verify your details and try again.'
        setFormError(message)
        setToast({ kind: 'error', message })
        return
      }

      const steps = payload.next_steps ?? [
        'Clear browser cookies for this site.',
        'Return to Admin sign in and login again.',
      ]

      setNextSteps(steps)
      setToast({ kind: 'success', message: payload.message || 'Recovery completed. You can retry sign in now.' })
    } catch {
      const message = 'Recovery request failed. Check your connection and try again.'
      setFormError(message)
      setToast({ kind: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          className={`rounded-xl border p-4 text-sm ${toast.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold">{toast.message}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-recovery-email">
            Admin email
          </label>
          <input
            id="admin-recovery-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 font-body text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-recovery-password">
            New or current password
          </label>
          <div className="relative">
            <input
              id="admin-recovery-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 font-body text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Use the password you want to sign in with immediately after recovery.</p>
        </div>

        <div>
          <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-recovery-access-code">
            Role access code
          </label>
          <div className="relative">
            <input
              id="admin-recovery-access-code"
              type={showAccessCode ? 'text' : 'password'}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 font-body text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowAccessCode((previous) => !previous)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-700"
              aria-label={showAccessCode ? 'Hide access code' : 'Show access code'}
            >
              {showAccessCode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-slate-900 px-6 py-3 font-body font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Recovering account...' : 'Run account recovery'}
        </button>
      </form>

      {nextSteps.length > 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Recovery completed. Retry sign in now.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {nextSteps.map((step, index) => (
              <li key={`${step}-${index}`}>{step}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push(`/admin/sign-in${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`)}
              className="rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
            >
              Go to Admin sign in
            </button>
            <Link
              href={`tel:${supportPhone}`}
              className="rounded-full border border-emerald-700 px-4 py-2 font-semibold text-emerald-900"
            >
              Call support
            </Link>
          </div>
        </div>
      ) : null}

      <p className="font-body text-sm text-slate-600">
        Back to sign in?{' '}
        <Link href="/admin/sign-in" className="font-semibold text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4">
          Return to Admin sign in
        </Link>
      </p>
    </div>
  )
}