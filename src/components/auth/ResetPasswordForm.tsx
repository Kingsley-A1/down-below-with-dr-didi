'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const missingTokenError = 'Invalid or missing reset link. Request a new password reset email.'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!token) {
      setError('Reset link is missing. Request a new password reset email.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Password reset failed')
        return
      }

      router.push('/login?message=Password reset successful. Please log in.')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="space-y-3">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{missingTokenError}</div>
        <Link
          href="/forgot-password"
          className="block rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          Request a new reset link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="••••••••"
        />
        <p className="mt-1 text-xs text-gray-500">
          Must contain uppercase, lowercase, number, and special character. 8-128 characters.
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Resetting…' : 'Reset Password'}
      </button>

      <p className="text-center text-sm text-gray-600">
        <Link href="/login" className="text-blue-600 hover:text-blue-500">
          Back to login
        </Link>
      </p>
    </form>
  )
}
