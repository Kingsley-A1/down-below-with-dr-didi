'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VaultNotificationsWidget } from '@/components/auth/VaultNotificationsWidget'

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
    setIsLoading(true)

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Update failed')
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

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Password change failed')
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
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border bg-slate-50 p-4" style={{ borderColor: 'var(--color-border)' }}>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Account Email</p>
          <p className="mt-2 break-words font-body text-sm font-semibold text-slate-900">{initialUser.email}</p>
        </article>
        <article className="rounded-2xl border bg-slate-50 p-4" style={{ borderColor: 'var(--color-border)' }}>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Membership</p>
          <p className="mt-2 font-body text-sm font-semibold text-slate-900 capitalize">{initialUser.role}</p>
        </article>
        <article className="rounded-2xl border bg-slate-50 p-4" style={{ borderColor: 'var(--color-border)' }}>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Member Since</p>
          <p className="mt-2 font-body text-sm font-semibold text-slate-900" suppressHydrationWarning>
            {new Date(initialUser.createdAt).toLocaleDateString()}
          </p>
        </article>
      </div>

      <VaultNotificationsWidget />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-heading text-xl font-bold text-slate-900">Profile Information</h3>

          {!isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Display Name</p>
                <p className="mt-1 font-body text-sm text-slate-900">{formData.displayName}</p>
              </div>
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Phone</p>
                <p className="mt-1 font-body text-sm text-slate-900">{formData.phone || 'Not added yet'}</p>
              </div>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="mb-2 block font-body text-sm font-semibold text-slate-700">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleProfileChange}
                  className="w-full rounded-xl border px-4 py-3 text-sm text-slate-900"
                  style={{ borderColor: 'var(--color-border)' }}
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
                  onChange={handleProfileChange}
                  className="w-full rounded-xl border px-4 py-3 text-sm text-slate-900"
                  style={{ borderColor: 'var(--color-border)' }}
                  placeholder="+234 or 0... (Nigerian numbers)"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="rounded-full border px-5 py-2.5 text-sm font-semibold text-slate-700"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-heading text-xl font-bold text-slate-900">Security</h3>

          {!isChangingPassword ? (
            <div className="space-y-3">
              <p className="font-body text-sm text-slate-600">
                Keep your account secure by setting a strong password you do not use elsewhere.
              </p>
              <button
                onClick={() => setIsChangingPassword(true)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Change Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="mb-2 block font-body text-sm font-semibold text-slate-700">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full rounded-xl border px-4 py-3 text-sm text-slate-900"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="mb-2 block font-body text-sm font-semibold text-slate-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full rounded-xl border px-4 py-3 text-sm text-slate-900"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Must contain uppercase, lowercase, number, and special character. 8-128 characters.
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block font-body text-sm font-semibold text-slate-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full rounded-xl border px-4 py-3 text-sm text-slate-900"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="rounded-full border px-5 py-2.5 text-sm font-semibold text-slate-700"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="font-heading text-lg font-bold text-slate-900">Session</h3>
        <p className="mt-1 font-body text-sm text-slate-600">Sign out securely from this device when you are done.</p>
        <button
          onClick={handleLogout}
          className="mt-4 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
