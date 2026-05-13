'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { adminLoginSchema, type AdminLoginData } from '@/lib/validations'

type AdminSessionErrorPayload = {
  error?: string
  hint?: string
  troubleshoot?: string
  recover?: string
}

export default function AdminSignInForm({ supportPhone }: { supportPhone: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState('')
  const [serverHint, setServerHint] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showSupportContact, setShowSupportContact] = useState(false)
  const nextPath = searchParams.get('next') || '/admin'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      password: '',
    },
  })

  const email = watch('email')

  async function onSubmit(values: AdminLoginData) {
    setServerError('')
    setServerHint('')

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      let result: AdminSessionErrorPayload = {}
      const contentType = response.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        result = await response.json()
      }

      if (!response.ok) {
        setServerError(result.error || 'Unable to sign in')
        setServerHint(result.hint || '')
        return
      }

      router.push(nextPath)
      router.refresh()
    } catch {
      setServerError('Sign-in request failed. Check your connection and try again.')
      setServerHint('If this keeps happening, open self-service recovery or contact support.')
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
          <p className="mt-3 text-sm text-red-900">
            Next step: run self-service recovery, then retry sign in.
          </p>
          <Link
            href={`/admin/recovery${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
            className="mt-3 inline-block rounded-full bg-red-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-800"
          >
            Open self-service recovery
          </Link>
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
        <button
          type="button"
          onClick={() => setShowSupportContact((previous) => !previous)}
          className="font-body text-sm font-semibold text-slate-700 underline decoration-emerald-500 decoration-2 underline-offset-4"
        >
          Forgot password?
        </button>
        {showSupportContact ? (
          <p className="mt-2 font-body text-sm text-slate-600">
            Contact the super admin on{' '}
            <a href={`tel:${supportPhone}`} className="font-semibold text-slate-900 underline underline-offset-4">
              {supportPhone}
            </a>{' '}
            for password reset assistance.
          </p>
        ) : null}
      </div>
    </form>
  )
}