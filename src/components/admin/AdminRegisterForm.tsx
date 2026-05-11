'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminRegisterSchema, type AdminRegisterData } from '@/lib/validations'

export default function AdminRegisterForm({ supportPhone }: { supportPhone: string }) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [showSupportContact, setShowSupportContact] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminRegisterData>({
    resolver: zodResolver(adminRegisterSchema),
  })

  async function onSubmit(values: AdminRegisterData) {
    setServerError('')

    const response = await fetch('/api/admin/register', {
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
      setServerError(result.error || 'Unable to complete admin registration')
      return
    }

    router.push('/admin')
    router.refresh()
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
        <input
          id="admin-register-password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 font-body text-sm"
        />
        {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-register-confirm-password">
          Confirm password
        </label>
        <input
          id="admin-register-confirm-password"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 font-body text-sm"
        />
        {errors.confirmPassword ? <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-register-access-code">
          Role access code
        </label>
        <input
          id="admin-register-access-code"
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          {...register('accessCode')}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 font-body text-sm"
        />
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

      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setShowSupportContact((previous) => !previous)}
          className="font-body text-sm font-semibold text-slate-700 underline decoration-emerald-500 decoration-2 underline-offset-4"
        >
          Need help with registration?
        </button>
        {showSupportContact ? (
          <p className="mt-2 font-body text-sm text-slate-600">
            Contact the super admin on{' '}
            <a href={`tel:${supportPhone}`} className="font-semibold text-slate-900 underline underline-offset-4">
              {supportPhone}
            </a>{' '}
            for role-code and password support.
          </p>
        ) : null}
      </div>
    </form>
  )
}
