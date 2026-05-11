'use client'

import { useState } from 'react'
import Image from 'next/image'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import type { GalleryImageRecord, GalleryImageCategory } from '@/lib/admin/repository'
import { uploadAdminMediaAsset } from '@/components/admin/media-upload'

type Status = 'draft' | 'published' | 'archived'

const CATEGORIES: GalleryImageCategory[] = ['outreach', 'event', 'team', 'community', 'facility']
const STATUS_OPTIONS: Status[] = ['draft', 'published', 'archived']

const CATEGORY_BADGE: Record<GalleryImageCategory, { bg: string; text: string }> = {
  outreach:  { bg: '#dcfce7', text: '#166534' },
  event:     { bg: '#fce7f3', text: '#be185d' },
  team:      { bg: '#dbeafe', text: '#1e40af' },
  community: { bg: '#fef9c3', text: '#854d0e' },
  facility:  { bg: '#ede9fe', text: '#7c3aed' },
}

const EMPTY_FORM = {
  slug: '',
  title: '',
  description: '',
  caption: '',
  imageUrl: '',
  imageAlt: '',
  category: 'outreach' as GalleryImageCategory,
  eventName: '',
  location: '',
  capturedAt: '',
  sortOrder: 0,
  status: 'published' as Status,
}

type FormState = typeof EMPTY_FORM

function getTone(message: string) {
  const value = message.toLowerCase()

  if (value.includes('failed') || value.includes('required') || value.includes('cannot')) {
    return 'error' as const
  }

  return 'success' as const
}

export default function GalleryImagesBoard({
  initialImages,
  hideHeader = false,
}: {
  initialImages: GalleryImageRecord[]
  hideHeader?: boolean
}) {
  const [images, setImages] = useState(initialImages)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [filter, setFilter] = useState<GalleryImageCategory | 'all'>('all')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  async function refresh() {
    const res = await fetch('/api/admin/gallery', { cache: 'no-store' })
    const data = await res.json()
    setImages(data.images ?? [])
  }

  function startCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setShowForm(true)
    setMsg('')
  }

  function startEdit(img: GalleryImageRecord) {
    setEditId(img.id)
    setForm({
      slug: img.slug,
      title: img.title,
      description: img.description,
      caption: img.caption ?? '',
      imageUrl: img.imageUrl,
      imageAlt: img.imageAlt,
      category: img.category as GalleryImageCategory,
      eventName: img.eventName ?? '',
      location: img.location ?? '',
      capturedAt: img.capturedAt ? new Date(img.capturedAt).toISOString().slice(0, 16) : '',
      sortOrder: img.sortOrder,
      status: img.status as Status,
    })
    setImageFile(null)
    setShowForm(true)
    setMsg('')
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
  }

  function set(field: keyof FormState, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')

    if (!editId && !imageFile) {
      setBusy(false)
      setMsg('Image upload is required for new gallery records.')
      return
    }

    let nextImageUrl = form.imageUrl

    if (imageFile) {
      setUploadingImage(true)

      try {
        const upload = await uploadAdminMediaAsset(
          imageFile,
          `${form.title || 'Gallery image'} upload`,
          form.imageAlt || form.title
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
      setMsg('A gallery image is required before saving.')
      return
    }

    const url = editId ? `/api/admin/gallery/${editId}` : '/api/admin/gallery'
    const method = editId ? 'PUT' : 'POST'
    const payload = {
      ...form,
      imageUrl: nextImageUrl,
      capturedAt: form.capturedAt ? new Date(form.capturedAt).toISOString() : undefined,
    }
    const body = editId ? { ...payload, id: editId } : payload

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

    setMsg(editId ? 'Image updated.' : 'Image added.')
    await refresh()
    cancelForm()
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setBusy(true)
    setMsg('')

    const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' })
    const data = await res.json()
    setBusy(false)

    if (!res.ok) {
      setMsg(data.error ?? 'Delete failed')
      return
    }

    setMsg('Image deleted.')
    await refresh()
  }

  const visible = filter === 'all' ? images : images.filter((i) => i.category === filter)

  return (
    <section className="space-y-6">
      {!hideHeader ? (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-white p-6 sm:flex-row sm:items-center" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h1 className="mb-1 font-heading text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>Gallery Images</h1>
            <p className="font-body text-sm text-gray-500">Manage public gallery images, categories, and publication status.</p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="self-start whitespace-nowrap rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:self-auto"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            + Add Image
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
            + Add Image
          </button>
        </div>
      )}

      {msg ? <AdminInlineStatus tone={getTone(msg)} message={msg} /> : null}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {editId ? 'Edit Image' : 'Add Gallery Image'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title (min 5 chars) *">
              <input value={form.title} onChange={(e) => set('title', e.target.value)} required minLength={5} className="input-field" />
            </Field>
            <Field label="Slug *">
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} required pattern="[a-z0-9-]+" className="input-field" />
            </Field>
            <Field label="Upload Image">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="input-field"
              />
              <p className="font-body text-xs text-gray-400 mt-1">
                {imageFile
                  ? `Selected: ${imageFile.name}`
                  : editId
                    ? 'Upload a new file to replace the current gallery image.'
                    : 'Required: upload image from media pipeline.'}
              </p>
            </Field>
            <Field label="Image Alt *">
              <input value={form.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} required minLength={5} className="input-field" />
            </Field>
            <Field label="Category *">
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-field">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input-field">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Event Name">
              <input value={form.eventName} onChange={(e) => set('eventName', e.target.value)} className="input-field" />
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={(e) => set('location', e.target.value)} className="input-field" />
            </Field>
            <Field label="Captured At">
              <input type="datetime-local" value={form.capturedAt} onChange={(e) => set('capturedAt', e.target.value)} className="input-field" />
            </Field>
            <Field label="Sort Order">
              <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className="input-field" />
            </Field>
            <Field label="Caption">
              <input value={form.caption} onChange={(e) => set('caption', e.target.value)} className="input-field" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description (min 40 chars) *">
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
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
                {uploadingImage ? 'Uploading image…' : busy ? 'Saving…' : editId ? 'Update Image' : 'Add Image'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className="font-body text-sm font-medium px-4 py-1.5 rounded-full transition-colors capitalize"
            style={{
              backgroundColor: filter === cat ? 'var(--color-primary)' : 'var(--color-primary-muted)',
              color: filter === cat ? '#fff' : 'var(--color-primary)',
            }}
          >
            {cat}
          </button>
        ))}
        <span className="font-body text-xs text-gray-400 ml-2">{visible.length} image{visible.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <p className="font-body text-sm text-gray-400">No images yet. Click &quot;+ Add Image&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((img) => {
            const badge = CATEGORY_BADGE[img.category as GalleryImageCategory]
            return (
              <div key={img.id} className="group relative bg-white rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
                <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                  <Image
                    src={img.imageUrl}
                    alt={img.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {img.category}
                    </span>
                    <StatusBadge status={img.status as Status} />
                  </div>
                  <p className="font-body text-sm font-semibold line-clamp-2" style={{ color: 'var(--color-text)' }}>{img.title}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => startEdit(img)}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(img.id, img.title)}
                      disabled={busy}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
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
