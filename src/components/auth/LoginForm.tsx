'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { userLoginSchema, type UserLoginData } from '@/lib/validations'

type LoginResponse = {
  ok?: boolean
  error?: string
  code?: string
  fieldErrors?: Record<string, string[]>
  retryAfter?: number
}

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [serverHint, setServerHint] = useState<string | null>(null)
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  const [verifyEmailAddress, setVerifyEmailAddress] = useState<string | null>(null)
  const [resendingVerification, setResendingVerification] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserLoginData>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: UserLoginData) {
    setServerError(null)
    setServerHint(null)
    setNeedsEmailVerification(false)
    setVerifyEmailAddress(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      let data: LoginResponse = {}
      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        data = await response.json()
      }

      if (!response.ok) {
        if (data.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors)) {
            const message = messages?.[0]
            if (message) {
              setError(field as keyof UserLoginData, { message })
            }
          }
        }

        if (data.code === 'email_not_verified') {
          setNeedsEmailVerification(true)
          setVerifyEmailAddress(values.email.trim().toLowerCase())
          setServerError(data.error || 'Verify your email to continue.')
          setServerHint('Check your inbox for the verification link or request a new one.')
          return
        }

        if (data.code === 'account_locked' || data.code === 'rate_limited') {
          const minutes = data.retryAfter ? Math.ceil(data.retryAfter / 60) : 5
          setServerError(data.error || 'Too many attempts.')
          setServerHint(`Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`)
          return
        }

        if (!data.fieldErrors) {
          setServerError(data.error || 'Sign in failed.')
        }
        return
      }

      window.dispatchEvent(new Event('auth-state-changed'))
      router.push('/home')
      router.refresh()
    } catch (err) {
      console.error('[login] request failed', err)
      setServerError('We could not reach the server. Check your connection and try again.')
    }
  }

  async function handleResendVerification() {
    if (!verifyEmailAddress) return
    setResendingVerification(true)
    setServerHint(null)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmailAddress }),
      })
      if (response.ok) {
        setServerHint('Verification email sent. Check your inbox.')
      } else {
        setServerHint('We could not send a new verification email. Try again shortly.')
      }
    } catch {
      setServerHint('We could not send a new verification email. Try again shortly.')
    } finally {
      setResendingVerification(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
          aria-live="polite"
        >
          <p className="font-semibold">{serverError}</p>
          {serverHint ? <p className="mt-2">{serverHint}</p> : null}
          {needsEmailVerification ? (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="mt-3 inline-flex items-center rounded-full bg-red-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-60"
            >
              {resendingVerification ? 'Sending…' : 'Resend verification email'}
            </button>
          ) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="email" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          aria-invalid={errors.email ? 'true' : 'false'}
          className="w-full rounded-xl border px-4 py-3 font-body text-sm text-slate-900"
          style={{ borderColor: 'var(--color-border)' }}
          placeholder="your@email.com"
        />
        {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('password')}
            aria-invalid={errors.password ? 'true' : 'false'}
            className="w-full rounded-xl border px-4 py-3 pr-11 font-body text-sm text-slate-900"
            style={{ borderColor: 'var(--color-border)' }}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-500 hover:text-slate-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full px-6 py-3 font-body font-semibold text-white transition-shadow disabled:opacity-60"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {isSubmitting ? 'Logging in…' : 'Log in'}
      </button>

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-sm">
        <Link
          href="/forgot-password"
          className="font-body font-semibold text-slate-700 underline decoration-emerald-500 decoration-2 underline-offset-4"
        >
          Forgot password?
        </Link>
        <p className="font-body text-slate-600">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4"
          >
            Register
          </Link>
        </p>
      </div>
    </form>
  )
}
