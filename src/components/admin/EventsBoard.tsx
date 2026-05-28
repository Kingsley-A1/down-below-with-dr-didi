'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, MessageSquare } from 'lucide-react'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import { getAdminStatusTone } from '@/components/admin/adminStatusTone'
import { uploadAdminMediaAsset } from '@/components/admin/media-upload'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'
import type { EventCommentRecord, EventRecord, EventStatus, EventCommentStatus } from '@/lib/admin/repository'

const STATUS_OPTIONS: EventStatus[] = ['draft', 'published', 'archived']
const COMMENT_STATUS_OPTIONS: EventCommentStatus[] = ['visible', 'hidden', 'flagged']

const EMPTY_FORM = {
  slug: '',
  title: '',
  summary: '',
  body: '',
  coverImageUrl: '',
  coverImageAlt: '',
  communityLabel: '',
  location: '',
  scheduledAt: '',
  endedAt: '',
  streamUrl: '',
  streamProvider: '' as '' | 'youtube' | 'facebook',
  isLive: false,
  engagementEnabled: true,
  status: 'draft' as EventStatus,
  publishedAt: '',
  sortOrder: '',
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

async function readAdminResponse(response: Response) {
  return (
    (await readJsonResponse<{
      error?: string
      issues?: { message?: string; path?: Array<string | number> }[]
      events?: EventRecord[]
      event?: EventRecord
      comments?: EventCommentRecord[]
      comment?: EventCommentRecord
    }>(response)) ?? {}
  )
}

function adminErrorMessage(data: { error?: string; issues?: { message?: string; path?: Array<string | number> }[] }, fallback: string) {
  return parseApiError(data, fallback).message
}

function toDatetimeInput(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

export default function EventsBoard({
  initialEvents,
  hideHeader = false,
  allowDelete = false,
}: {
  initialEvents: EventRecord[]
  hideHeader?: boolean
  allowDelete?: boolean
}) {
  const [events, setEvents] = useState(initialEvents)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [slugManual, setSlugManual] = useState(false)
  const [activeCommentsEventId, setActiveCommentsEventId] = useState<string | null>(null)
  const [comments, setComments] = useState<EventCommentRecord[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const commentsRequestIdRef = useRef(0)

  const previewUrl = useMemo(() => {
    if (!coverFile) {
      return form.coverImageUrl
    }

    return URL.createObjectURL(coverFile)
  }, [coverFile, form.coverImageUrl])

  useEffect(() => {
    return () => {
      if (coverFile && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [coverFile, previewUrl])

  async function refresh() {
    const response = await fetch('/api/admin/events', { cache: 'no-store' })
    const data = await readAdminResponse(response)
    setEvents(data.events || [])
  }

  function set(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function startCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setCoverFile(null)
    setSlugManual(false)
    setShowForm(true)
    setMsg('')
  }

  function startEdit(event: EventRecord) {
    setEditId(event.id)
    setForm({
      slug: event.slug,
      title: event.title,
      summary: event.summary,
      body: event.body || '',
      coverImageUrl: event.coverImageUrl || '',
      coverImageAlt: event.coverImageAlt || '',
      communityLabel: event.communityLabel || '',
      location: event.location || '',
      scheduledAt: toDatetimeInput(event.scheduledAt),
      endedAt: toDatetimeInput(event.endedAt),
      streamUrl: event.streamUrl || '',
      streamProvider: (event.streamProvider as '' | 'youtube' | 'facebook') || '',
      isLive: event.isLive,
      engagementEnabled: event.engagementEnabled,
      status: event.status,
      publishedAt: toDatetimeInput(event.publishedAt),
      sortOrder: String(event.sortOrder),
    })
    setCoverFile(null)
    setShowForm(true)
    setMsg('')
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setCoverFile(null)
    setSlugManual(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')

    let coverImageUrl = form.coverImageUrl
    const sortOrderValue = form.sortOrder.trim()

    if (sortOrderValue) {
      const parsedSortOrder = Number(sortOrderValue)
      if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
        setBusy(false)
        setMsg('Sort order must be a whole number of 0 or higher.')
        return
      }
    }

    if (coverFile) {
      setUploading(true)
      try {
        const upload = await uploadAdminMediaAsset(
          coverFile,
          `${form.title || 'Event'} cover image`,
          form.coverImageAlt || form.title
        )
        coverImageUrl = upload.url
      } catch (error) {
        setUploading(false)
        setBusy(false)
        setMsg(error instanceof Error ? error.message : 'Cover image upload failed')
        return
      }
      setUploading(false)
    }

    const endpoint = editId ? `/api/admin/events/${editId}` : '/api/admin/events'
    const method = editId ? 'PUT' : 'POST'

    const payload = {
      slug: form.slug,
      title: form.title,
      summary: form.summary,
      isLive: form.isLive,
      engagementEnabled: form.engagementEnabled,
      status: form.status,
      coverImageUrl,
      body: form.body.trim() || undefined,
      coverImageAlt: form.coverImageAlt || undefined,
      communityLabel: form.communityLabel || undefined,
      location: form.location || undefined,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      endedAt: form.endedAt ? new Date(form.endedAt).toISOString() : undefined,
      streamUrl: form.streamUrl || undefined,
      streamProvider: form.streamProvider || undefined,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
      ...(sortOrderValue && { sortOrder: Number(sortOrderValue) }),
    }

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await readAdminResponse(response)
    setBusy(false)

    if (!response.ok) {
      setMsg(adminErrorMessage(data, 'Save failed'))
      return
    }

    setMsg(editId ? 'Event updated.' : 'Event created.')
    await refresh()
    cancelForm()
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete event \"${title}\"? This cannot be undone.`)) {
      return
    }

    setBusy(true)
    setMsg('')

    const response = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    const data = await readAdminResponse(response)
    setBusy(false)

    if (!response.ok) {
      setMsg(adminErrorMessage(data, 'Delete failed'))
      return
    }

    setMsg('Event deleted.')
    await refresh()
  }

  async function openComments(eventId: string) {
    const requestId = commentsRequestIdRef.current + 1
    commentsRequestIdRef.current = requestId
    setActiveCommentsEventId(eventId)
    setLoadingComments(true)
    const response = await fetch(`/api/admin/events/${eventId}/comments`, { cache: 'no-store' })
    const data = await readAdminResponse(response)
    if (requestId !== commentsRequestIdRef.current) {
      return
    }

    if (!response.ok) {
      setMsg(adminErrorMessage(data, 'Failed to fetch event comments'))
      setComments([])
      setLoadingComments(false)
      return
    }
    setComments(data.comments || [])
    setLoadingComments(false)
  }

  async function updateCommentStatus(commentId: string, status: EventCommentStatus) {
    if (!activeCommentsEventId) {
      return
    }

    const response = await fetch(`/api/admin/events/${activeCommentsEventId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    const data = await readAdminResponse(response)

    if (!response.ok) {
      setMsg(adminErrorMessage(data, 'Comment moderation failed'))
      return
    }

    if (!data.comment) {
      setMsg('Comment moderation completed, but the updated comment was missing. Refresh comments to confirm the latest state.')
      return
    }

    const updatedComment = data.comment
    setComments((prev) => prev.map((item) => (item.id === commentId ? updatedComment : item)))
  }

  return (
    <section className="space-y-6">
      {!hideHeader ? (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-white p-6 sm:flex-row sm:items-center" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h1 className="mb-1 font-heading text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>Events</h1>
            <p className="font-body text-sm text-gray-500">Create, schedule, and manage live stream events with moderation controls.</p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="self-start whitespace-nowrap rounded-xl px-5 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:self-auto"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            + Add Event
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
            + Add Event
          </button>
        </div>
      )}

      {msg ? <AdminInlineStatus tone={getTone(msg)} message={msg} /> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border bg-white p-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Title</span>
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value
                  set('title', title)
                  if (!slugManual && !editId) {
                    set('slug', slugify(title))
                  }
                }}
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Slug</span>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-xl border px-3 py-2"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugManual(true)
                    set('slug', slugify(e.target.value))
                  }}
                  readOnly={Boolean(editId)}
                  pattern="[a-z0-9\-]+"
                  required
                />
                {!editId ? (
                  <button type="button" className="rounded-xl border px-3 py-2 text-xs" onClick={() => { setSlugManual(false); set('slug', slugify(form.title)) }}>
                    Auto
                  </button>
                ) : null}
              </div>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Summary</span>
              <textarea className="w-full rounded-xl border px-3 py-2" value={form.summary} onChange={(e) => set('summary', e.target.value)} required />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Body</span>
              <textarea className="w-full rounded-xl border px-3 py-2" value={form.body} onChange={(e) => set('body', e.target.value)} />
              <span className="block text-xs text-slate-500">Optional. Use this only when the event needs a longer description.</span>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Scheduled At</span>
              <input type="datetime-local" className="w-full rounded-xl border px-3 py-2" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Ended At</span>
              <input type="datetime-local" className="w-full rounded-xl border px-3 py-2" value={form.endedAt} onChange={(e) => set('endedAt', e.target.value)} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Sort Order</span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className="w-full rounded-xl border px-3 py-2"
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value)}
                placeholder={editId ? 'Keep current position' : 'Auto: first position'}
              />
              <span className="block text-xs text-slate-500">Optional. Leave blank to place a new event first, or type a unique number.</span>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Stream URL</span>
              <input className="w-full rounded-xl border px-3 py-2" value={form.streamUrl} onChange={(e) => set('streamUrl', e.target.value)} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Provider</span>
              <select className="w-full rounded-xl border px-3 py-2" value={form.streamProvider} onChange={(e) => set('streamProvider', e.target.value as '' | 'youtube' | 'facebook')}>
                <option value="">Auto / none</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Status</span>
              <select className="w-full rounded-xl border px-3 py-2" value={form.status} onChange={(e) => set('status', e.target.value as EventStatus)}>
                {STATUS_OPTIONS.map((status) => (<option key={status} value={status}>{status}</option>))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Community Label</span>
              <input className="w-full rounded-xl border px-3 py-2" value={form.communityLabel} onChange={(e) => set('communityLabel', e.target.value)} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Location</span>
              <input className="w-full rounded-xl border px-3 py-2" value={form.location} onChange={(e) => set('location', e.target.value)} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Cover Image</span>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-xl border px-3 py-2"
                onChange={(e) => {
                  const next = e.target.files?.[0] || null
                  setCoverFile(next)
                  if (next && !form.coverImageAlt) {
                    set('coverImageAlt', form.title)
                  }
                }}
              />
              <p className="text-xs text-slate-500">Upload from your device. Existing media URL will be updated automatically.</p>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Cover Alt Text</span>
              <input className="w-full rounded-xl border px-3 py-2" value={form.coverImageAlt} onChange={(e) => set('coverImageAlt', e.target.value)} />
            </label>
          </div>

          {previewUrl ? (
            <div className="rounded-xl border p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Camera className="h-4 w-4" /> Cover preview</p>
              <div className="inline-flex max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Event cover preview" className="max-h-72 max-w-full rounded-lg object-contain" />
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.isLive} onChange={(e) => set('isLive', e.target.checked)} />
              Live now
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.engagementEnabled} onChange={(e) => set('engagementEnabled', e.target.checked)} />
              Engagement enabled
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700">Published At</span>
              <input type="datetime-local" className="w-full rounded-xl border px-3 py-2" value={form.publishedAt} onChange={(e) => set('publishedAt', e.target.value)} />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="rounded-xl border px-4 py-2 text-sm font-semibold" onClick={cancelForm}>Cancel</button>
            <button type="submit" disabled={busy || uploading} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? (editId ? 'Saving...' : 'Creating...') : (editId ? 'Save changes' : 'Create event')}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4">
        {events.map((event) => (
          <article key={event.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{event.status}</p>
                <h2 className="text-xl font-bold text-slate-900">{event.title}</h2>
                <p className="text-sm text-slate-600">{event.summary}</p>
                <p className="mt-1 text-xs text-slate-500">/{event.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(event)} className="rounded-xl border px-3 py-1.5 text-xs font-semibold">Edit</button>
                <button type="button" onClick={() => openComments(event.id)} className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold">
                  <MessageSquare className="h-3.5 w-3.5" /> Comments
                </button>
                {allowDelete ? (
                  <button type="button" onClick={() => handleDelete(event.id, event.title)} className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">Delete</button>
                ) : null}
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
              <p>Live: <strong>{event.isLive ? 'Yes' : 'No'}</strong></p>
              <p>Engagement: <strong>{event.engagementEnabled ? 'On' : 'Off'}</strong></p>
              <p>Likes/Comments: <strong>{event._count.likes}/{event._count.comments}</strong></p>
            </div>
          </article>
        ))}

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No events yet. Create your first event.
          </div>
        ) : null}
      </div>

      {activeCommentsEventId ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Event Comments</h3>
              <button type="button" className="rounded-xl border px-3 py-1.5 text-xs font-semibold" onClick={() => {
                commentsRequestIdRef.current += 1
                setActiveCommentsEventId(null)
              }}>Close</button>
            </div>

            {loadingComments ? (
              <p className="text-sm text-slate-500">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-slate-500">No comments found.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <article key={comment.id} className="rounded-xl border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{comment.displayName}</p>
                      <select
                        className="rounded-lg border px-2 py-1 text-xs"
                        value={comment.status}
                        onChange={(e) => updateCommentStatus(comment.id, e.target.value as EventCommentStatus)}
                      >
                        {COMMENT_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{comment.body}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
