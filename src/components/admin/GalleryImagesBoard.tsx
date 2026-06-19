'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, ImageOff, Video } from 'lucide-react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import AdminUploadPreview from '@/components/admin/AdminUploadPreview'
import { getAdminStatusTone } from '@/components/admin/adminStatusTone'
import type { GalleryImageRecord, GalleryImageCategory, GalleryMediaType } from '@/lib/admin/repository'
import { deriveMediaLabel, uploadAdminMediaAsset } from '@/components/admin/media-upload'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'

type Status = 'draft' | 'published' | 'archived'

const CATEGORIES: GalleryImageCategory[] = ['outreach', 'event', 'team', 'community', 'facility']
const STATUS_OPTIONS: Status[] = ['draft', 'published', 'archived']
const MEDIA_TYPES: GalleryMediaType[] = ['image', 'video']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 200 * 1024 * 1024
const ACCEPTED_BY_TYPE: Record<GalleryMediaType, string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif,image/avif',
  video: 'video/mp4,video/webm',
}

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
  mediaType: 'image' as GalleryMediaType,
  featured: false,
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

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function autoGalleryDescription(title: string) {
  const cleanTitle = title.trim() || 'this gallery moment'
  return `Gallery highlight from DownBelow Family Health Initiative showing ${cleanTitle.toLowerCase()} as part of our public education, care, and outreach work.`
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
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [slugManual, setSlugManual] = useState(false)
  const [openingEditId, setOpeningEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLDivElement | null>(null)
  const previewUrl = useMemo(() => {
    if (mediaFile) {
      return URL.createObjectURL(mediaFile)
    }

    return form.imageUrl || ''
  }, [form.imageUrl, mediaFile])

  useEffect(() => {
    return () => {
      if (mediaFile && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [mediaFile, previewUrl])

  useEffect(() => {
    if (!showForm) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setOpeningEditId(null)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [showForm, editId])

  async function refresh() {
    const res = await fetch('/api/admin/gallery', { cache: 'no-store' })
    const data = await readJsonResponse<{ images?: GalleryImageRecord[] }>(res)
    if (!res.ok) {
      setMsg(parseApiError(data, 'Refresh failed').message)
      return
    }
    setImages(data?.images ?? [])
  }

  function startCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setMediaFile(null)
    setSlugManual(false)
    setShowForm(true)
    setFieldErrors({})
    setMsg('')
  }

  function startEdit(img: GalleryImageRecord) {
    setOpeningEditId(img.id)
    setEditId(img.id)
    setForm({
      slug: img.slug,
      title: img.title,
      description: img.description,
      caption: img.caption ?? '',
      mediaType: img.mediaType,
      featured: img.featured,
      imageUrl: img.imageUrl,
      imageAlt: img.imageAlt,
      category: img.category as GalleryImageCategory,
      eventName: img.eventName ?? '',
      location: img.location ?? '',
      capturedAt: img.capturedAt ? new Date(img.capturedAt).toISOString().slice(0, 16) : '',
      sortOrder: img.sortOrder,
      status: img.status as Status,
    })
    setMediaFile(null)
    setShowForm(true)
    setFieldErrors({})
    setMsg('')
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setMediaFile(null)
    setSlugManual(false)
    setFieldErrors({})
  }

  function set(field: keyof FormState, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function selectMediaFile(file: File | null) {
    if (!file) {
      return
    }

    const nextType: GalleryMediaType = file.type.startsWith('video/') ? 'video' : 'image'
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setMsg('Choose an image or video file.')
      return
    }

    const maxBytes = nextType === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
    if (file.size > maxBytes) {
      setMsg(nextType === 'video' ? 'This video is larger than 200 MB.' : 'This image is larger than 10 MB.')
      return
    }

    const title = deriveMediaLabel(file.name)
    setMediaFile(file)
    setForm((prev) => {
      const nextTitle = prev.title || title
      return {
        ...prev,
        mediaType: nextType,
        title: nextTitle,
        slug: prev.slug || slugify(nextTitle),
        imageAlt: prev.imageAlt || nextTitle,
        caption: prev.caption || nextTitle,
        description: prev.description || autoGalleryDescription(nextTitle),
      }
    })
    setMsg('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    setFieldErrors({})

    if (!editId && !mediaFile) {
      setBusy(false)
      setMsg('Media upload is required for new gallery records.')
      return
    }

    let nextImageUrl = form.imageUrl

    if (mediaFile) {
      setUploadingImage(true)

      try {
        const upload = await uploadAdminMediaAsset(
          mediaFile,
          `${form.title || 'Gallery media'} upload`,
          form.imageAlt || form.title,
          {
            gallery: !editId
              ? {
                  slug: form.slug,
                  title: form.title,
                  description: form.description,
                  caption: form.caption,
                  mediaType: form.mediaType,
                  featured: form.featured,
                  imageAlt: form.imageAlt,
                  category: form.category,
                  eventName: form.eventName,
                  location: form.location,
                  capturedAt: form.capturedAt ? new Date(form.capturedAt).toISOString() : '',
                  sortOrder: form.sortOrder,
                  status: form.status,
                }
              : undefined,
          }
        )
        nextImageUrl = upload.url

        if (!editId && upload.gallery) {
          setUploadingImage(false)
          setBusy(false)
          setMsg('Gallery media added.')
          await refresh()
          cancelForm()
          return
        }
      } catch (error) {
        setBusy(false)
        setUploadingImage(false)
        setMsg(error instanceof Error ? error.message : 'Media upload failed')
        return
      }

      setUploadingImage(false)
    }

    if (!nextImageUrl) {
      setBusy(false)
      setMsg('A gallery media file is required before saving.')
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

    setMsg(editId ? 'Gallery media updated.' : 'Gallery media added.')
    await refresh()
    cancelForm()
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setDeletingId(deleteTarget.id)
    setMsg('')

    const res = await fetch(`/api/admin/gallery/${deleteTarget.id}`, { method: 'DELETE' })
    const data = await readJsonResponse(res)
    setDeletingId(null)

    if (!res.ok) {
      setMsg(parseApiError(data, 'Delete failed').message)
      return
    }

    setMsg('Gallery media deleted.')
    setDeleteTarget(null)
    await refresh()
  }

  const visible = filter === 'all' ? images : images.filter((i) => i.category === filter)

  return (
    <section className="space-y-6">
      {!hideHeader ? (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-white p-6 sm:flex-row sm:items-center" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h1 className="mb-1 font-heading text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>Gallery Media</h1>
            <p className="font-body text-sm text-gray-500">Manage public gallery images, videos, categories, and publication status.</p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="self-start whitespace-nowrap rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:self-auto"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            + Add Media
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
            + Add Media
          </button>
        </div>
      )}

      {msg ? <AdminInlineStatus tone={getTone(msg)} message={msg} /> : null}

      {/* Add/Edit Form */}
      {showForm && (
        <div ref={formRef} className="scroll-mt-24 bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {editId ? 'Edit Gallery Media' : 'Add Gallery Media'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title (min 5 chars) *" error={fieldErrors.title}>
              <input
                value={form.title}
                onChange={(e) => {
                  set('title', e.target.value)
                  if (!slugManual && !editId) {
                    set('slug', slugify(e.target.value))
                  }
                }}
                required
                minLength={5}
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
                    onClick={() => { setSlugManual(false); set('slug', slugify(form.title)) }}
                    className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 font-body text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Auto
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <code className="flex-1 font-mono text-xs text-slate-500">{form.slug || '— will be generated from title'}</code>
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
            <Field label="Upload Image or Video" error={fieldErrors.imageUrl}>
              <div className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                {form.mediaType === 'video' ? <Video className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                <span>{form.mediaType}</span>
              </div>
              <div className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                {MEDIA_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      set('mediaType', type)
                      setMediaFile(null)
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                      form.mediaType === type ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
                    }`}
                    aria-pressed={form.mediaType === type}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <input
                type="file"
                accept={ACCEPTED_BY_TYPE[form.mediaType]}
                onChange={(e) => selectMediaFile(e.target.files?.[0] ?? null)}
                className="input-field"
              />
              {previewUrl ? (
                <AdminUploadPreview
                  title={form.title || 'Gallery media'}
                  eyebrow="Public gallery preview"
                  description={form.description || autoGalleryDescription(form.title)}
                  mediaUrl={previewUrl}
                  mediaType={form.mediaType}
                  altText={form.imageAlt || form.title}
                  meta={[form.category, form.status]}
                  publicHref="/gallery"
                  className="mt-3"
                />
              ) : null}
              <p className="font-body text-xs text-gray-400 mt-1">
                {mediaFile
                  ? `Selected: ${mediaFile.name} (${formatBytes(mediaFile.size)})`
                  : editId
                    ? 'Upload a new file to replace the current gallery media.'
                    : 'Required: upload an image or video from the media pipeline.'}
              </p>
            </Field>
            <Field label="Media Label / Alt Text *" error={fieldErrors.imageAlt}>
              <input value={form.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} required minLength={5} className="input-field" />
            </Field>
            <Field label="Category *" error={fieldErrors.category}>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-field">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status" error={fieldErrors.status}>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input-field">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Featured" error={fieldErrors.featured}>
              <div className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set('featured', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                />
                <span className="font-body text-sm text-slate-700">Place near the front of public gallery and homepage.</span>
              </div>
            </Field>
            <Field label="Event Name" error={fieldErrors.eventName}>
              <input value={form.eventName} onChange={(e) => set('eventName', e.target.value)} className="input-field" />
            </Field>
            <Field label="Location" error={fieldErrors.location}>
              <input value={form.location} onChange={(e) => set('location', e.target.value)} className="input-field" />
            </Field>
            <Field label="Captured At" error={fieldErrors.capturedAt}>
              <input type="datetime-local" value={form.capturedAt} onChange={(e) => set('capturedAt', e.target.value)} className="input-field" />
            </Field>
            <Field label="Sort Order" error={fieldErrors.sortOrder}>
              <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className="input-field" />
            </Field>
            <Field label="Caption" error={fieldErrors.caption}>
              <input value={form.caption} onChange={(e) => set('caption', e.target.value)} className="input-field" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description (min 40 chars) *" error={fieldErrors.description}>
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
                {uploadingImage ? 'Uploading media…' : busy ? 'Saving…' : editId ? 'Update Media' : 'Add Media'}
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
        <span className="font-body text-xs text-gray-400 ml-2">{visible.length} item{visible.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <p className="font-body text-sm text-gray-400">No gallery media yet. Click &quot;+ Add Media&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((img) => {
            const badge = CATEGORY_BADGE[img.category as GalleryImageCategory]
            return (
              <div key={img.id} className="group relative bg-white rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
                <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                  <GalleryThumbnail image={img} />
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
                      disabled={openingEditId === img.id || deletingId === img.id}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors disabled:cursor-wait disabled:opacity-70"
                      style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                    >
                      {openingEditId === img.id ? 'Opening...' : 'Edit'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: img.id, title: img.title })}
                      disabled={deletingId === img.id}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === img.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete gallery media?"
        message={`This will remove "${deleteTarget?.title ?? 'this item'}" from the public gallery and admin records. This action cannot be undone.`}
        confirmLabel="Delete media"
        cancelLabel="Keep media"
        confirmTone="danger"
        busy={Boolean(deletingId)}
        onConfirm={() => {
          void handleDelete()
        }}
        onCancel={() => {
          if (!deletingId) {
            setDeleteTarget(null)
          }
        }}
      />
    </section>
  )
}

function GalleryThumbnail({ image }: { image: GalleryImageRecord }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 p-4 text-center text-slate-500">
        <ImageOff className="h-7 w-7" aria-hidden="true" />
        <span className="font-body text-xs font-semibold">Image unavailable</span>
      </div>
    )
  }

  if (image.mediaType === 'video') {
    return (
      <div className="relative h-full w-full bg-slate-950">
        <video
          src={image.imageUrl}
          muted
          preload="metadata"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
          Video
        </span>
      </div>
    )
  }

  return (
    <Image
      src={image.imageUrl}
      alt={image.imageAlt}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      onError={() => setFailed(true)}
    />
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
