'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminSignInSchema, type AdminSignInData } from '@/lib/validations'

export default function AdminSignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState('')
  const nextPath = searchParams.get('next') || '/admin'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminSignInData>({
    resolver: zodResolver(adminSignInSchema),
  })

  async function onSubmit(values: AdminSignInData) {
    setServerError('')

    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const result = await response.json()

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
          {...register('email')}
          className="w-full rounded-xl border px-4 py-3 font-body text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        />
        {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="block font-body text-sm font-semibold mb-2" htmlFor="accessCode">Admin access code</label>
        <input
          id="accessCode"
          type="password"
          {...register('accessCode')}
          className="w-full rounded-xl border px-4 py-3 font-body text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        />
        {errors.accessCode ? <p className="mt-2 text-sm text-red-600">{errors.accessCode.message}</p> : null}
      </div>

      {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full px-6 py-3 font-body font-semibold"
        style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
      >
        {isSubmitting ? 'Signing in...' : 'Sign in to Admin'}
      </button>
    </form>
  )
}