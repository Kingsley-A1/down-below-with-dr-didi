'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

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
  const [activePanel, setActivePanel] = useState<'inbox' | 'history'>('inbox')

  const vaultNotifications = useMemo(
    () => notifications.filter((item) => item.type === 'vault_response'),
    [notifications]
  )

  const vaultThreadsWithResponses = useMemo(
    () => threads.filter((thread) => thread.responses.length > 0),
    [threads]
  )

  const totalThreadCount = threads.length
  const respondedThreadCount = vaultThreadsWithResponses.length
  const pendingThreadCount = Math.max(totalThreadCount - respondedThreadCount, 0)

  const hasActivity = vaultNotifications.length > 0 || totalThreadCount > 0

  const fetchNotifications = useCallback(async () => {
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

      setNotifications(notificationsResult.notifications || [])
      setUnreadCount(notificationsResult.unreadCount || 0)
      setThreads(threadsResult.threads || [])
      setError(null)
      setLastUpdatedAt(new Date())
    } catch {
      setError('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function safeFetch() {
      if (cancelled) {
        return
      }

      await fetchNotifications()
    }

    void safeFetch()
    const intervalId = setInterval(() => {
      void safeFetch()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [fetchNotifications])

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
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">V-Vault Inbox</h3>
          <p className="text-sm text-gray-600">
            {isLoading
              ? 'Checking for responses...'
              : `${unreadCount} unread response${unreadCount === 1 ? '' : 's'} • ${totalThreadCount} submission${totalThreadCount === 1 ? '' : 's'}${lastUpdatedAt ? ` • updated ${lastUpdatedAt.toLocaleTimeString()}` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
              New response
            </span>
          ) : null}
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() => {
              void fetchNotifications()
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setActivePanel('inbox')}
          className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
            activePanel === 'inbox'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Latest Responses ({vaultNotifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActivePanel('history')}
          className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
            activePanel === 'history'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Conversation History ({totalThreadCount})
        </button>
      </div>

      {!isLoading ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
            Responded threads: {respondedThreadCount}
          </p>
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Awaiting response: {pendingThreadCount}
          </p>
        </div>
      ) : null}

      {!isLoading && !hasActivity ? (
        <p className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          No V-Vault activity yet. Once you submit an anonymous message, your thread will appear here immediately.
        </p>
      ) : null}

      {activePanel === 'inbox' ? (
        <ul className="mt-4 space-y-3">
          {vaultNotifications.slice(0, 6).map((notification) => (
            <li
              key={notification.id}
              className={`rounded-lg border p-3 ${notification.isRead ? 'border-gray-200 bg-gray-50' : 'border-emerald-200 bg-emerald-50'}`}
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
      ) : (
        <ul className="mt-4 space-y-3">
          {threads.slice(0, 6).map((thread) => {
            const latestResponse = thread.responses[thread.responses.length - 1]
            const isPending = !latestResponse

            return (
              <li key={thread.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {thread.category}
                  </p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    {thread.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-gray-900">{thread.question}</p>
                <p className="mt-2 line-clamp-3 text-sm text-gray-700">
                  {latestResponse?.responseBody || 'Awaiting response from Dr. Didi. You will be notified as soon as a reply is available.'}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {isPending
                    ? `Submitted ${new Date(thread.createdAt).toLocaleString()}`
                    : `Responded ${new Date(latestResponse.createdAt).toLocaleString()}`}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
