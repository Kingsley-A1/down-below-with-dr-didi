'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Camera } from 'lucide-react'
import UploadProgress from '@/components/admin/UploadProgress'
import { uploadAdminMediaAsset, type UploadedAsset } from '@/components/admin/media-upload'

type AdminUploadModalProps = {
  open: boolean
  onClose: () => void
}

const MEDIA_KIND_OPTIONS = [
  { value: 'image', label: 'Image (team, gallery, banners)' },
  { value: 'audio', label: 'Audio (podcast clips, voice notes)' },
  { value: 'video', label: 'Video (campaign reels, explainers)' },
  { value: 'document', label: 'Document (guides, forms, handouts)' },
  { value: 'other', label: 'Other file type' },
] as const

const DESTINATION_OPTIONS = [
  {
    value: 'media_library',
    label: 'Media Library',
    helper: 'Store centrally first, then reuse across modules.',
    href: '/admin/media',
  },
  {
    value: 'site_settings',
    label: 'Site Settings / Hero',
    helper: 'Use for homepage hero and global brand sections.',
    href: '/admin/settings',
  },
  {
    value: 'team',
    label: 'Team Members',
    helper: 'Profile photos and team media.',
    href: '/admin/team',
  },
  {
    value: 'gallery',
    label: 'Gallery Images',
    helper: 'Outreach and event visuals.',
    href: '/admin/gallery',
  },
  {
    value: 'podcast',
    label: 'Podcast Episodes',
    helper: 'Covers and audio-related assets.',
    href: '/admin/podcast',
  },
  {
    value: 'events',
    label: 'Events',
    helper: 'Cover imagery and stream-related assets.',
    href: '/admin/events',
  },
] as const

function labelFromFilename(filename: string) {
  return filename
    .replace(/\.[^./\\]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
}

function bytesToReadableSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getFocusableElements(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
}

export default function AdminUploadModal({ open, onClose }: AdminUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [label, setLabel] = useState('')
  const [altText, setAltText] = useState('')
  const [mediaKind, setMediaKind] = useState<(typeof MEDIA_KIND_OPTIONS)[number]['value']>('image')
  const [destination, setDestination] = useState<(typeof DESTINATION_OPTIONS)[number]['value']>('media_library')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedAsset, setUploadedAsset] = useState<UploadedAsset | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setLabel('')
      setAltText('')
      setMediaKind('image')
      setDestination('media_library')
      setError('')
      setIsUploading(false)
      setUploadedAsset(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!isUploading) {
          onClose()
        }
        return
      }

      if (event.key !== 'Tab' || !modalRef.current) {
        return
      }

      const focusable = getFocusableElements(modalRef.current)
      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      lastFocusedRef.current?.focus()
    }
  }, [isUploading, onClose, open])

  const submitDisabled = useMemo(() => {
    return !file || !label.trim() || isUploading
  }, [file, label, isUploading])

  const selectedDestination = useMemo(() => {
    return DESTINATION_OPTIONS.find((option) => option.value === destination) || DESTINATION_OPTIONS[0]
  }, [destination])

  const imagePreviewUrl = useMemo(() => {
    if (!file || !file.type.startsWith('image/')) {
      return ''
    }

    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setError('Choose a file before uploading.')
      return
    }

    setError('')
    setIsUploading(true)

    try {
      const asset = await uploadAdminMediaAsset(file, label.trim(), altText.trim())
      setUploadedAsset(asset)
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed.'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-70 flex items-start justify-center overflow-y-auto p-4 py-6 sm:items-center" role="dialog" aria-modal="true" aria-label="Upload media asset">
      <button
        type="button"
        aria-label="Close upload modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      <div ref={modalRef} className="admin-dialog-enter relative z-71 flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-linear-to-r from-slate-950 to-slate-800 px-6 py-5 text-white">
          <p className="font-body text-xs uppercase tracking-[0.22em] text-slate-300">Admin Upload</p>
          <h2 className="mt-1 font-heading text-2xl font-bold">Upload to Media Library</h2>
          <p className="mt-2 font-body text-sm text-slate-300">
            Choose what media you are uploading and where it will be used, then send it to the media pipeline.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-upload-kind">
                What kind of media is this?
              </label>
              <select
                id="admin-upload-kind"
                value={mediaKind}
                onChange={(event) => setMediaKind(event.target.value as (typeof MEDIA_KIND_OPTIONS)[number]['value'])}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-body text-sm text-slate-700"
              >
                {MEDIA_KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-upload-destination">
                Where will you use it?
              </label>
              <select
                id="admin-upload-destination"
                value={destination}
                onChange={(event) => setDestination(event.target.value as (typeof DESTINATION_OPTIONS)[number]['value'])}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-body text-sm text-slate-700"
              >
                {DESTINATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 font-body text-xs text-slate-500">{selectedDestination.helper}</p>
            </div>
          </div>

          <div>
            <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-upload-file">
              File
            </label>
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              <Camera className="h-3.5 w-3.5" />
              <span>{mediaKind === 'image' ? 'Camera' : 'Media'}</span>
            </div>
            <input
              id="admin-upload-file"
              type="file"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] || null
                setFile(nextFile)
                setUploadedAsset(null)
                setError('')
                if (nextFile && !label.trim()) {
                  setLabel(labelFromFilename(nextFile.name))
                }
              }}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-body text-sm text-slate-700"
            />
            {imagePreviewUrl ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div className="relative h-36 w-full overflow-hidden rounded-lg bg-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreviewUrl} alt={altText || label || 'Selected media preview'} className="h-full w-full object-cover" />
                </div>
              </div>
            ) : null}
            {file ? (
              <p className="mt-2 font-body text-xs text-slate-500">
                {file.name} ({bytesToReadableSize(file.size)})
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-upload-label">
                Asset label
              </label>
              <input
                id="admin-upload-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Hero image - outreach launch"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-body text-sm text-slate-700"
              />
            </div>
            <div>
              <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="admin-upload-alt">
                Alt text (optional)
              </label>
              <input
                id="admin-upload-alt"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Describe the image for accessibility"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-body text-sm text-slate-700"
              />
            </div>
          </div>

          <UploadProgress
            active={isUploading}
            label="Uploading asset"
            detail="File is being validated and stored in R2"
          />

          {error ? <p className="font-body text-sm text-red-600" role="alert">{error}</p> : null}

          {uploadedAsset ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-body text-sm font-semibold text-emerald-800">Upload complete</p>
              <p className="mt-1 font-body text-xs text-emerald-700">{uploadedAsset.label}</p>
              <p className="mt-1 font-body text-xs text-emerald-700">
                Suggested destination: {selectedDestination.label}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={selectedDestination.href}
                  className="rounded-full bg-emerald-700 px-3 py-2 font-body text-xs font-semibold text-white"
                >
                  Open selected destination
                </Link>
                <Link
                  href="/admin/media"
                  className="rounded-full border border-emerald-700 px-3 py-2 font-body text-xs font-semibold text-emerald-800"
                >
                  Open media library
                </Link>
                <a
                  href={uploadedAsset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-emerald-700 px-3 py-2 font-body text-xs font-semibold text-emerald-800"
                >
                  View file
                </a>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="admin-interactive rounded-full border border-slate-300 px-5 py-2 font-body text-sm font-semibold text-slate-700"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              className="admin-interactive rounded-full bg-slate-900 px-5 py-2 font-body text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
