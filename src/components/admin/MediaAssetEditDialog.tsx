'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { MediaAssetGalleryEntry, MediaAssetRecord, MediaAssetWithGallery } from '@/lib/admin/repository'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'
import { getGalleryEventYearOptions } from '@/lib/gallery-years'

const subscribeNoop = () => () => {}

const fieldClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-body text-sm text-slate-900 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20'

interface MediaAssetEditDialogProps {
  asset: MediaAssetRecord | null
  onClose: () => void
  onSaved: (asset: MediaAssetRecord) => void
}

export default function MediaAssetEditDialog({ asset, onClose, onSaved }: MediaAssetEditDialogProps) {
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false)

  if (!asset || !isClient) {
    return null
  }

  // Keyed by asset so each opening starts with fresh state.
  return createPortal(<EditDialogBody key={asset.id} asset={asset} onClose={onClose} onSaved={onSaved} />, document.body)
}

function EditDialogBody({
  asset,
  onClose,
  onSaved,
}: {
  asset: MediaAssetRecord
  onClose: () => void
  onSaved: (asset: MediaAssetRecord) => void
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [gallery, setGallery] = useState<MediaAssetGalleryEntry | null>(null)
  const [label, setLabel] = useState(asset.label)
  const [altText, setAltText] = useState(asset.altText ?? '')
  const [description, setDescription] = useState('')
  const [eventYear, setEventYear] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(`/api/admin/media/${asset.id}`, { cache: 'no-store' })
        const data = await readJsonResponse<Partial<MediaAssetWithGallery>>(response)

        if (cancelled) {
          return
        }

        if (!response.ok) {
          setError(parseApiError(data, 'Could not load this item. Close the dialog and try again.').message)
          return
        }

        const entry = data?.gallery ?? null
        setGallery(entry)
        setDescription(entry?.description ?? '')
        setEventYear(entry?.eventYear ? String(entry.eventYear) : String(getGalleryEventYearOptions()[0]))
      } catch {
        if (!cancelled) {
          setError('Could not load this item. Check your connection and try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [asset.id])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
        )
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (!first || !last) {
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onClose])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/media/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          altText,
          gallery: gallery ? { description, eventYear: Number(eventYear) } : undefined,
        }),
      })
      const data = await readJsonResponse<Partial<MediaAssetWithGallery>>(response)

      if (!response.ok || !data?.asset) {
        setError(parseApiError(data, 'Save failed. Check the details and try again.').message)
        return
      }

      onSaved(data.asset)
    } catch {
      setError('Save failed. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const yearOptions = Array.from(
    new Set([...getGalleryEventYearOptions(), ...(eventYear ? [Number(eventYear)] : [])])
  ).sort((a, b) => b - a)

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        disabled={saving}
        aria-label="Close edit dialog"
      />

      <div ref={dialogRef} className="admin-dialog-enter relative z-81 max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 id={titleId} className="font-heading text-xl font-bold text-slate-900">
          Edit {asset.kind === 'video' ? 'video' : 'media'} details
        </h2>
        <p className="mt-1 font-body text-xs text-slate-500">
          To change the file itself, delete this item and upload the new file.{' '}
          <a href={asset.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline">
            View current file
          </a>
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" aria-busy={loading || saving}>
          <div>
            <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="edit-media-title">
              Media Title <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="edit-media-title"
              value={label}
              required
              maxLength={120}
              autoComplete="off"
              disabled={loading}
              onChange={(event) => setLabel(event.target.value)}
              className={fieldClassName}
            />
          </div>

          {gallery ? (
            <>
              <div>
                <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="edit-media-year">
                  Year of Event <span className="text-red-600" aria-hidden="true">*</span>
                </label>
                <select
                  id="edit-media-year"
                  value={eventYear}
                  required
                  onChange={(event) => setEventYear(event.target.value)}
                  className={fieldClassName}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="edit-media-description">
                  Event Description <span className="text-red-600" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="edit-media-description"
                  value={description}
                  required
                  minLength={10}
                  maxLength={800}
                  rows={5}
                  onChange={(event) => setDescription(event.target.value)}
                  className={fieldClassName}
                />
              </div>
            </>
          ) : null}

          <div>
            <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="edit-media-alt">
              Alt Text / Video Label <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="edit-media-alt"
              value={altText}
              maxLength={200}
              autoComplete="off"
              disabled={loading}
              onChange={(event) => setAltText(event.target.value)}
              className={fieldClassName}
            />
          </div>

          <div aria-live="polite">
            {loading ? <p className="font-body text-sm text-slate-500">Loading details…</p> : null}
            {error ? <p className="font-body text-sm font-medium text-red-700">{error}</p> : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="admin-interactive min-h-11 rounded-full border border-slate-300 px-5 py-2 font-body text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || saving}
              className="admin-interactive min-h-11 rounded-full px-5 py-2 font-body text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
