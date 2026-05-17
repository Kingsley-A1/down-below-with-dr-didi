'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Camera, ExternalLink, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import UploadProgress from '@/components/admin/UploadProgress'
import { clearAdminDraft, readAdminDraft, writeAdminDraft } from '@/components/admin/adminDraft'
import { uploadAdminMediaAsset } from '@/components/admin/media-upload'
import type { LibraryArticleRecord } from '@/lib/library/repository'

type Status = 'draft' | 'published' | 'archived'

type FormState = {
  title: string
  slug: string
  category: string
  excerpt: string
  content: string
  coverImageUrl: string
  status: Status
  publishedAt: string
}

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  category: 'menstrual',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  status: 'draft',
  publishedAt: '',
}

const TOPIC_SUGGESTIONS = [
  { value: 'menstrual', label: 'Menstrual Health' },
  { value: 'sexual-wellness', label: 'Sexual Wellness' },
  { value: 'preventative', label: 'Preventative Care' },
  { value: 'anatomy', label: 'Anatomy' },
  { value: 'fertility', label: 'Fertility' },
  { value: 'family-health', label: 'Family Health' },
]

const STATUS_OPTIONS: Status[] = ['draft', 'published', 'archived']
const LIBRARY_NEW_DRAFT_KEY = 'admin-draft:library:new'

