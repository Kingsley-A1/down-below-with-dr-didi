'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ImagePlus, Trash2, Video } from 'lucide-react'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import UploadProgress from '@/components/admin/UploadProgress'
import { getAdminStatusTone } from '@/components/admin/adminStatusTone'
import {
  BULK_ACCEPTED_MEDIA,
  filterBulkAdditions,
  GALLERY_CATEGORY_OPTIONS,
  getBulkMediaType,
  isBulkDraftComplete,
  MAX_BULK_ITEMS,
  summarizeRejections,
} from '@/components/admin/bulk-media'
import { buildGalleryUploadForFile, deriveMediaLabel, uploadAdminMediaAsset } from '@/components/admin/media-upload'
import { getGalleryEventYearOptions } from '@/lib/gallery-years'
import type { GalleryImageCategory } from '@/lib/admin/repository'

type ItemState = 'ready' | 'done' | 'failed'

interface BulkItem {
  id: string
  file: File
  previewUrl: string
  title: string
  description: string
  /** null means "follow the Year for all selector". */
  eventYear: number | null
  state: ItemState
  error?: string
}

const fieldClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-body text-sm text-slate-900 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20'

function formatBytes(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

interface BulkMediaUploaderProps {
  onUploaded: () => Promise<void>
  /** Called once every item has uploaded, with how many were added. */
  onComplete?: (uploadedCount: number) => void
  /** Shows a Cancel button (used when the uploader is opened as a panel). */
  onCancel?: () => void
  /** Offers "Feature the first item uploaded". */
  allowFeatured?: boolean
}

export default function BulkMediaUploader({ onUploaded, onComplete, onCancel, allowFeatured = false }: BulkMediaUploaderProps) {
  const yearOptions = getGalleryEventYearOptions()
  const [items, setItems] = useState<BulkItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [batchYear, setBatchYear] = useState(yearOptions[0])
  const [category, setCategory] = useState<GalleryImageCategory>('outreach')
  const [featured, setFeatured] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<{ index: number; total: number; fileName: string; percent: number } | null>(null)
  const [status, setStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewUrlsRef = useRef(new Set<string>())

  useEffect(() => {
    const urls = previewUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  const active = items[Math.min(activeIndex, items.length - 1)]
  const pendingItems = items.filter((item) => item.state !== 'done')
  const incompleteCount = pendingItems.filter((item) => !isBulkDraftComplete(item)).length
  const effectiveYear = (item: BulkItem) => item.eventYear ?? batchYear

  function revokePreview(url: string) {
    URL.revokeObjectURL(url)
    previewUrlsRef.current.delete(url)
  }

  function addFiles(selected: FileList | null) {
    const incoming = Array.from(selected ?? [])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (incoming.length === 0) {
      return
    }

    const currentBytes = items.reduce((sum, item) => sum + item.file.size, 0)
    const { accepted, rejected } = filterBulkAdditions(items.length, currentBytes, incoming)

    const added: BulkItem[] = accepted.map((file, index) => {
      const previewUrl = URL.createObjectURL(file)
      previewUrlsRef.current.add(previewUrl)

      return {
        id: `${Date.now().toString(36)}-${items.length + index}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
        title: deriveMediaLabel(file.name),
        description: '',
        eventYear: null,
        state: 'ready',
      }
    })

    if (added.length > 0) {
      // Land on the first newly added item so the admin can start typing straight away.
      setActiveIndex(items.length)
      setItems((current) => [...current, ...added])
    }

    setStatus(summarizeRejections(rejected))
  }

  function updateActive(patch: Partial<Pick<BulkItem, 'title' | 'description' | 'eventYear'>>) {
    if (!active) {
      return
    }

    setItems((current) => current.map((item) => (item.id === active.id ? { ...item, ...patch, state: item.state === 'failed' ? 'ready' : item.state } : item)))
  }

  function removeActive() {
    if (!active) {
      return
    }

    revokePreview(active.previewUrl)
    setItems((current) => current.filter((item) => item.id !== active.id))
    setActiveIndex((index) => Math.max(0, Math.min(index, items.length - 2)))
  }

  function copyPreviousDescription() {
    const previous = items[activeIndex - 1]
    if (previous) {
      updateActive({ description: previous.description })
    }
  }

  function jumpToFirstIncomplete() {
    const index = items.findIndex((item) => item.state !== 'done' && !isBulkDraftComplete(item))
    if (index >= 0) {
      setActiveIndex(index)
    }
  }

  async function handleUpload() {
    if (incompleteCount > 0) {
      jumpToFirstIncomplete()
      setStatus(`${incompleteCount} ${incompleteCount === 1 ? 'item needs' : 'items need'} a title and description before uploading.`)
      return
    }

    setStatus('')
    setIsUploading(true)

    const tokenBase = Date.now().toString(36)
    const queue = items.filter((item) => item.state !== 'done')
    const outcomes = new Map<string, { state: ItemState; error?: string }>()
    let featuredAssigned = false

    for (const [queueIndex, item] of queue.entries()) {
      setProgress({ index: queueIndex, total: queue.length, fileName: item.file.name, percent: 0 })

      try {
        await uploadAdminMediaAsset(item.file, item.title.trim(), '', {
          onProgress: (percent) => setProgress({ index: queueIndex, total: queue.length, fileName: item.file.name, percent }),
          gallery: buildGalleryUploadForFile({
            fileName: item.file.name,
            label: item.title,
            description: item.description,
            mediaType: getBulkMediaType(item.file),
            category,
            featured: allowFeatured && featured && !featuredAssigned,
            eventYear: effectiveYear(item),
            uniqueToken: `${tokenBase}${queueIndex.toString(36)}`,
          }),
        })
        outcomes.set(item.id, { state: 'done' })
        if (allowFeatured && featured) {
          featuredAssigned = true
        }
      } catch (error) {
        outcomes.set(item.id, { state: 'failed', error: error instanceof Error ? error.message : 'Upload failed' })
      }
    }

    setProgress(null)
    setIsUploading(false)

    const uploadedCount = [...outcomes.values()].filter((outcome) => outcome.state === 'done').length
    const failedCount = outcomes.size - uploadedCount

    if (uploadedCount > 0) {
      try {
        await onUploaded()
      } catch {
        // The catalog refresh failing must not hide the upload result; the next page load picks it up.
      }
    }

    // Keep only what still needs attention; uploaded items leave the editor.
    const remaining = items.filter((item) => outcomes.get(item.id)?.state !== 'done')
    items.forEach((item) => {
      if (outcomes.get(item.id)?.state === 'done') {
        revokePreview(item.previewUrl)
      }
    })
    setItems(
      remaining.map((item) => {
        const outcome = outcomes.get(item.id)
        return outcome?.state === 'failed' ? { ...item, state: 'failed', error: outcome.error } : item
      })
    )
    setActiveIndex(0)

    if (failedCount === 0) {
      setStatus(`Uploaded ${uploadedCount} ${uploadedCount === 1 ? 'item' : 'items'} to the public gallery.`)
      onComplete?.(uploadedCount)
    } else {
      setStatus(
        `Uploaded ${uploadedCount} of ${queue.length}. ${failedCount} failed and ${failedCount === 1 ? 'is' : 'are'} still in the list. Check the error on each one, then try again.`
      )
    }
  }

  const statusTone = getAdminStatusTone(status)
  const activeIsVideo = active ? getBulkMediaType(active.file) === 'video' : false

  return (
    <section className="admin-surface space-y-5 rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }} aria-label="Bulk upload">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Bulk Upload</p>
          <h2 className="mt-1 text-balance font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            Add up to {MAX_BULK_ITEMS} items at once
          </h2>
          <p className="mt-2 text-pretty font-body text-sm leading-6 text-gray-500">
            Choose your files, then fill in one item at a time. Titles start from the file name.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || items.length >= MAX_BULK_ITEMS}
              className="admin-interactive min-h-11 rounded-full border border-slate-300 bg-white px-4 py-2 font-body text-sm font-semibold text-slate-700 hover:border-slate-900 disabled:opacity-60"
            >
              Add more files
            </button>
          ) : null}
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="admin-interactive min-h-11 rounded-full border border-slate-300 bg-white px-4 py-2 font-body text-sm font-semibold text-slate-700 hover:border-slate-900 disabled:opacity-60"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={BULK_ACCEPTED_MEDIA}
        aria-label="Choose images or videos to upload"
        onChange={(event) => addFiles(event.target.files)}
        className="sr-only"
        tabIndex={-1}
        suppressHydrationWarning
      />

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="admin-interactive flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-emerald-600 hover:bg-emerald-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="mt-3 font-body text-sm font-semibold text-slate-900">Choose images or videos</span>
          <span className="mt-1 font-body text-xs text-slate-500">
            Up to {MAX_BULK_ITEMS} files. Images 10 MB each, videos 200 MB each, 500 MB in total.
          </span>
        </button>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="bulk-year-all">
                Year for all
              </label>
              <select
                id="bulk-year-all"
                value={batchYear}
                disabled={isUploading}
                onChange={(event) => setBatchYear(Number(event.target.value))}
                className="mt-1.5 min-h-11 rounded-xl border border-slate-300 bg-white px-4 font-body text-sm text-slate-900 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="bulk-category-all">
                Gallery section for all
              </label>
              <select
                id="bulk-category-all"
                value={category}
                disabled={isUploading}
                onChange={(event) => setCategory(event.target.value as GalleryImageCategory)}
                className="mt-1.5 min-h-11 rounded-xl border border-slate-300 bg-white px-4 font-body text-sm text-slate-900 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
              >
                {GALLERY_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {allowFeatured ? (
              <label className="flex min-h-11 items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={featured}
                  disabled={isUploading}
                  onChange={(event) => setFeatured(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                />
                <span className="font-body text-sm font-medium text-slate-700">Feature the first item uploaded</span>
              </label>
            ) : null}
            <p className="font-body text-sm font-semibold text-slate-700" aria-live="polite">
              {pendingItems.length - incompleteCount} of {pendingItems.length} ready
            </p>
          </div>

          <ol className="flex gap-2 overflow-x-auto pb-2" aria-label="Selected items">
            {items.map((item, index) => {
              const complete = isBulkDraftComplete(item)
              const isActive = index === activeIndex
              const isVideo = getBulkMediaType(item.file) === 'video'

              return (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={`Item ${index + 1}: ${item.title || item.file.name}, ${item.state === 'failed' ? 'upload failed' : complete ? 'ready' : 'needs details'}`}
                    className={`relative block h-16 w-16 overflow-hidden rounded-xl border-2 bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                      isActive ? 'border-emerald-600' : 'border-transparent'
                    }`}
                  >
                    {isVideo ? (
                      <video src={item.previewUrl} muted preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                    )}
                    <span className="absolute left-1 top-1 rounded-full bg-black/65 px-1.5 font-body text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="absolute bottom-1 right-1 rounded-full bg-white">
                      {item.state === 'failed' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                      ) : complete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      ) : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          {active ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
              <div className="overflow-hidden rounded-2xl bg-slate-950">
                {activeIsVideo ? (
                  <video key={active.id} src={active.previewUrl} controls preload="metadata" className="aspect-[4/3] w-full object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={active.id} src={active.previewUrl} alt={active.title || 'Selected upload preview'} className="aspect-[4/3] w-full object-contain" />
                )}
                <p className="flex items-center gap-2 bg-slate-900 px-4 py-2 font-body text-xs text-slate-300">
                  {activeIsVideo ? <Video className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
                  <span className="truncate">{active.file.name}</span>
                  <span className="shrink-0">· {formatBytes(active.file.size)}</span>
                </p>
              </div>

              <div className="min-w-0 space-y-4">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Item {Math.min(activeIndex, items.length - 1) + 1} of {items.length}
                </p>

                <div>
                  <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="bulk-title">
                    Media Title <span className="text-red-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="bulk-title"
                    value={active.title}
                    maxLength={120}
                    autoComplete="off"
                    disabled={isUploading}
                    onChange={(event) => updateActive({ title: event.target.value })}
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="bulk-year">
                    Year of Event
                  </label>
                  <select
                    id="bulk-year"
                    value={effectiveYear(active)}
                    disabled={isUploading}
                    onChange={(event) => updateActive({ eventYear: Number(event.target.value) })}
                    className={fieldClassName}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="bulk-description">
                      Event Description <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    {activeIndex > 0 && items[activeIndex - 1]?.description ? (
                      <button
                        type="button"
                        onClick={copyPreviousDescription}
                        disabled={isUploading}
                        className="font-body text-xs font-semibold text-emerald-700 underline disabled:opacity-60"
                      >
                        Same as previous
                      </button>
                    ) : null}
                  </div>
                  <textarea
                    id="bulk-description"
                    value={active.description}
                    rows={4}
                    maxLength={800}
                    disabled={isUploading}
                    onChange={(event) => updateActive({ description: event.target.value })}
                    placeholder="Describe what happened at this event"
                    className={fieldClassName}
                  />
                </div>

                {active.state === 'failed' && active.error ? (
                  <p className="font-body text-sm font-medium text-red-700" role="alert">{active.error}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                    disabled={isUploading || activeIndex === 0}
                    className="admin-interactive inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 font-body text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((index) => Math.min(items.length - 1, index + 1))}
                    disabled={isUploading || activeIndex >= items.length - 1}
                    className="admin-interactive inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 font-body text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={removeActive}
                    disabled={isUploading}
                    className="admin-interactive ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 font-body text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <UploadProgress
            active={isUploading && Boolean(progress)}
            label={progress ? `Uploading ${progress.index + 1} of ${progress.total}` : 'Uploading'}
            detail={progress?.fileName}
            value={progress?.percent}
          />

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={isUploading || pendingItems.length === 0}
              className="admin-interactive min-h-11 rounded-full px-6 py-3 font-body font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {isUploading ? 'Uploading…' : `Upload ${pendingItems.length} ${pendingItems.length === 1 ? 'Item' : 'Items'}`}
            </button>
            {incompleteCount > 0 && !isUploading ? (
              <p className="font-body text-xs text-slate-500">
                {incompleteCount} {incompleteCount === 1 ? 'item still needs' : 'items still need'} a title and description.
              </p>
            ) : null}
          </div>
        </>
      )}

      {status ? <div aria-live="polite"><AdminInlineStatus tone={statusTone} message={status} /></div> : null}
    </section>
  )
}
