'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import AdminUsersFilter from './AdminUsersFilter'
import UsersTable from './UsersTable'
import type { PublicUserRecord } from '@/lib/admin/user-repository'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'

interface PaginationData {
  limit: number
  offset: number
  total: number
  hasMore: boolean
}

/**
 * Client component for admin users list with filtering and pagination
 */
export default function AdminUsersListClient() {
  const router = useRouter()
  const requestIdRef = useRef(0)
  const [users, setUsers] = useState<PublicUserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData>({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false,
  })

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: '',
  })

  // Fetch users with current filters and pagination
  const fetchUsers = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('limit', '50')
      params.append('offset', String((currentPage - 1) * 50))

      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.role) params.append('role', filters.role)

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await readJsonResponse<{
        users?: PublicUserRecord[]
        pagination?: PaginationData
      }>(response)

      if (requestId !== requestIdRef.current) {
        return
      }

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/sign-in')
          return
        }

        if (response.status === 403) {
          router.push('/admin')
          return
        }
        throw new Error(parseApiError(data, 'Failed to fetch users').message)
      }

      setUsers(data?.users || [])
      if (data?.pagination) {
        setPagination(data.pagination)
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return
      }

      setError((err as Error).message)
      setUsers([])
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [currentPage, filters, router])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUsers()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [fetchUsers])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingContext = Boolean(
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      )

      if (isTypingContext) {
        return
      }

      if (event.key === '[' && currentPage > 1) {
        event.preventDefault()
        setCurrentPage((page) => Math.max(1, page - 1))
      }

      if (event.key === ']' && pagination.hasMore) {
        event.preventDefault()
        setCurrentPage((page) => page + 1)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [currentPage, pagination.hasMore])

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setCurrentPage(1)
    setFilters(newFilters)
  }, [])

  return (
    <div className="space-y-6 admin-fade-in">
      <AdminUsersFilter onFilterChange={handleFilterChange} />

      {error ? <AdminInlineStatus tone="error" message={error} /> : null}

      <UsersTable users={users} isLoading={isLoading} />

      {/* Pagination Controls */}
      {!isLoading && pagination.total > 0 && (
        <div className="admin-surface flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="font-body text-sm text-slate-600">
            Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
            {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
            {pagination.total} users
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="admin-interactive rounded-lg border border-slate-300 px-4 py-2 font-body text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="min-w-20 text-center font-body text-sm text-slate-600">Page {currentPage}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!pagination.hasMore}
              className="admin-interactive rounded-lg border border-slate-300 px-4 py-2 font-body text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
