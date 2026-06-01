'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, KeyRound, LogOut, Pencil, Save, X } from 'lucide-react'
import { VaultNotificationsWidget } from '@/components/auth/VaultNotificationsWidget'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'

interface User {
  id: string
  email: string
  displayName: string
  phone?: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface ProfileFormProps {
  initialUser: User
}

export function ProfileForm({ initialUser }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    displayName: initialUser.displayName,
    phone: initialUser.phone || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setFieldErrors({})
    setIsLoading(true)

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await readJsonResponse(response)

      if (!response.ok) {
        const parsed = parseApiError(data, 'Update failed')
        setFieldErrors(
          Object.fromEntries(
            Object.entries(parsed.fieldErrors).map(([field, messages]) => [field, messages[0] ?? ''])
          )
        )
        setError(parsed.message)
        return
      }

      setSuccess('Profile updated successfully')
      setIsEditingProfile(false)
      // Refresh the page to show updated data
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setFieldErrors({})
    setIsLoading(true)

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          ...passwordData,
        }),
      })

      const data = await readJsonResponse(response)

      if (!response.ok) {
        const parsed = parseApiError(data, 'Password change failed')
        setFieldErrors(
          Object.fromEntries(
            Object.entries(parsed.fieldErrors).map(([field, messages]) => [field, messages[0] ?? ''])
          )
        )
        setError(parsed.message)
        return
      }

      setSuccess('Password changed successfully')
      setIsChangingPassword(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.dispatchEvent(new Event('auth-state-changed'))
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="space-y-5">
      <dl className="grid overflow-hidden rounded-lg border bg-white sm:grid-cols-3 sm:divide-x sm:divide-slate-200" style={{ borderColor: 'var(--color-border)' }}>
        <div className="min-w-0 border-b border-slate-200 px-4 py-3 sm:border-b-0">
          <dt className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Account Email</dt>
          <dd className="mt-1 break-words font-body text-sm font-semibold text-slate-900">{initialUser.email}</dd>
        </div>
        <div className="border-b border-slate-200 px-4 py-3 sm:border-b-0">
          <dt className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Membership</dt>
          <dd className="mt-1 font-body text-sm font-semibold text-slate-900 capitalize">{initialUser.role}</dd>
        </div>
        <div className="px-4 py-3">
          <dt className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Member Since</dt>
          <dd className="mt-1 font-body text-sm font-semibold text-slate-900" suppressHydrationWarning>
            {new Date(initialUser.createdAt).toLocaleDateString()}
          </dd>
        </div>
      </dl>

      <VaultNotificationsWidget />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: 'var(--color-border)' }}>
        <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-slate-200">
          <section className="min-w-0 border-b border-slate-200 p-4 lg:border-b-0 sm:p-5">
            <h3 className="font-heading text-lg font-bold text-slate-900">Profile Information</h3>

            {!isEditingProfile ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Display Name</p>
                  <p className="mt-1 font-body text-sm text-slate-900">{formData.displayName}</p>
                </div>
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Phone</p>
                  <p className="mt-1 font-body text-sm text-slate-900">{formData.phone || 'Not added yet'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white sm:w-auto"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="displayName" className="mb-1.5 block font-body text-sm font-semibold text-slate-700">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleProfileChange}
                    className="input-field min-h-11"
                  />
                  {fieldErrors.displayName ? <p className="mt-1 text-xs text-red-600">{fieldErrors.displayName}</p> : null}
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1.5 block font-body text-sm font-semibold text-slate-700">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleProfileChange}
                    className="input-field min-h-11"
                    placeholder="+234 or 0... (Nigerian numbers)"
                  />
                  {fieldErrors.phone ? <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold text-slate-700 sm:w-auto"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="min-w-0 p-4 sm:p-5">
            <h3 className="font-heading text-lg font-bold text-slate-900">Security</h3>

            {!isChangingPassword ? (
              <div className="mt-4 space-y-3">
                <p className="font-body text-sm text-slate-600">
                  Keep your account secure by setting a strong password you do not use elsewhere.
                </p>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white sm:w-auto"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="mb-1.5 block font-body text-sm font-semibold text-slate-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="input-field min-h-11"
                  />
                  {fieldErrors.currentPassword ? <p className="mt-1 text-xs text-red-600">{fieldErrors.currentPassword}</p> : null}
                </div>

                <div>
                  <label htmlFor="newPassword" className="mb-1.5 block font-body text-sm font-semibold text-slate-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="input-field min-h-11"
                  />
                  {fieldErrors.newPassword ? <p className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">
                    Must contain uppercase, lowercase, number, and special character. 8-128 characters.
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block font-body text-sm font-semibold text-slate-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="input-field min-h-11"
                  />
                  {fieldErrors.confirmPassword ? <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p> : null}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Check className="h-4 w-4" />
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold text-slate-700 sm:w-auto"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        <section className="border-t px-4 py-4 sm:px-5" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-heading text-lg font-bold text-slate-900">Session</h3>
          <p className="mt-1 font-body text-sm text-slate-600">Sign out securely from this device when you are done.</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 sm:w-auto"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </section>
      </div>
    </div>
  )
}
