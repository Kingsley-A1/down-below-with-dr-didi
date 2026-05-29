'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { adminRegisterSchema, type AdminRegisterData } from '@/lib/validations'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'

export default function AdminRegisterForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showAccessCode, setShowAccessCode] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminRegisterData>({
    resolver: zodResolver(adminRegisterSchema),
  })

  async function onSubmit(values: AdminRegisterData) {
    setServerError('')

    type AdminRegisterResponse = {
      ok?: boolean
      error?: string
      code?: string
      fieldErrors?: Record<string, string[]>
      retryAfter?: number
      requiresEmailVerification?: boolean
    }

    try {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const result = (await readJsonResponse<AdminRegisterResponse>(response)) ?? {}

      if (!response.ok) {
        const parsedError = parseApiError(result, 'Unable to complete admin registration.')

        if (Object.keys(parsedError.fieldErrors).length > 0) {
          for (const [field, messages] of Object.entries(parsedError.fieldErrors)) {
            const message = messages?.[0]
            if (message) {
              setError(field as keyof AdminRegisterData, { message })
            }
          }
        }

        if (parsedError.code === 'rate_limited') {
          const minutes = parsedError.retryAfter ? Math.ceil(parsedError.retryAfter / 60) : 5
          setServerError(
            parsedError.message +
              ` Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
          )
          return
        }

        if (Object.keys(parsedError.fieldErrors).length === 0) {
          setServerError(parsedError.message)
        }
        return
      }

      // Admin registration requires email verification before sign-in. Send the
      // operator to the verify-email page so they know what to do next.
      if (result.requiresEmailVerification) {
        router.push('/admin/verify-email')
        router.refresh()
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setServerError('Admin registration request failed. Check your connection and try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-register-name">
          Full name
        </label>
        <input
          id="admin-register-name"
          type="text"
          autoComplete="name"
          {...register('name')}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 font-body text-sm"
        />
        {errors.name ? <p className="mt-2 text-sm text-red-600">{errors.name.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-register-email">
          Admin email
        </label>
        <input
          id="admin-register-email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 font-body text-sm"
        />
        {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-register-phone">
          Phone number
        </label>
        <input
          id="admin-register-phone"
          type="tel"
          autoComplete="tel"
          {...register('phone')}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 font-body text-sm"
        />
        {errors.phone ? <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-register-password">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('password')}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 font-body text-sm"
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

      <div>
        <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-register-confirm-password">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="admin-register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirmPassword')}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 font-body text-sm"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((previous) => !previous)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-700"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword ? <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-register-access-code">
          Role access code
        </label>
        <div className="relative">
          <input
            id="admin-register-access-code"
            type={showAccessCode ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="one-time-code"
            {...register('accessCode')}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-11 font-body text-sm"
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
        {errors.accessCode ? <p className="mt-2 text-sm text-red-600">{errors.accessCode.message}</p> : null}
      </div>

      {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-slate-900 px-6 py-3 font-body font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Creating admin account...' : 'Create admin account'}
      </button>

    </form>
  )
}
