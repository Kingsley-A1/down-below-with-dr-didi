'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminLoginSchema, type AdminLoginData } from '@/lib/validations'

export default function AdminSignInForm({ supportPhone }: { supportPhone: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState('')
  const [showSupportContact, setShowSupportContact] = useState(false)
  const nextPath = searchParams.get('next') || '/admin'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
  })

  async function onSubmit(values: AdminLoginData) {
    setServerError('')

    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    let result: { error?: string } = {}
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      result = await response.json()
    }

    if (!response.ok) {
      setServerError(result.error || 'Unable to sign in')
      return
    }

    router.push(nextPath)
    router.refresh()
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
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="w-full rounded-xl border px-4 py-3 font-body text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        />
        {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
      </div>

      {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

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