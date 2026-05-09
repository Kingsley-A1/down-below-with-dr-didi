'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminUsersFilter from './AdminUsersFilter'
import UsersTable from './UsersTable'
import { PublicUserRecord } from '@/lib/admin/user-repository'

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
  const fetchUsers = async () => {
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

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users || [])
      setPagination(data.pagination)
    } catch (err) {
      setError((err as Error).message)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch users on mount and when filters/pagination changes
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [filters])

  useEffect(() => {
    fetchUsers()
  }, [currentPage, filters])

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  return (
    <div className="space-y-6">
      <AdminUsersFilter onFilterChange={handleFilterChange} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <UsersTable users={users} isLoading={isLoading} />

      {/* Pagination Controls */}
      {!isLoading && pagination.total > 0 && (
        <div className="flex items-center justify-between bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
            {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
            {pagination.total} users
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Page {currentPage}</span>
            </div>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!pagination.hasMore}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
