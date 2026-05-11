'use client'

import { useEffect, useMemo, useState } from 'react'

type UserNotification = {
  id: string
  type: string
  title: string
  body: string
  entityType: string | null
  entityId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

type NotificationsResponse = {
  success: boolean
  notifications: UserNotification[]
  unreadCount: number
  error?: string
}

type VaultThreadResponse = {
  id: string
  responseBody: string
  deliveredAt: string | null
  createdAt: string
}

type VaultThread = {
  id: string
  category: string
  question: string
  status: string
  createdAt: string
  updatedAt: string
  responses: VaultThreadResponse[]
}

type ThreadsResponse = {
  success: boolean
  threads: VaultThread[]
  error?: string
}

const POLL_INTERVAL_MS = 15000

export function VaultNotificationsWidget() {
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [threads, setThreads] = useState<VaultThread[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const vaultNotifications = useMemo(
    () => notifications.filter((item) => item.type === 'vault_response'),
    [notifications]
  )

  const vaultThreadsWithResponses = useMemo(
    () => threads.filter((thread) => thread.responses.length > 0),
    [threads]
  )

  useEffect(() => {
    let cancelled = false

    async function fetchNotifications() {
      try {
        const [notificationsResponse, threadsResponse] = await Promise.all([
          fetch('/api/users/notifications?limit=20', {
            method: 'GET',
            cache: 'no-store',
          }),
          fetch('/api/vault/me?limit=20', {
            method: 'GET',
            cache: 'no-store',
          }),
        ])

        const notificationsResult = (await notificationsResponse.json()) as NotificationsResponse
        const threadsResult = (await threadsResponse.json()) as ThreadsResponse

        if (!notificationsResponse.ok || !notificationsResult.success) {
          throw new Error(notificationsResult.error || 'Failed to load notifications')
        }

        if (!threadsResponse.ok || !threadsResult.success) {
          throw new Error(threadsResult.error || 'Failed to load response history')
        }

        if (!cancelled) {
          setNotifications(notificationsResult.notifications || [])
          setUnreadCount(notificationsResult.unreadCount || 0)
          setThreads(threadsResult.threads || [])
          setError(null)
          setLastUpdatedAt(new Date())
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load notifications')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void fetchNotifications()
    const intervalId = setInterval(() => {
      void fetchNotifications()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/users/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        return
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      )
      setUnreadCount((previous) => Math.max(previous - 1, 0))
    } catch {
      // Best effort: polling will refresh state shortly.
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">V-Vault Inbox</h3>
          <p className="text-sm text-gray-600">
            {isLoading
              ? 'Checking for responses...'
              : `${unreadCount} unread response${unreadCount === 1 ? '' : 's'}${lastUpdatedAt ? ` • updated ${lastUpdatedAt.toLocaleTimeString()}` : ''}`}
          </p>
        </div>
        {unreadCount > 0 ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
            New response
          </span>
        ) : null}
      </div>

      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {!isLoading && vaultNotifications.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No V-Vault responses yet. We will notify you here as soon as one arrives.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {vaultNotifications.slice(0, 5).map((notification) => (
            <li
              key={notification.id}
              className={`rounded-md border p-3 ${notification.isRead ? 'border-gray-200 bg-gray-50' : 'border-emerald-200 bg-emerald-50'}`}
            >
              <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
              <p className="mt-1 text-sm text-gray-700">{notification.body}</p>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
                <span>{new Date(notification.createdAt).toLocaleString()}</span>
                {!notification.isRead ? (
                  <button
                    type="button"
                    onClick={() => {
                      void markAsRead(notification.id)
                    }}
                    className="rounded-md bg-emerald-600 px-2.5 py-1 font-semibold text-white hover:bg-emerald-700"
                  >
                    Mark as read
                  </button>
                ) : (
                  <span>Read</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-gray-100 pt-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Response History</h4>
        {!isLoading && vaultThreadsWithResponses.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No response history yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {vaultThreadsWithResponses.slice(0, 5).map((thread) => {
              const latestResponse = thread.responses[thread.responses.length - 1]

              return (
                <li key={thread.id} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{thread.category}</p>
                  <p className="mt-1 text-sm text-gray-900">{thread.question}</p>
                  <p className="mt-2 text-sm text-gray-700">{latestResponse?.responseBody}</p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
                    <span>{latestResponse ? new Date(latestResponse.createdAt).toLocaleString() : ''}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                      {thread.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