function libraryEditDraftKey(id: string) {
  return `admin-draft:library:${id}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString().slice(0, 16)
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

function categoryLabel(category: string) {
  return TOPIC_SUGGESTIONS.find((option) => option.value === category)?.label ?? category
}

async function readJsonResponse(response: Response) {
  const text = await response.text()

  if (!text.trim()) {
    return {}
  }

  try {
    return JSON.parse(text) as { error?: string; article?: LibraryArticleRecord; articles?: LibraryArticleRecord[] }
  } catch {
    return { error: text.slice(0, 240) }
  }
}

export default function LibraryArticlesBoard({ initialArticles }: { initialArticles: LibraryArticleRecord[] }) {
  const [articles, setArticles] = useState(initialArticles)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [slugManual, setSlugManual] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [pendingDelete, setPendingDelete] = useState<LibraryArticleRecord | null>(null)
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState('')

  const coverPreviewUrl = useMemo(() => {
    if (coverFile) {
      return URL.createObjectURL(coverFile)
    }

    return form.coverImageUrl
  }, [coverFile, form.coverImageUrl])

  const sortedArticles = useMemo(
    () => [...articles].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    [articles]
  )

  const readTime = useMemo(() => estimateReadTime(form.content), [form.content])

  useEffect(() => {
    return () => {
      if (coverFile && coverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl)
      }
    }
  }, [coverFile, coverPreviewUrl])

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    updateForm({ ...form, [field]: value })
  }

  function updateForm(nextForm: FormState) {
    setForm(nextForm)

    if (!showForm) {
      return
    }

    const savedAt = new Date().toISOString()
    writeAdminDraft(editId ? libraryEditDraftKey(editId) : LIBRARY_NEW_DRAFT_KEY, nextForm)
    setLastDraftSavedAt(savedAt)
  }

  async function refresh() {
    const response = await fetch('/api/admin/library', { cache: 'no-store' })
    const data = await readJsonResponse(response)

    if (!response.ok) {
      throw new Error(data.error || 'Refresh failed')
    }

    setArticles(data.articles ?? [])
  }

  function startCreate() {
    const draft = readAdminDraft<FormState>(LIBRARY_NEW_DRAFT_KEY)
    setEditId(null)
    setForm(draft?.value ?? EMPTY_FORM)
    setSlugManual(Boolean(draft?.value.slug))
    setCoverFile(null)
    setUploadProgress(0)
    setShowForm(true)
    setLastDraftSavedAt(draft?.savedAt ?? '')
    setMessage(draft ? `Recovered a library draft from ${new Date(draft.savedAt).toLocaleString('en-NG')}.` : '')
  }

  function startEdit(article: LibraryArticleRecord) {
    const draft = readAdminDraft<FormState>(libraryEditDraftKey(article.id))
    const nextForm: FormState = {
      title: article.title,
      slug: article.slug,
      category: article.category,
      excerpt: article.excerpt,
      content: article.content,
      coverImageUrl: article.coverImage,
      status: article.status,
      publishedAt: toDatetimeLocal(article.publishedAt),
    }

    setEditId(article.id)
    setForm(draft?.value ?? nextForm)
    setSlugManual(true)
    setCoverFile(null)
    setUploadProgress(0)
    setShowForm(true)
    setLastDraftSavedAt(draft?.savedAt ?? '')
    setMessage(draft ? `Recovered a library draft from ${new Date(draft.savedAt).toLocaleString('en-NG')}.` : '')
  }

  function closeForm() {
    clearAdminDraft(editId ? libraryEditDraftKey(editId) : LIBRARY_NEW_DRAFT_KEY)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setSlugManual(false)
    setCoverFile(null)
    setUploadProgress(0)
    setLastDraftSavedAt('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setBusyLabel(coverFile ? 'Uploading cover image' : 'Saving article')
    setUploadProgress(0)
    setMessage('')

    try {
      let nextCoverImage = form.coverImageUrl

      if (coverFile) {
        const upload = await uploadAdminMediaAsset(coverFile, `${form.title || 'Library article'} cover`, form.title, {
          onProgress: setUploadProgress,
        })
        nextCoverImage = upload.url
      }

      setBusyLabel(editId ? 'Updating article' : 'Creating article')

      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        category: form.category,
        excerpt: form.excerpt,
        content: form.content,
        coverImageUrl: nextCoverImage,
        readTime,
        status: form.status,
        ...(form.publishedAt && { publishedAt: new Date(form.publishedAt).toISOString() }),
      }

      const response = await fetch(editId ? `/api/admin/library/${editId}` : '/api/admin/library', {
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
      setMessage(editId ? 'Article updated.' : 'Article saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
      setBusyLabel('')
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return
    }

    setBusy(true)
    setBusyLabel('Deleting article')
    setMessage('')

    try {
      const response = await fetch(`/api/admin/library/${pendingDelete.id}`, { method: 'DELETE' })
      const data = await readJsonResponse(response)

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed')
      }

      await refresh()
      setPendingDelete(null)
      setMessage('Article deleted.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setBusy(false)
      setBusyLabel('')
    }
  }

  const messageTone = message.toLowerCase().includes('failed') || message.toLowerCase().includes('validation')
    ? 'error'
    : message.toLowerCase().includes('draft')
      ? 'info'
      : 'success'

  return (
    <section className="space-y-6 admin-fade-in">
      <div className="admin-surface rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900">Library Publishing</h2>
            <p className="mt-1 font-body text-sm text-slate-600">
              Write and publish plain-language teaching articles for the public health library.
            </p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="admin-interactive inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 font-body text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Write Article
          </button>
        </div>
      </div>

      {message ? <AdminInlineStatus tone={messageTone} message={message} /> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="admin-surface rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {editId ? 'Edit Article' : 'New Article'}
              </p>
              <h3 className="mt-1 font-heading text-2xl font-bold text-slate-900">
                {editId ? 'Update teaching content' : 'Write teaching content'}
              </h3>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Read time</p>
              <p className="font-heading text-xl font-bold text-slate-900">{readTime} min</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <Field label="Title *">
                <input
                  value={form.title}
                  onChange={(event) => {
                    const title = event.target.value
                    updateForm({
                      ...form,
                      title,
                      slug: !slugManual && !editId ? slugify(title) : form.slug,
                    })
                  }}
                  required
                  minLength={8}
                  className="input-field"
                />
              </Field>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">
                    /library/{form.slug || 'generated-from-title'}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      setSlugManual((current) => !current)
                      if (slugManual) {
                        set('slug', slugify(form.title))
                      }
                    }}
                    className="admin-interactive rounded-full border border-slate-300 px-3 py-1.5 font-body text-xs font-semibold text-slate-700"
                  >
                    {slugManual ? 'Use auto slug' : 'Edit slug'}
                  </button>
                </div>
                {slugManual ? (
                  <input
                    value={form.slug}
                    onChange={(event) => set('slug', slugify(event.target.value))}
                    required
                    pattern="[a-z0-9-]+"
                    className="mt-3 input-field"
                  />
                ) : null}
              </div>

              <Field label="Short summary *">
                <textarea
                  value={form.excerpt}
                  onChange={(event) => set('excerpt', event.target.value)}
                  required
                  minLength={30}
                  maxLength={320}
                  rows={3}
                  className="input-field"
                />
              </Field>

              <Field label="Article body *">
                <textarea
                  value={form.content}
                  onChange={(event) => set('content', event.target.value)}
                  required
                  minLength={120}
                  rows={18}
                  className="input-field font-body leading-relaxed"
                  placeholder="Write in short paragraphs. Leave a blank line between paragraphs."
                />
                <p className="font-body text-xs text-slate-500">
                  Use short paragraphs. Leave a blank line where a new paragraph should start on the public page.
                </p>
              </Field>
            </div>

            <aside className="space-y-4">
              <Field label="Topic *">
                <input
                  list="library-topic-suggestions"
                  value={form.category}
                  onChange={(event) => set('category', event.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  className="input-field"
                  placeholder="Type a topic or pick a suggestion"
                />
                <datalist id="library-topic-suggestions">
                  {TOPIC_SUGGESTIONS.map((topic) => (
                    <option key={topic.value} value={topic.value}>
                      {topic.label}
                    </option>
                  ))}
                </datalist>
                <p className="font-body text-xs text-slate-500">
                  Choose a suggested topic or type a new one for this article.
                </p>
              </Field>
              <Field label="Status *">
                <select value={form.status} onChange={(event) => set('status', event.target.value as Status)} className="input-field">
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Publish date">
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(event) => set('publishedAt', event.target.value)}
                  className="input-field"
                />
              </Field>
              <Field label="Cover image">
                <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Image</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                  className="input-field"
                />
              </Field>
              {coverPreviewUrl ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreviewUrl} alt={form.title || 'Article cover preview'} className="max-h-72 w-full rounded-xl object-contain" />
                </div>
              ) : null}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Public Preview</p>
                <h4 className="mt-2 font-heading text-lg font-bold text-slate-900">{form.title || 'Article title'}</h4>
                <p className="mt-1 font-body text-xs font-semibold text-emerald-800">{categoryLabel(form.category) || 'Topic'}</p>
                <p className="mt-2 font-body text-sm text-slate-600 line-clamp-4">{form.excerpt || 'Summary appears here.'}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">Draft autosave</p>
                <p className="mt-1 font-body text-xs text-emerald-800">
                  {lastDraftSavedAt ? `Saved locally ${new Date(lastDraftSavedAt).toLocaleTimeString('en-NG')}` : 'Your draft saves locally as you write.'}
                </p>
              </div>
            </aside>
          </div>

          <div className="mt-5">
            <UploadProgress active={busy} label={busyLabel || 'Saving article'} detail={coverFile?.name ?? ''} value={busy ? uploadProgress : undefined} />
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              disabled={busy}
              className="admin-interactive rounded-full border border-slate-300 px-5 py-2.5 font-body text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="admin-interactive inline-flex items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 py-2.5 font-body text-sm font-semibold text-white disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {busy ? 'Saving...' : editId ? 'Update Article' : 'Save Article'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3">
        {sortedArticles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <p className="font-body text-sm text-slate-600">No library articles found.</p>
          </div>
        ) : (
          sortedArticles.map((article) => (
            <article key={article.id} className="admin-surface rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-center">
                <div className="relative h-36 overflow-hidden rounded-2xl bg-slate-100 md:h-24">
                  <Image src={article.coverImage} alt={article.title} fill className="object-cover" sizes="(max-width: 768px) 90vw, 120px" />
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-body text-xs font-semibold text-emerald-800">
                      {categoryLabel(article.category)}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${article.status === 'published' ? 'bg-green-50 text-green-700' : article.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {article.status}
                    </span>
                    <span className="font-body text-xs text-slate-500">{article.readTime} min read</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-900">{article.title}</h3>
                  <p className="mt-1 line-clamp-2 font-body text-sm text-slate-600">{article.excerpt}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link
                    href={`/library/${article.slug}`}
                    target="_blank"
                    className="admin-interactive inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-2 font-body text-xs font-semibold text-slate-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(article)}
                    className="admin-interactive inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-2 font-body text-xs font-semibold text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(article)}
                    disabled={busy}
                    className="admin-interactive inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-2 font-body text-xs font-semibold text-rose-700 disabled:opacity-60"
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
        title="Delete library article"
        message={pendingDelete ? `Delete "${pendingDelete.title}"? This removes it from the public library.` : ''}
        confirmLabel="Delete article"
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
