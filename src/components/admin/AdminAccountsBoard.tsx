'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import { clearAdminDraft, readAdminDraft, writeAdminDraft } from '@/components/admin/adminDraft'
import type { AdminAccountRecord } from '@/lib/admin/repository'
import type { AdminRole } from '@/lib/admin/rbac'

type FormState = {
  name: string
  email: string
  phone: string
  role: AdminRole
  isActive: boolean
  password: string
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  role: 'editor',
  isActive: true,
  password: '',
}

const ROLE_OPTIONS: AdminRole[] = ['super_admin', 'founder_admin', 'editor', 'moderator']
const DRAFT_KEY = 'admin-draft:admin-accounts'

function roleLabel(role: AdminRole) {
  return role.replace('_', ' ')
}

async function readJsonResponse(response: Response) {
  const text = await response.text()

  if (!text.trim()) {
    return {}
  }

  try {
    return JSON.parse(text) as { error?: string; account?: AdminAccountRecord; accounts?: AdminAccountRecord[] }
  } catch {
    return { error: text.slice(0, 240) }
  }
}

export default function AdminAccountsBoard({
  initialAccounts,
  currentAdminEmail,
}: {
  initialAccounts: AdminAccountRecord[]
  currentAdminEmail: string
}) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [pendingDelete, setPendingDelete] = useState<AdminAccountRecord | null>(null)

  const sortedAccounts = useMemo(
    () => [...accounts].sort((left, right) => left.email.localeCompare(right.email)),
    [accounts]
  )

  useEffect(() => {
    if (!showForm) {
      return
    }

    const draftSafeForm = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      isActive: form.isActive,
    }
    writeAdminDraft(DRAFT_KEY, { form: draftSafeForm, editId })
  }, [editId, form, showForm])

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function refresh() {
    const response = await fetch('/api/admin/admin-users', { cache: 'no-store' })
    const data = await readJsonResponse(response)

    if (!response.ok) {
      throw new Error(data.error || 'Refresh failed')
    }

    setAccounts(data.accounts ?? [])
  }

  function startCreate() {
    const draft = readAdminDraft<{ form: Omit<FormState, 'password'>; editId: string | null }>(DRAFT_KEY)
    setEditId(null)
    setForm(draft && !draft.value.editId ? { ...EMPTY_FORM, ...draft.value.form, password: '' } : EMPTY_FORM)
    setShowForm(true)
    setMessage(draft && !draft.value.editId ? `Recovered a draft from ${new Date(draft.savedAt).toLocaleString('en-NG')}.` : '')
  }

  function startEdit(account: AdminAccountRecord) {
    const draft = readAdminDraft<{ form: Omit<FormState, 'password'>; editId: string | null }>(DRAFT_KEY)
    const baseForm: FormState = {
      name: account.name ?? '',
      email: account.email,
      phone: account.phone ?? '',
      role: account.role,
      isActive: account.isActive,
      password: '',
    }

    setEditId(account.id)
    setForm(draft?.value.editId === account.id ? { ...baseForm, ...draft.value.form, password: '' } : baseForm)
    setShowForm(true)
    setMessage(draft?.value.editId === account.id ? `Recovered a draft from ${new Date(draft.savedAt).toLocaleString('en-NG')}.` : '')
  }

  function closeForm(clearDraft = true) {
    if (clearDraft) {
      clearAdminDraft(DRAFT_KEY)
    }

    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        isActive: form.isActive,
        ...(form.password ? { password: form.password } : {}),
      }

      if (!editId && !form.password) {
        throw new Error('A temporary password is required for new admin accounts.')
      }

      const response = await fetch(editId ? `/api/admin/admin-users/${editId}` : '/api/admin/admin-users', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(data.error || 'Save failed')
      }

      await refresh()
      closeForm()
      setMessage(editId ? 'Admin account updated.' : 'Admin account created.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return
    }

    setBusy(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/admin-users/${pendingDelete.id}`, { method: 'DELETE' })
      const data = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed')
      }

      await refresh()
      setPendingDelete(null)
      setMessage('Admin account deleted.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const statusTone = message.toLowerCase().includes('failed') || message.toLowerCase().includes('required') || message.toLowerCase().includes('cannot')
    ? 'error'
    : message.toLowerCase().includes('draft')
      ? 'info'
      : 'success'

  return (
    <section className="space-y-5 admin-fade-in">
      <div className="admin-surface rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900">Admin Operators</h2>
            <p className="mt-1 font-body text-sm text-slate-600">
              Super admins can manage access without touching platform member accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="admin-interactive inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 font-body text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add Admin
          </button>
        </div>
      </div>

      {message ? <AdminInlineStatus tone={statusTone} message={message} /> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="admin-surface rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-1">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {editId ? 'Edit Account' : 'New Account'}
            </p>
            <h3 className="font-heading text-xl font-bold text-slate-900">
              {editId ? 'Update admin access' : 'Create admin access'}
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input value={form.name} onChange={(event) => set('name', event.target.value)} className="input-field" />
            </Field>
            <Field label="Email *">
              <input type="email" required value={form.email} onChange={(event) => set('email', event.target.value)} className="input-field" />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={(event) => set('phone', event.target.value)} className="input-field" />
            </Field>
            <Field label="Role *">
              <select value={form.role} onChange={(event) => set('role', event.target.value as AdminRole)} className="input-field">
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={editId ? 'New password' : 'Temporary password *'}>
              <input
                type="password"
                required={!editId}
                value={form.password}
                onChange={(event) => set('password', event.target.value)}
                className="input-field"
                autoComplete="new-password"
              />
              <p className="font-body text-xs text-slate-500">
                Use at least 8 characters with uppercase, lowercase, number, and symbol.
              </p>
            </Field>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <label className="flex items-center gap-3 font-body text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => set('isActive', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                />
                Account is active
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => closeForm()}
              disabled={busy}
              className="admin-interactive rounded-full border border-slate-300 px-5 py-2.5 font-body text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="admin-interactive rounded-full bg-emerald-800 px-5 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? 'Saving...' : editId ? 'Update Admin' : 'Create Admin'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3">
        {sortedAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <p className="font-body text-sm text-slate-600">No admin accounts found.</p>
          </div>
        ) : (
          sortedAccounts.map((account) => (
            <article key={account.id} className="admin-surface rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-body text-xs font-semibold capitalize text-emerald-800">
                      {roleLabel(account.role)}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${account.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {account.email === currentAdminEmail ? (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 font-body text-xs font-semibold text-blue-700">You</span>
                    ) : null}
                  </div>
                  <h3 className="truncate font-heading text-lg font-bold text-slate-900">{account.name || account.email}</h3>
                  <p className="mt-1 truncate font-body text-sm text-slate-600">{account.email}</p>
                  <p className="mt-1 font-body text-xs text-slate-500">
                    Last login: {account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString('en-NG') : 'Not yet'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => startEdit(account)}
                    className="admin-interactive inline-flex items-center justify-center gap-1 rounded-full border border-slate-300 px-4 py-2 font-body text-xs font-semibold text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(account)}
                    disabled={busy || account.email === currentAdminEmail}
                    className="admin-interactive inline-flex items-center justify-center gap-1 rounded-full bg-rose-50 px-4 py-2 font-body text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <AdminConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete admin account"
        message={pendingDelete ? `Delete ${pendingDelete.email}? This removes their admin access immediately.` : ''}
        confirmLabel="Delete admin"
        confirmTone="danger"
        busy={busy}
        onCancel={() => {
          if (!busy) {
            setPendingDelete(null)
          }
        }}
        onConfirm={() => {
          void confirmDelete()
        }}
      />
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  )
}
