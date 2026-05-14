'use client'

import Link from 'next/link'
import { PublicUserRecord } from '@/lib/admin/user-repository'
import { formatDistanceToNow } from 'date-fns'

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'super_admin':     return 'bg-violet-100 text-violet-800'
    case 'founder_admin':   return 'bg-rose-100 text-rose-700'
    case 'editor':          return 'bg-sky-100 text-sky-700'
    case 'moderator':       return 'bg-amber-100 text-amber-700'
    case 'contributor':     return 'bg-teal-100 text-teal-700'
    case 'verified_healer': return 'bg-emerald-100 text-emerald-800'
    default:                return 'bg-slate-100 text-slate-700'
  }
}

interface UsersTableProps {
  users: PublicUserRecord[]
  isLoading?: boolean
  onUserClick?: (userId: string) => void
}

/**
 * Component to display users in a table format
 */
export default function UsersTable({ users, isLoading = false, onUserClick }: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="font-heading text-xl font-bold text-slate-900">No users found</p>
        <p className="mt-2 font-body text-sm text-slate-600">Try adjusting your filters or clear all constraints.</p>
      </section>
    )
  }

  const handleRowClick = (userId: string) => {
    onUserClick?.(userId)
  }

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, userId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleRowClick(userId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 lg:hidden">
        {users.map((user) => (
          <article
            key={user.id}
            className="admin-surface rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className={`rounded-full px-2.5 py-0.5 font-body text-[10px] font-semibold capitalize ${getRoleBadgeClass(user.role)}`}>
                  {user.role.replace(/_/g, ' ')}
                </span>
                <p className="mt-1 font-body text-sm font-semibold text-slate-900">{user.displayName}</p>
                <p className="font-body text-xs text-slate-600">{user.email}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${
                  user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{user.emailVerified ? 'Email verified' : 'Email pending'}</span>
              <span>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
            </div>

            <div className="mt-3 flex justify-end">
              <Link
                href={`/admin/users/${user.id}`}
                className="admin-interactive rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-body text-xs font-semibold text-emerald-800"
              >
                View details
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="min-w-full divide-y divide-slate-200">
          <caption className="sr-only">User management table</caption>
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Email Verified
              </th>
              <th scope="col" className="px-6 py-3 text-left font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Joined
              </th>
              <th scope="col" className="px-6 py-3 text-left font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {users.map((user) => (
              <tr
                key={user.id}
                tabIndex={0}
                role="button"
                aria-label={`Open ${user.displayName} details`}
                className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-inset"
                onClick={() => handleRowClick(user.id)}
                onKeyDown={(event) => handleRowKeyDown(event, user.id)}
              >
                <td className="whitespace-nowrap px-6 py-4 font-body text-sm font-semibold text-slate-900">
                  {user.email}
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-body text-sm text-slate-600">
                  {user.displayName}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`rounded-full px-3 py-1 font-body text-xs font-semibold capitalize ${getRoleBadgeClass(user.role)}`}>
                    {user.role.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${
                      user.emailVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {user.emailVerified ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 font-body text-sm text-slate-600">
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="admin-interactive font-body text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
