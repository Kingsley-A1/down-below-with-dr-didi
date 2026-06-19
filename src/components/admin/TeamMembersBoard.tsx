'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import AdminUploadPreview from '@/components/admin/AdminUploadPreview'
import { getAdminStatusTone } from '@/components/admin/adminStatusTone'
import type { TeamMemberRecord } from '@/lib/admin/repository'
import { clearAdminDraft, readAdminDraft, writeAdminDraft } from '@/components/admin/adminDraft'
import { uploadAdminMediaAsset } from '@/components/admin/media-upload'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'

type Tier = 'founder' | 'leadership' | 'core'
type Status = 'draft' | 'published' | 'archived'

const TIER_OPTIONS: Tier[] = ['founder', 'leadership', 'core']
const STATUS_OPTIONS: Status[] = ['draft', 'published', 'archived']
const TEAM_NEW_DRAFT_KEY = 'admin-draft:team:new'

function teamEditDraftKey(id: string) {
  return `admin-draft:team:${id}`
}

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

function getTone(message: string) {
  return getAdminStatusTone(message)
}

export default function TeamMembersBoard({
  initialMembers,
  hideHeader = false,
}: {
  initialMembers: TeamMemberRecord[]
  hideHeader?: boolean
}) {
  const [members, setMembers] = useState(initialMembers)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [slugManual, setSlugManual] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const previewUrl = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile)
    }

    return form.imageUrl || ''
  }, [form.imageUrl, imageFile])

  useEffect(() => {
    return () => {
      if (imageFile && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [imageFile, previewUrl])

  useEffect(() => {
    if (!showForm) {
      return
    }

    writeAdminDraft(editId ? teamEditDraftKey(editId) : TEAM_NEW_DRAFT_KEY, form)
  }, [editId, form, showForm])

  async function refresh() {
    const res = await fetch('/api/admin/team', { cache: 'no-store' })
    const data = await readJsonResponse<{ members?: TeamMemberRecord[] }>(res)
    if (!res.ok) {
      setMsg(parseApiError(data, 'Refresh failed').message)
      return
    }
    setMembers(data?.members ?? [])
  }

  function startCreate() {
    const draft = readAdminDraft<FormState>(TEAM_NEW_DRAFT_KEY)
    setEditId(null)
    setForm(draft?.value ?? EMPTY_FORM)
    setImageFile(null)
    setSlugManual(false)
    setShowForm(true)
    setFieldErrors({})
    setMsg(draft ? `Recovered a team draft from ${new Date(draft.savedAt).toLocaleString('en-NG')}.` : '')
  }

  function startEdit(member: TeamMemberRecord) {
    const draftKey = teamEditDraftKey(member.id)
    const draft = readAdminDraft<FormState>(draftKey)
    setEditId(member.id)
    const nextForm = {
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
    }
    setForm(draft?.value ?? nextForm)
    setImageFile(null)
    setShowForm(true)
    setFieldErrors({})
    setMsg(draft ? `Recovered a team draft from ${new Date(draft.savedAt).toLocaleString('en-NG')}.` : '')
  }

  function cancelForm() {
    clearAdminDraft(editId ? teamEditDraftKey(editId) : TEAM_NEW_DRAFT_KEY)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setSlugManual(false)
    setFieldErrors({})
    setMsg('')
  }

  function set(field: keyof FormState, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    setFieldErrors({})

    if (!editId && !imageFile) {
      setBusy(false)
      setMsg('Image upload is required for new team members.')
      return
    }

    let nextImageUrl = form.imageUrl

    if (imageFile) {
      setUploadingImage(true)

      try {
        const upload = await uploadAdminMediaAsset(
          imageFile,
          `${form.name || 'Team member'} profile image`,
          form.imageAlt || form.name
        )
        nextImageUrl = upload.url
      } catch (error) {
        setBusy(false)
        setUploadingImage(false)
        setMsg(error instanceof Error ? error.message : 'Image upload failed')
        return
      }

      setUploadingImage(false)
    }

    if (!nextImageUrl) {
      setBusy(false)
      setMsg('A team profile image is required before saving.')
      return
    }

    const url = editId ? `/api/admin/team/${editId}` : '/api/admin/team'
    const method = editId ? 'PUT' : 'POST'
    const payload = {
      ...form,
      imageUrl: nextImageUrl,
      imageAlt: form.imageAlt || form.name,
    }
    const body = editId ? { ...payload, id: editId } : payload

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await readJsonResponse(res)
    setBusy(false)

    if (!res.ok) {
      const parsed = parseApiError(data, 'Save failed')
      setFieldErrors(
        Object.fromEntries(
          Object.entries(parsed.fieldErrors).map(([field, messages]) => [field, messages[0] ?? ''])
        )
      )
      setMsg(parsed.message)
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
    const data = await readJsonResponse(res)
    setBusy(false)

    if (!res.ok) {
      setMsg(parseApiError(data, 'Delete failed').message)
      return
    }

    setMsg('Member deleted.')
    await refresh()
  }

  return (
    <section className="space-y-6">
      {!hideHeader ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h1 className="mb-1 font-heading text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>Team Members</h1>
            <p className="font-body text-sm text-gray-500">Manage public team profiles and publishing state.</p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            + Add Member
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            + Add Member
          </button>
        </div>
      )}

      {msg ? <AdminInlineStatus tone={getTone(msg)} message={msg} /> : null}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {editId ? 'Edit Member' : 'Add New Member'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name *" error={fieldErrors.name}>
              <input
                value={form.name}
                onChange={(e) => {
                  set('name', e.target.value)
                  if (!slugManual && !editId) {
                    set('slug', slugify(e.target.value))
                  }
                }}
                required
                className="input-field"
              />
            </Field>
            <Field label="URL Slug" error={fieldErrors.slug}>
              {editId ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <code className="flex-1 font-mono text-xs text-slate-700">{form.slug}</code>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-body text-[10px] font-semibold text-amber-700">locked — editing breaks public URLs</span>
                </div>
              ) : slugManual ? (
                <div className="flex items-center gap-2">
                  <input
                    value={form.slug}
                    onChange={(e) => set('slug', e.target.value)}
                    required
                    pattern="[a-z0-9\-]+"
                    title="Lowercase letters, numbers, hyphens only"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => { setSlugManual(false); set('slug', slugify(form.name)) }}
                    className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 font-body text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Auto
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <code className="flex-1 font-mono text-xs text-slate-500">{form.slug || '— will be generated from name'}</code>
                  <button
                    type="button"
                    onClick={() => setSlugManual(true)}
                    className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1 font-body text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                </div>
              )}
            </Field>
            <Field label="Role *" error={fieldErrors.role}>
              <input value={form.role} onChange={(e) => set('role', e.target.value)} required className="input-field" />
            </Field>
            <Field label="Tier *" error={fieldErrors.tier}>
              <select value={form.tier} onChange={(e) => set('tier', e.target.value)} className="input-field">
                {TIER_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Sort Order" error={fieldErrors.sortOrder}>
              <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className="input-field" />
            </Field>
            <Field label="Status" error={fieldErrors.status}>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input-field">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Credentials" error={fieldErrors.credentials}>
              <input value={form.credentials} onChange={(e) => set('credentials', e.target.value)} className="input-field" />
            </Field>
            <Field label="Upload Image" error={fieldErrors.imageUrl}>
              <div className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                <Camera className="h-3.5 w-3.5" />
                <span>Camera</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="input-field"
              />
              {previewUrl ? (
                <AdminUploadPreview
                  title={form.name || 'Team member'}
                  eyebrow="Public team preview"
                  description={form.bio || 'Team member bio will appear here.'}
                  mediaUrl={previewUrl}
                  mediaType="image"
                  altText={form.imageAlt || form.name}
                  meta={[form.role, form.tier, form.status]}
                  publicHref="/team"
                  className="mt-3"
                />
              ) : null}
              <p className="font-body text-xs text-gray-400 mt-1">
                {imageFile
                  ? `Selected: ${imageFile.name}`
                  : editId
                    ? 'Upload a new image to replace the current team photo.'
                    : 'Required: upload image from media pipeline.'}
              </p>
            </Field>
            <Field label="Image Alt" error={fieldErrors.imageAlt}>
              <input value={form.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} className="input-field" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Bio (min 40 chars) *" error={fieldErrors.bio}>
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
                disabled={busy || uploadingImage}
                className="font-body text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {uploadingImage ? 'Uploading image…' : busy ? 'Saving…' : editId ? 'Update Member' : 'Create Member'}
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
                        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
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
                    <td className="px-4 py-3 text-gray-500 max-w-50 truncate">{m.role}</td>
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

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      {children}
      {error ? <span className="block font-body text-xs text-red-600">{error}</span> : null}
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
