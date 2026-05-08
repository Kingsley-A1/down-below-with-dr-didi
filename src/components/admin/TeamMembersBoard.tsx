'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { TeamMemberRecord } from '@/lib/admin/repository'

type Tier = 'founder' | 'leadership' | 'core'
type Status = 'draft' | 'published' | 'archived'

const TIER_OPTIONS: Tier[] = ['founder', 'leadership', 'core']
const STATUS_OPTIONS: Status[] = ['draft', 'published', 'archived']

const EMPTY_FORM = {
  name: '',
  slug: '',
  role: '',
  tier: 'core' as Tier,
  sortOrder: 0,
  credentials: '',
  bio: '',
  imageUrl: '',
  imageAlt: '',
  status: 'published' as Status,
}

type FormState = typeof EMPTY_FORM

export default function TeamMembersBoard({ initialMembers }: { initialMembers: TeamMemberRecord[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  async function refresh() {
    const res = await fetch('/api/admin/team', { cache: 'no-store' })
    const data = await res.json()
    setMembers(data.members ?? [])
  }

  function startCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setMsg('')
  }

  function startEdit(member: TeamMemberRecord) {
    setEditId(member.id)
    setForm({
      name: member.name,
      slug: member.slug,
      role: member.role,
      tier: member.tier as Tier,
      sortOrder: member.sortOrder,
      credentials: member.credentials ?? '',
      bio: member.bio,
      imageUrl: member.imageUrl ?? '',
      imageAlt: member.imageAlt ?? '',
      status: member.status as Status,
    })
    setShowForm(true)
    setMsg('')
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setMsg('')
  }

  function set(field: keyof FormState, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')

    const url = editId ? `/api/admin/team/${editId}` : '/api/admin/team'
    const method = editId ? 'PUT' : 'POST'
    const body = editId ? { ...form, id: editId } : form

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setBusy(false)

    if (!res.ok) {
      setMsg(data.error ?? 'Save failed')
      return
    }

    setMsg(editId ? 'Member updated.' : 'Member created.')
    await refresh()
    cancelForm()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setBusy(true)
    setMsg('')

    const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' })
    const data = await res.json()
    setBusy(false)

    if (!res.ok) {
      setMsg(data.error ?? 'Delete failed')
      return
    }

    setMsg('Member deleted.')
    await refresh()
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border p-6 flex items-center justify-between gap-4" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>Team Members</h1>
          <p className="font-body text-sm text-gray-500">Manage the public team directory. Drag sortOrder to reorder.</p>
        </div>
        <button
          onClick={startCreate}
          className="font-body text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          + Add Member
        </button>
      </div>

      {msg && (
        <p className="font-body text-sm px-4 py-2 rounded-lg bg-blue-50 text-blue-700">{msg}</p>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {editId ? 'Edit Member' : 'Add New Member'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name *">
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required className="input-field" />
            </Field>
            <Field label="Slug *">
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} required pattern="[a-z0-9-]+" title="Lowercase letters, numbers, hyphens only" className="input-field" />
            </Field>
            <Field label="Role *">
              <input value={form.role} onChange={(e) => set('role', e.target.value)} required className="input-field" />
            </Field>
            <Field label="Tier *">
              <select value={form.tier} onChange={(e) => set('tier', e.target.value)} className="input-field">
                {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Sort Order">
              <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className="input-field" />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input-field">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Credentials">
              <input value={form.credentials} onChange={(e) => set('credentials', e.target.value)} className="input-field" />
            </Field>
            <Field label="Image URL">
              <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} className="input-field" />
            </Field>
            <Field label="Image Alt">
              <input value={form.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} className="input-field" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Bio (min 40 chars) *">
                <textarea
                  value={form.bio}
                  onChange={(e) => set('bio', e.target.value)}
                  required
                  minLength={40}
                  rows={4}
                  className="input-field"
                />
              </Field>
            </div>

            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={cancelForm} className="font-body text-sm px-5 py-2.5 rounded-xl border transition-colors" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="font-body text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {busy ? 'Saving…' : editId ? 'Update Member' : 'Create Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-body text-sm text-gray-400">No team members yet. Click &quot;Add Member&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <th className="px-4 py-3 font-semibold text-gray-500">Order</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Photo</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Tier</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Role</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-gray-400">{m.sortOrder}</td>
                    <td className="px-4 py-3">
                      {m.imageUrl ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          <Image src={m.imageUrl} alt={m.imageAlt ?? m.name} fill className="object-cover object-top" sizes="40px" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: 'var(--color-primary)' }}>
                          {m.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>{m.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                        {m.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{m.role}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status as Status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(m)} className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(m.id, m.name)} disabled={busy} className="text-xs font-semibold px-3 py-1 rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, { bg: string; text: string }> = {
    published: { bg: '#dcfce7', text: '#166534' },
    draft:     { bg: '#fef9c3', text: '#854d0e' },
    archived:  { bg: '#f3f4f6', text: '#6b7280' },
  }
  const s = styles[status]
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: s.bg, color: s.text }}>
      {status}
    </span>
  )
}
