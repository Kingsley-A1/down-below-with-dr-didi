'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Camera, Download, Music, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import type { PodcastEpisodeRecord } from '@/lib/admin/repository'
import UploadProgress from '@/components/admin/UploadProgress'
import { uploadAdminMediaAsset } from '@/components/admin/media-upload'

type Status = 'draft' | 'published' | 'archived'

const STATUS_OPTIONS: Status[] = ['draft', 'published', 'archived']

const EMPTY_FORM = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  audioUrl: '',
  audioSize: '',
  audioType: '',
  duration: '',
  coverImage: '',
  guestName: '',
  topicTags: '',
  transcript: '',
  externalSourceUrl: '',
  publishedAt: '',
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

function formatDuration(seconds: number | null) {
  if (!seconds) return 'Duration not set'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function toDatetimeLocal(value: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 16)
}

function formatBytes(size: number | null) {
  if (!size) return 'Size not set'
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function PodcastEpisodesBoard({
  initialEpisodes,
}: {
  initialEpisodes: PodcastEpisodeRecord[]
}) {
  const [episodes, setEpisodes] = useState(initialEpisodes)
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('')
  const [busyDetail, setBusyDetail] = useState('')
  const [message, setMessage] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [slugManual, setSlugManual] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const coverPreviewUrl = useMemo(() => {
    if (coverFile) {
      return URL.createObjectURL(coverFile)
    }

    return form.coverImage || ''
  }, [coverFile, form.coverImage])

  useEffect(() => {
    return () => {
      if (coverFile && coverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl)
      }
    }
  }, [coverFile, coverPreviewUrl])

  async function refresh() {
    const res = await fetch('/api/admin/podcast', { cache: 'no-store' })
    const data = await res.json()
    setEpisodes(data.episodes ?? [])
  }

  function set(field: keyof FormState, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function startCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setAudioFile(null)
    setCoverFile(null)
    setSlugManual(false)
    setShowAdvanced(false)
    setUploadProgress(0)
    setShowForm(true)
    setMessage('')
  }

  function startEdit(episode: PodcastEpisodeRecord) {
    setEditId(episode.id)
    setForm({
      title: episode.title,
      slug: episode.slug,
      summary: episode.summary,
      description: episode.description,
      audioUrl: episode.audioUrl,
      audioSize: episode.audioSize ? String(episode.audioSize) : '',
      audioType: episode.audioType ?? '',
      duration: episode.duration ? String(episode.duration) : '',
      coverImage: episode.coverImage ?? '',
      guestName: episode.guestName ?? '',
      topicTags: episode.topicTags.join(', '),
      transcript: episode.transcript ?? '',
      externalSourceUrl: episode.externalSourceUrl ?? '',
      publishedAt: toDatetimeLocal(episode.publishedAt),
      sortOrder: episode.sortOrder,
      status: episode.status as Status,
    })
    setAudioFile(null)
    setCoverFile(null)
    setSlugManual(true)
    setShowAdvanced(false)
    setUploadProgress(0)
    setShowForm(true)
    setMessage('')
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setAudioFile(null)
    setCoverFile(null)
    setSlugManual(false)
    setShowAdvanced(false)
    setUploadProgress(0)
  }

  async function readJsonResponse(response: Response) {
    const text = await response.text()

    if (!text.trim()) {
      return {}
    }

    try {
      return JSON.parse(text) as { error?: string; episodes?: PodcastEpisodeRecord[] }
    } catch {
      return { error: text.slice(0, 240) }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setBusyLabel(editId ? 'Updating podcast episode' : 'Creating podcast episode')
    setBusyDetail('Preparing episode details')
    setUploadProgress(0)
    setMessage('')

    try {
      if (!editId && !audioFile) {
        throw new Error('Audio upload is required for new podcast episodes.')
      }

      let nextAudioUrl = form.audioUrl
      let nextAudioSize = form.audioSize ? Number(form.audioSize) : undefined
      let nextAudioType = form.audioType
      let nextCoverImage = form.coverImage

      if (audioFile) {
        setBusyLabel('Uploading podcast audio')
        setBusyDetail(audioFile.name)
        const upload = await uploadAdminMediaAsset(audioFile, `${form.title || 'Podcast'} audio`, '', {
          onProgress: setUploadProgress,
        })
        nextAudioUrl = upload.url
        nextAudioSize = upload.sizeBytes
        nextAudioType = upload.mimeType
      }

      if (!nextAudioUrl) {
        throw new Error('A podcast audio asset is required before saving.')
      }

      if (coverFile) {
        setBusyLabel('Uploading cover image')
        setBusyDetail(coverFile.name)
        setUploadProgress(0)
        const upload = await uploadAdminMediaAsset(coverFile, `${form.title || 'Podcast'} cover art`, form.title, {
          onProgress: setUploadProgress,
        })
        nextCoverImage = upload.url
      }

      setBusyLabel(editId ? 'Saving episode changes' : 'Publishing episode')
      setBusyDetail('Writing podcast metadata')

      const payload = {
        slug: form.slug,
        title: form.title,
        summary: form.summary,
        description: form.description,
        audioUrl: nextAudioUrl,
        ...(nextAudioSize !== undefined && { audioSize: nextAudioSize }),
        ...(nextAudioType && { audioType: nextAudioType }),
        ...(form.duration && { duration: Number(form.duration) }),
        ...(nextCoverImage && { coverImage: nextCoverImage }),
        ...(form.guestName && { guestName: form.guestName }),
        topicTags: parseTags(form.topicTags),
        ...(form.transcript && { transcript: form.transcript }),
        ...(form.externalSourceUrl && { externalSourceUrl: form.externalSourceUrl }),
        ...(form.publishedAt && { publishedAt: new Date(form.publishedAt).toISOString() }),
        sortOrder: Number(form.sortOrder),
        status: form.status,
      }

      const url = editId ? `/api/admin/podcast/${editId}` : '/api/admin/podcast'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await readJsonResponse(res)

      if (!res.ok) {
        throw new Error(data.error || 'Save failed')
      }

      await refresh()
      cancelForm()
      setMessage(editId ? 'Episode updated.' : 'Episode created.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
      setBusyLabel('')
      setBusyDetail('')
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return

    setBusy(true)
    setBusyLabel('Deleting podcast episode')
    setBusyDetail(title)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/podcast/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error ?? 'Delete failed')
        return
      }

      setMessage('Episode deleted.')
      await refresh()
    } catch {
      setMessage('Delete failed. Check your connection and try again.')
    } finally {
      setBusy(false)
      setBusyLabel('')
      setBusyDetail('')
    }
  }

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-2xl border p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
            Podcast Episodes
          </h1>
          <p className="font-body text-sm text-gray-500">
            Publish audio stories, health conversations, and show notes for the public podcast page.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center gap-2 font-body text-sm font-semibold px-5 py-3 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={17} />
          Add Episode
        </button>
      </div>

      {message ? (
        <p className="font-body text-sm px-4 py-2 rounded-lg bg-blue-50 text-blue-700">{message}</p>
      ) : null}

      <UploadProgress
        active={busy && !showForm}
        label={busyLabel || 'Working'}
        detail={busyDetail}
      />

      {showForm ? (
        <div className="bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {editId ? 'Edit Episode' : 'Add Podcast Episode'}
            </h2>
            <button
              type="button"
              onClick={() => { setSlugManual(false); set('slug', slugify(form.title)) }}
              className="font-body text-sm font-semibold px-4 py-2 rounded-xl border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
            >
              Reset auto slug
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Title *">
              <input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value
                  set('title', title)
                  if (!slugManual && !editId) {
                    set('slug', slugify(title))
                  }
                }}
                required
                minLength={5}
                className="input-field"
              />
            </Field>
            <Field label="Slug *">
              {editId ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <code className="font-mono text-xs text-slate-700">{form.slug}</code>
                </div>
              ) : slugManual ? (
                <div className="flex gap-2">
                  <input
                    value={form.slug}
                    onChange={(e) => set('slug', slugify(e.target.value))}
                    required
                    pattern="[a-z0-9-]+"
                    className="input-field"
                  />
                  <button type="button" onClick={() => { setSlugManual(false); set('slug', slugify(form.title)) }} className="rounded-xl border px-3 py-2 text-xs font-semibold text-slate-600">
                    Auto
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <code className="flex-1 font-mono text-xs text-slate-500">{form.slug || 'generated from title'}</code>
                  <button type="button" onClick={() => setSlugManual(true)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Edit
                  </button>
                </div>
              )}
            </Field>
            <Field label="Upload audio">
              <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} className="input-field" />
              <p className="font-body text-xs text-gray-400">
                {audioFile
                  ? `Selected: ${audioFile.name}`
                  : editId
                    ? 'Upload a new audio file to replace current media.'
                    : 'Required: upload podcast audio from media pipeline.'}
              </p>
            </Field>
            <Field label="Upload cover art">
              <div className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                <Camera className="h-3.5 w-3.5" />
                <span>Camera</span>
              </div>
              <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="input-field" />
              {coverPreviewUrl ? (
                <div className="mt-3 inline-flex max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreviewUrl} alt={form.title || 'Podcast cover preview'} className="max-h-72 max-w-full rounded-lg object-contain" />
                </div>
              ) : null}
              <p className="font-body text-xs text-gray-400">
                {coverFile
                  ? `Selected: ${coverFile.name}`
                  : editId
                    ? 'Optional: upload only when replacing the current cover image.'
                    : 'Optional: upload cover image from media pipeline.'}
              </p>
            </Field>
            <Field label="Duration in seconds">
              <input type="number" min={1} value={form.duration} onChange={(e) => set('duration', e.target.value)} className="input-field" />
              <p className="font-body text-xs text-gray-400">Example: 1800 for a 30 minute episode.</p>
            </Field>
            <Field label="Published date">
              <input type="datetime-local" value={form.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} className="input-field" />
            </Field>
            <Field label="Topic tags">
              <input value={form.topicTags} onChange={(e) => set('topicTags', e.target.value)} placeholder="fertility, faith, wellness" className="input-field" />
              <p className="font-body text-xs text-gray-400">Separate tags with commas. Keep them short and public-friendly.</p>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input-field">
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <div className="lg:col-span-2">
              <Field label="Summary *">
                <textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} required minLength={20} maxLength={280} rows={3} className="input-field" />
              </Field>
            </div>
            <div className="lg:col-span-2">
              <Field label="Show notes *">
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} required minLength={40} rows={6} className="input-field" />
              </Field>
            </div>
            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={() => setShowAdvanced((current) => !current)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                aria-expanded={showAdvanced}
              >
                {showAdvanced ? 'Hide optional fields' : 'Show optional fields'}
              </button>
            </div>
            {showAdvanced ? (
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2 lg:grid-cols-2">
                <Field label="Guest name">
                  <input value={form.guestName} onChange={(e) => set('guestName', e.target.value)} className="input-field" />
                </Field>
                <Field label="Sort order">
                  <input type="number" min={0} value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} className="input-field" />
                </Field>
                <Field label="External source link">
                  <input value={form.externalSourceUrl} onChange={(e) => set('externalSourceUrl', e.target.value)} className="input-field" />
                </Field>
                <div className="lg:col-span-2">
                  <Field label="Transcript">
                    <textarea value={form.transcript} onChange={(e) => set('transcript', e.target.value)} rows={5} className="input-field" />
                  </Field>
                </div>
              </div>
            ) : null}
            <div className="lg:col-span-2">
              <UploadProgress
                active={busy}
                label={busyLabel || 'Saving episode'}
                detail={busyDetail}
                value={busy ? uploadProgress : undefined}
              />
            </div>
            <div className="lg:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={cancelForm} className="font-body text-sm px-5 py-3 rounded-xl border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 font-body text-sm font-semibold px-5 py-3 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Upload size={16} />
                {busy ? 'Saving...' : editId ? 'Update Episode' : 'Create Episode'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {episodes.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <Music className="mx-auto mb-3 h-10 w-10" style={{ color: 'var(--color-primary)' }} />
          <p className="font-body text-sm text-gray-500">No podcast episodes yet. Add the first episode to activate the public podcast page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {episodes.map((episode) => (
            <article key={episode.id} className="bg-white rounded-2xl border p-4 sm:p-5" style={{ borderColor: 'var(--color-border)' }}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[112px_minmax(0,1fr)_auto] lg:items-center">
                <div className="relative h-28 w-full overflow-hidden rounded-xl bg-primary-muted lg:w-28">
                  {episode.coverImage ? (
                    <Image src={episode.coverImage} alt={episode.title} fill className="object-cover" sizes="112px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Music size={30} style={{ color: 'var(--color-primary)' }} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={episode.status as Status} />
                    <span className="font-body text-xs text-gray-400">{formatDuration(episode.duration)}</span>
                    <span className="font-body text-xs text-gray-400">{formatBytes(episode.audioSize)}</span>
                  </div>
                  <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {episode.title}
                  </h2>
                  <p className="mt-1 font-body text-sm text-gray-600 line-clamp-2">{episode.summary}</p>
                  {episode.audioUrl ? (
                    <audio controls preload="none" src={episode.audioUrl} className="mt-3 w-full max-w-xl" />
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <a
                    href={episode.audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold"
                    style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                  >
                    <Download size={14} />
                    Audio
                  </a>
                  <button onClick={() => startEdit(episode)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold" style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}>
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button onClick={() => handleDelete(episode.id, episode.title)} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50">
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
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
    draft: { bg: '#fef9c3', text: '#854d0e' },
    archived: { bg: '#f3f4f6', text: '#6b7280' },
  }
  const style = styles[status]

  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: style.bg, color: style.text }}>
      {status}
    </span>
  )
}
