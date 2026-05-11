'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      // Registration successful
      window.dispatchEvent(new Event('auth-state-changed'))
      router.push('/home')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full rounded-xl border px-4 py-3 font-body text-sm text-slate-900"
          style={{ borderColor: 'var(--color-border)' }}
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="displayName" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          required
          className="w-full rounded-xl border px-4 py-3 font-body text-sm text-slate-900"
          style={{ borderColor: 'var(--color-border)' }}
          placeholder="Your Name"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Phone (Optional)
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full rounded-xl border px-4 py-3 font-body text-sm text-slate-900"
          style={{ borderColor: 'var(--color-border)' }}
          placeholder="+234 or 0... (Nigerian numbers)"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
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
        <p className="mt-1 text-xs text-slate-500">
          Must contain uppercase, lowercase, number, and special character. 8-128 characters.
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block font-body text-sm font-semibold text-slate-700">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
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
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-full px-6 py-3 font-body font-semibold text-white transition-shadow disabled:opacity-60"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {isLoading ? 'Registering...' : 'Register'}
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
