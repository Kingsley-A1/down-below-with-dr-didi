'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ImageOff, Trash2, Upload } from 'lucide-react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import AdminUploadPreview from '@/components/admin/AdminUploadPreview'
import BulkMediaUploader from '@/components/admin/BulkMediaUploader'
import UploadProgress from '@/components/admin/UploadProgress'
import { getAdminStatusTone } from '@/components/admin/adminStatusTone'
import type { GalleryImageRecord, GalleryImageCategory, GalleryMediaType } from '@/lib/admin/repository'
import { uploadAdminMediaAsset, validateGalleryFileSelection } from '@/components/admin/media-upload'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'
import { getGalleryEventYearOptions } from '@/lib/gallery-years'

type Status = 'draft' | 'published' | 'archived'

const CATEGORIES: GalleryImageCategory[] = ['outreach', 'event', 'team', 'community', 'facility']
const ACCEPTED_MEDIA = 'image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm'

const CATEGORY_BADGE: Record<GalleryImageCategory, { bg: string; text: string }> = {
  outreach:  { bg: '#dcfce7', text: '#166534' },
  event:     { bg: '#fce7f3', text: '#be185d' },
  team:      { bg: '#dbeafe', text: '#1e40af' },
  community: { bg: '#fef9c3', text: '#854d0e' },
  facility:  { bg: '#ede9fe', text: '#7c3aed' },
}

function emptyForm(): FormState {
  return { ...EMPTY_FORM, eventYear: getGalleryEventYearOptions()[0] }
}

type FormState = typeof EMPTY_FORM

const EMPTY_FORM = {
  slug: '',
  title: '',
  description: '',
  mediaType: 'image' as GalleryMediaType,
  featured: false,
  eventYear: null as number | null,
  imageUrl: '',
  imageAlt: '',
  category: 'outreach' as GalleryImageCategory,
  status: 'published' as Status,
}


