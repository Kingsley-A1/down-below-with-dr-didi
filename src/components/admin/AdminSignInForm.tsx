'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { sanitizeAdminNextPath } from '@/lib/admin/redirects'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'
import { adminLoginSchema, type AdminLoginData } from '@/lib/validations'

type AdminSessionErrorPayload = {
  ok?: boolean
  error?: string
  code?: string
  retryAfter?: number
  fieldErrors?: Record<string, string[]>
}

export default function AdminSignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState('')
  const [serverHint, setServerHint] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  const nextPath = sanitizeAdminNextPath(searchParams.get('next'))

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      password: '',
    },
  })

  async function onSubmit(values: AdminLoginData) {
    setServerError('')
    setServerHint('')
    setNeedsEmailVerification(false)

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const result = (await readJsonResponse<AdminSessionErrorPayload>(response)) ?? {}

      if (!response.ok) {
        const parsedError = parseApiError(result, 'Unable to sign in.')

        if (parsedError.fieldErrors) {
          for (const [field, messages] of Object.entries(parsedError.fieldErrors)) {
            const message = messages?.[0]
            if (message) {
              setError(field as keyof AdminLoginData, { message })
            }
          }
        }

        if (parsedError.code === 'email_not_verified') {
          setNeedsEmailVerification(true)
          setServerError(parsedError.message)
          setServerHint('Check your inbox for the verification link, or request a new one.')
          return
        }

        if (parsedError.code === 'account_locked') {
          const minutes = parsedError.retryAfter ? Math.ceil(parsedError.retryAfter / 60) : 30
          setServerError(parsedError.message)
          setServerHint(`Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`)
          return
        }

        if (parsedError.code === 'rate_limited') {
          const minutes = parsedError.retryAfter ? Math.ceil(parsedError.retryAfter / 60) : 5
          setServerError(parsedError.message)
          setServerHint(`Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`)
          return
        }

        if (Object.keys(parsedError.fieldErrors).length === 0) {
          setServerError(parsedError.message)
          setServerHint('If you forgot your password, use the link below to reset it.')
        }
        return
      }

      router.push(nextPath)
      router.refresh()
    } catch {
      setServerError('Sign-in request failed.')
      setServerHint('Check your connection and try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block font-body text-sm font-semibold mb-2" htmlFor="email">Admin email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full rounded-xl border px-4 py-3 font-body text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        />
        {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="block font-body text-sm font-semibold mb-2" htmlFor="password">Password</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            {...register('password')}
            className="w-full rounded-xl border px-4 py-3 pr-11 font-body text-sm"
            style={{ borderColor: 'var(--color-border)' }}
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
        {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
      </div>
      {serverError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert" aria-live="polite">
          <p className="font-semibold">{serverError}</p>
          {serverHint ? <p className="mt-2">{serverHint}</p> : null}
          {needsEmailVerification ? (
            <Link
              href="/admin/verify-email"
              className="mt-3 inline-block rounded-full bg-red-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-800"
            >
              Resend verification email
            </Link>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full px-6 py-3 font-body font-semibold transition-shadow"
        style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
      >
        {isSubmitting ? 'Signing in...' : 'Sign in to Admin'}
      </button>

      <div className="border-t border-slate-200 pt-4">
        <Link
          href="/admin/forgot-password"
          className="font-body text-sm font-semibold text-slate-700 underline decoration-emerald-500 decoration-2 underline-offset-4"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  )
}
