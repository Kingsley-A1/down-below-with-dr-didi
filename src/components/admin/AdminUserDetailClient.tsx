'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuditLogViewer from './AuditLogViewer'
import { PublicUserRecord, PublicUserAuditLogRecord } from '@/lib/admin/user-repository'

interface AdminUserDetailClientProps {
  userId: string
  currentAdminEmail: string
}

/**
 * Client component for viewing user details and audit logs
 */
export default function AdminUserDetailClient({
  userId,
  currentAdminEmail,
}: AdminUserDetailClientProps) {
  const router = useRouter()
  const [user, setUser] = useState<PublicUserRecord | null>(null)
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
            router.push('/')
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

      // Refresh audit logs
      setTimeout(() => {
        window.location.reload()
      }, 2000)
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

      // Refresh audit logs
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        <div className="flex justify-between items-center">
          <p>{error || 'User not found'}</p>
          <Link href="/admin/users" className="text-red-600 hover:text-red-800 font-medium">
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.displayName}</h1>
          <p className="text-gray-600 text-lg">{user.email}</p>
        </div>
        <Link
          href="/admin/users"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Users
        </Link>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg">
          ✓ {successMessage}
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="text-lg font-semibold">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="text-lg font-semibold">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Verified
            </label>
            <div className="text-lg font-semibold">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.emailVerified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {user.emailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <p className="text-gray-600">{user.phone || 'Not provided'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
            <p className="text-gray-600">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          {user.isActive ? (
            <button
              onClick={handleDeactivate}
              disabled={isUpdating}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isUpdating ? 'Deactivating...' : 'Deactivate User'}
            </button>
          ) : (
            <button
              onClick={handleActivate}
              disabled={isUpdating}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isUpdating ? 'Activating...' : 'Activate User'}
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Log</h2>
        <AuditLogViewer logs={auditLogs} isLoading={false} />
      </div>
    </div>
  )
}