function getTone(message: string) {
  return getAdminStatusTone(message)
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
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
  const [showUploader, setShowUploader] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [filter, setFilter] = useState<GalleryImageCategory | 'all'>('all')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [openingEditId, setOpeningEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState<{
    completed: number
    total: number
    fileName: string
    percent: number
  } | null>(null)
  const formRef = useRef<HTMLDivElement | null>(null)
  const previewUrl = useMemo(() => (mediaFile ? URL.createObjectURL(mediaFile) : form.imageUrl || ''), [form.imageUrl, mediaFile])

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    if (!showForm && !showUploader) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setOpeningEditId(null)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [showForm, showUploader, editId])

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
    setShowForm(false)
    setShowUploader(true)
    setMediaFile(null)
    setFieldErrors({})
    setMsg('')
    setUploadProgress(null)
  }

  function startEdit(img: GalleryImageRecord) {
    setOpeningEditId(img.id)
    setEditId(img.id)
    setForm({
      slug: img.slug,
      title: img.title,
      description: img.description,
      mediaType: img.mediaType,
      featured: img.featured,
      eventYear: img.eventYear ?? null,
      imageUrl: img.imageUrl,
      imageAlt: img.imageAlt,
      category: img.category as GalleryImageCategory,
      status: img.status as Status,
    })
    setMediaFile(null)
    setShowUploader(false)
    setShowForm(true)
    setFieldErrors({})
    setMsg('')
    setUploadProgress(null)
  }

  function cancelForm() {
    setShowForm(false)
    setShowUploader(false)
    setEditId(null)
    setForm(emptyForm())
    setMediaFile(null)
    setFieldErrors({})
    setUploadProgress(null)
  }

  function set(field: keyof FormState, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function selectReplacementFile(nextFiles: FileList | null) {
    const file = nextFiles?.[0]

    if (!file) {
      return
    }

    const validation = validateGalleryFileSelection([file])
    if (!validation.ok) {
      setMsg(validation.error)
      return
    }

    setMediaFile(file)
    setForm((prev) => ({ ...prev, mediaType: validation.mediaType }))
    setMsg('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!editId) {
      return
    }

    setBusy(true)
    setMsg('')
    setFieldErrors({})

    let nextImageUrl = form.imageUrl

    if (mediaFile) {
      setUploadingImage(true)
      setUploadProgress({ completed: 0, total: 1, fileName: mediaFile.name, percent: 0 })

      try {
        const upload = await uploadAdminMediaAsset(
          mediaFile,
          `${form.title || 'Gallery media'} upload`,
          form.imageAlt || form.title,
          {
            onProgress: (percent) => {
              setUploadProgress({ completed: 0, total: 1, fileName: mediaFile.name, percent })
            },
          }
        )
        nextImageUrl = upload.url
      } catch (error) {
        setBusy(false)
        setUploadingImage(false)
        setUploadProgress(null)
        setMsg(error instanceof Error ? error.message : 'Media upload failed')
        return
      }

      setUploadingImage(false)
      setUploadProgress(null)
    }

    if (!nextImageUrl) {
      setBusy(false)
      setMsg('A gallery media file is required before saving.')
      return
    }

    const res = await fetch(`/api/admin/gallery/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, imageUrl: nextImageUrl, id: editId }),
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

    setMsg('Gallery media updated.')
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

      {showUploader && (
        <div ref={formRef} className="scroll-mt-24">
          <BulkMediaUploader
            allowFeatured
            onUploaded={refresh}
            onCancel={cancelForm}
            onComplete={(count) => {
              cancelForm()
              setMsg(`Uploaded ${count} ${count === 1 ? 'item' : 'items'} to the public gallery.`)
            }}
          />
        </div>
      )}

      {showForm && (
        <div ref={formRef} className="scroll-mt-24 space-y-5 rounded-xl border bg-white p-4 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            Edit Gallery Media
          </h2>
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
            <div className="space-y-1.5">
              <span className="block font-body text-xs font-semibold uppercase tracking-wide text-gray-500">
                Image or video (optional replacement)
              </span>
              {previewUrl ? (
                <AdminUploadPreview
                  title={form.title || 'Gallery media'}
                  eyebrow="Public gallery preview"
                  description={form.description}
                  mediaUrl={previewUrl}
                  mediaType={form.mediaType}
                  altText={form.imageAlt || form.title}
                  meta={[form.mediaType, form.category, form.eventYear ? String(form.eventYear) : null]}
                  publicHref="/gallery"
                />
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="mr-auto font-body text-xs text-slate-500">
                  {mediaFile ? `${mediaFile.name}, ${formatBytes(mediaFile.size)}` : 'Keeping the current file.'}
                </p>
                <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 font-body text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-700 focus-within:ring-offset-1">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  {mediaFile ? 'Choose different file' : 'Replace current file'}
                  <input
                    type="file"
                    accept={ACCEPTED_MEDIA}
                    onChange={(event) => {
                      selectReplacementFile(event.target.files)
                      event.target.value = ''
                    }}
                    className="sr-only"
                  />
                </label>
                {mediaFile ? (
                  <button
                    type="button"
                    onClick={() => setMediaFile(null)}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 font-body text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Keep current file
                  </button>
                ) : null}
              </div>
              <UploadProgress
                active={uploadingImage && Boolean(uploadProgress)}
                label="Uploading replacement"
                detail={uploadProgress?.fileName}
                value={uploadProgress?.percent}
                className="mt-3"
              />
              {fieldErrors.imageUrl ? <span className="block font-body text-xs text-red-600">{fieldErrors.imageUrl}</span> : null}
            </div>
            <Field label="Name *" error={fieldErrors.title}>
              <input
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value, imageAlt: e.target.value }))}
                placeholder="Public media name"
                required
                minLength={5}
                maxLength={160}
                className="input-field"
              />
            </Field>
            <Field label="Description *" error={fieldErrors.description}>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                required
                minLength={10}
                maxLength={800}
                rows={4}
                placeholder="Describe what this image or video shows"
                className="input-field"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gallery section *" error={fieldErrors.category}>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className="input-field">
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Year of event *" error={fieldErrors.eventYear}>
                <select
                  value={form.eventYear ?? ''}
                  onChange={(e) => setForm((current) => ({ ...current, eventYear: e.target.value ? Number(e.target.value) : null }))}
                  required
                  className="input-field"
                >
                  {form.eventYear === null ? <option value="">Select year</option> : null}
                  {Array.from(new Set([...getGalleryEventYearOptions(), ...(form.eventYear ? [form.eventYear] : [])]))
                    .sort((a, b) => b - a)
                    .map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </Field>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set('featured', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                />
                <span className="font-body text-sm font-medium text-slate-700">Feature this item first</span>
              </label>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={cancelForm} className="font-body text-sm px-5 py-2.5 rounded-xl border transition-colors" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || uploadingImage}
                className="font-body text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {uploadingImage && uploadProgress ? 'Uploading replacement...' : busy ? 'Saving...' : 'Update Media'}
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
                  {img.eventYear ? <p className="font-body text-xs text-gray-500">{img.eventYear}</p> : null}
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
