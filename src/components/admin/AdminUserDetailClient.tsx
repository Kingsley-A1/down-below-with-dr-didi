'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AuditLogViewer from './AuditLogViewer'
import type { PublicAdminUserDetailRecord, PublicUserAuditLogRecord } from '@/lib/admin/user-repository'

interface AdminUserDetailClientProps {
  userId: string
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'super_admin':   return 'bg-violet-100 text-violet-800'
    case 'founder_admin': return 'bg-rose-100 text-rose-700'
    case 'editor':        return 'bg-sky-100 text-sky-700'
    case 'moderator':     return 'bg-amber-100 text-amber-700'
    case 'contributor':   return 'bg-teal-100 text-teal-700'
    case 'verified_healer': return 'bg-emerald-100 text-emerald-800'
    default:              return 'bg-slate-100 text-slate-700'
  }
}

/**
 * Client component for viewing user details and audit logs
 */
export default function AdminUserDetailClient({
  userId,
}: AdminUserDetailClientProps) {
  const router = useRouter()
  const [user, setUser] = useState<PublicAdminUserDetailRecord | null>(null)
  const [auditLogs, setAuditLogs] = useState<PublicUserAuditLogRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch user details and audit logs
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/users/${userId}?auditLimit=100`)

        if (!response.ok) {
          if (response.status === 403) {
            router.push('/admin')
            return
          }
          if (response.status === 404) {
            setError('User not found')
            return
          }
          throw new Error('Failed to fetch user details')
        }

        const data = await response.json()
        setUser(data.user)
        setAuditLogs(data.auditLogs || [])
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserDetails()
  }, [userId, router])

  // Helper to refresh audit logs without full page reload
  const refreshAuditLogs = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}?auditLimit=100`)
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.auditLogs || [])
      }
    } catch (err) {
      console.error('Failed to refresh audit logs:', err)
    }
  }

  const handleDeactivate = async () => {
    if (!user) return

    if (!confirm(`Are you sure you want to deactivate ${user.email}?`)) {
      return
    }

    try {
      setIsUpdating(true)
      setError(null)
      setSuccessMessage(null)

      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to deactivate user')
      }

      const data = await response.json()
      setUser(data.user)
      setSuccessMessage(data.message)

      // Refresh audit logs in-place (no page reload)
      refreshAuditLogs()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleActivate = async () => {
    if (!user) return

    if (!confirm(`Are you sure you want to activate ${user.email}?`)) {
      return
    }

    try {
      setIsUpdating(true)
      setError(null)
      setSuccessMessage(null)

      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to activate user')
      }

      const data = await response.json()
      setUser(data.user)
      setSuccessMessage(data.message)

      // Refresh audit logs in-place (no page reload)
      refreshAuditLogs()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <AdminInlineStatus tone="error" message={error || 'User not found'} />
        <Link href="/admin/users" className="font-body text-sm font-semibold text-emerald-700 hover:text-emerald-900">
          Back to user list
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Operations"
        title={user.displayName}
        description={user.email}
        actions={
          <Link
            href="/admin/users"
            className="rounded-full border border-slate-300 px-4 py-2 font-body text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Back to user list
          </Link>
        }
      />

      {error ? <AdminInlineStatus tone="error" message={error} /> : null}

      {successMessage ? <AdminInlineStatus tone="success" message={successMessage} /> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Role</p>
            <div>
              <span
                className={`rounded-full px-3 py-1 font-body text-xs font-semibold capitalize ${getRoleBadgeClass(user.role)}`}
              >
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</p>
            <div>
              <span
                className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${
                  user.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Email Verified
            </p>
            <div>
              <span
                className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${
                  user.emailVerified
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {user.emailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Phone</p>
            <p className="font-body text-sm text-slate-600">{user.phone || 'Not provided'}</p>
          </div>

          <div>
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Member Since</p>
            <p className="font-body text-sm text-slate-600">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

          {/* Security + Activity stats */}
          <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
            <div>
              <p className="mb-1 font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Last Activity</p>
              <p className="font-body text-sm text-slate-700">
                {new Date(user.lastActivityAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="mb-1 font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Account Lock</p>
              {user.isLockedOut ? (
                <div className="space-y-0.5">
                  <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 font-body text-xs font-semibold text-rose-700">
                    Locked
                  </span>
                  <p className="font-body text-xs text-slate-500">
                    Until {new Date(user.lockoutUntil!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : user.failedLoginAttempts > 0 ? (
                <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 font-body text-xs font-semibold text-amber-700">
                  {user.failedLoginAttempts} failed attempt{user.failedLoginAttempts !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 font-body text-xs font-semibold text-emerald-700">
                  Clean
                </span>
              )}
            </div>
            <div>
              <p className="mb-1 font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">V-Vault Submissions</p>
              <p className="font-body text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {user.vaultSubmissionCount}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            {user.isActive ? (
              <button
                onClick={handleDeactivate}
                disabled={isUpdating}
                className="rounded-full bg-rose-600 px-5 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {isUpdating ? 'Deactivating...' : 'Deactivate User'}
              </button>
            ) : (
              <button
                onClick={handleActivate}
                disabled={isUpdating}
                className="rounded-full bg-emerald-600 px-5 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {isUpdating ? 'Activating...' : 'Activate User'}
              </button>
            )}
          </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-2xl font-bold text-slate-900">Audit Timeline</h2>
        <p className="mt-2 font-body text-sm text-slate-600">Recent account actions and moderation events.</p>
        <div className="mt-5">
        <AuditLogViewer logs={auditLogs} isLoading={false} />
        </div>
      </section>
    </div>
  )
}
