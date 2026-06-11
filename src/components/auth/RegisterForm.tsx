'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { userRegisterSchema, type UserRegisterData } from '@/lib/validations'

type RegisterResponse = {
  ok?: boolean
  error?: string
  code?: string
  fieldErrors?: Record<string, string[]>
  retryAfter?: number
  emailSent?: boolean
}

export function RegisterForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterData>({
    resolver: zodResolver(userRegisterSchema),
    defaultValues: {
      email: '',
      displayName: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: UserRegisterData) {
    setServerError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      let data: RegisterResponse = {}
      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        data = await response.json()
      }

      if (!response.ok) {
        if (data.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors)) {
            const message = messages?.[0]
            if (message) {
              setError(field as keyof UserRegisterData, { message })
            }
          }
        }

        if (data.code === 'rate_limited') {
          const minutes = data.retryAfter ? Math.ceil(data.retryAfter / 60) : 5
          setServerError(
            (data.error || 'Too many attempts.') +
              ` Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
          )
          return
        }

        if (!data.fieldErrors) {
          setServerError(data.error || 'Registration failed.')
        }
        return
      }

      setSuccessMessage(
        'Registration successful. Check your email for the 6-digit verification code.'
      )
      // Send the user to the verification screen with their email prefilled so
      // they only need to enter the code we just emailed them.
      window.dispatchEvent(new Event('auth-state-changed'))
      setTimeout(
        () => router.push(`/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`),
        1500
      )
      router.refresh()
    } catch (err) {
      console.error('[register] request failed', err)
      setServerError('We could not reach the server. Check your connection and try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {successMessage ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </div>
      ) : null}

      {serverError ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
          aria-live="polite"
        >
          {serverError}
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
        <label htmlFor="displayName" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          autoComplete="name"
          {...register('displayName')}
          aria-invalid={errors.displayName ? 'true' : 'false'}
          className="w-full rounded-xl border px-4 py-3 font-body text-sm text-slate-900"
          style={{ borderColor: 'var(--color-border)' }}
          placeholder="Your name"
        />
        {errors.displayName ? <p className="mt-2 text-sm text-red-600">{errors.displayName.message}</p> : null}
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Phone (optional)
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          {...register('phone')}
          aria-invalid={errors.phone ? 'true' : 'false'}
          className="w-full rounded-xl border px-4 py-3 font-body text-sm text-slate-900"
          style={{ borderColor: 'var(--color-border)' }}
          placeholder="+234... or 0..."
        />
        {errors.phone ? <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p> : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
        {errors.password ? (
          <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            8–128 characters. Must include uppercase, lowercase, number, and special character.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
            className="w-full rounded-xl border px-4 py-3 pr-11 font-body text-sm text-slate-900"
            style={{ borderColor: 'var(--color-border)' }}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-500 hover:text-slate-700"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword ? (
          <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full px-6 py-3 font-body font-semibold text-white transition-shadow disabled:opacity-60"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {isSubmitting ? 'Registering…' : 'Register'}
      </button>

      <p className="border-t border-slate-200 pt-4 font-body text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4"
        >
          Log in
        </Link>
      </p>
    </form>
  )
}
