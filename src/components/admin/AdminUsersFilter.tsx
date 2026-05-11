'use client'

import { useEffect, useState } from 'react'

interface AdminUsersFilterProps {
  onFilterChange: (filters: {
    search: string
    status: string
    role: string
  }) => void
}

/**
 * Component for filtering users
 */
export default function AdminUsersFilter({ onFilterChange }: AdminUsersFilterProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onFilterChange({ search, status, role })
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [onFilterChange, role, search, status])

  const handleReset = () => {
    setSearch('')
    setStatus('')
    setRole('')
    onFilterChange({ search: '', status: '', role: '' })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Filter Set</p>
          <p className="font-body text-sm text-slate-600">Narrow users by identity, status, and role.</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-slate-300 px-3 py-2 font-body text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Search user
          </label>
          <input
            type="text"
            placeholder="Email or name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-body text-sm text-slate-700"
          />
        </div>

        <div>
          <label className="mb-2 block font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Account status
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-body text-sm text-slate-700"
          >
            <option value="">All Users</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Platform role
          </label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-body text-sm text-slate-700"
          >
            <option value="">All Roles</option>
            <option value="member">Member</option>
            <option value="contributor">Contributor</option>
            <option value="verified_healer">Verified Healer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </section>
  )
}
