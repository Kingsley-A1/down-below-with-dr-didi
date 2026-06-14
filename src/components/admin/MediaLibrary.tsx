'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { File, ImageIcon, ImagePlus, RefreshCw, Trash2, Video } from 'lucide-react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import type { MediaAssetRecord } from '@/lib/admin/repository'
import UploadProgress from '@/components/admin/UploadProgress'
import { deriveMediaLabel, uploadAdminMediaAsset } from '@/components/admin/media-upload'
import { getAdminStatusTone } from '@/components/admin/adminStatusTone'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 200 * 1024 * 1024
type UploadMediaType = 'image' | 'video'
const ACCEPTED_BY_TYPE: Record<UploadMediaType, string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif,image/avif',
  video: 'video/mp4,video/webm',
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaLibrary({ initialAssets }: { initialAssets: MediaAssetRecord[] }) {
  const [assets, setAssets] = useState(initialAssets)
  const [status, setStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingDeleteAsset, setPendingDeleteAsset] = useState<MediaAssetRecord | null>(null)
  const [uploadDetail, setUploadDetail] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [label, setLabel] = useState('')
  const [altText, setAltText] = useState('')
  const [mediaType, setMediaType] = useState<UploadMediaType>('image')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const selectedPreviewUrl = useMemo(() => {
    if (!selectedFile) {
      return ''
    }

    return URL.createObjectURL(selectedFile)
  }, [selectedFile])

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(selectedPreviewUrl)
      }
    }
  }, [selectedPreviewUrl])

  function resetSelectedMedia() {
    setSelectedFile(null)
    setLabel('')
    setAltText('')
    setImageDimensions(null)
    setUploadProgress(0)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function selectMedia(file: File | null) {
    if (!file) {
      return
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if ((mediaType === 'image' && !isImage) || (mediaType === 'video' && !isVideo)) {
      setStatus(mediaType === 'image' ? 'Choose an image file such as JPG, PNG, WebP, GIF, or AVIF.' : 'Choose a video file such as MP4 or WebM.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
    if (file.size > maxBytes) {
      setStatus(isVideo ? 'This video is larger than 200 MB. Choose a smaller video and try again.' : 'This image is larger than 10 MB. Choose a smaller image and try again.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setStatus('')
    setSelectedFile(file)
    setLabel(deriveMediaLabel(file.name))
    setAltText('')
    setImageDimensions(null)
  }

  async function refreshAssets() {
    const refreshed = await fetch('/api/admin/media', { cache: 'no-store' })
    const refreshedResult = await readJsonResponse<{ assets?: MediaAssetRecord[] }>(refreshed)
    if (!refreshed.ok) {
      throw new Error(parseApiError(refreshedResult, 'Failed to refresh media library').message)
    }
    setAssets(refreshedResult?.assets || [])
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    setUploadProgress(0)
    setUploadDetail(selectedFile ? selectedFile.name : 'Preparing file')
    setIsUploading(true)

    try {
      if (!selectedFile) {
        throw new Error('Choose a file before uploading.')
      }

      const uploadedAsset = await uploadAdminMediaAsset(selectedFile, label.trim() || selectedFile.name, altText.trim(), {
        onProgress: setUploadProgress,
      })

      setAssets((current) => [
        {
          id: uploadedAsset.id,
          label: uploadedAsset.label,
          storageKey: uploadedAsset.storageKey ?? '',
          bucket: uploadedAsset.bucket ?? '',
          url: uploadedAsset.url,
          mimeType: uploadedAsset.mimeType,
          sizeBytes: uploadedAsset.sizeBytes,
          kind: uploadedAsset.kind,
          altText: altText.trim() || null,
          createdAt: new Date().toISOString(),
        },
        ...current.filter((asset) => asset.id !== uploadedAsset.id),
      ])
      setUploadDetail('Refreshing media library')
      await refreshAssets()
      setStatus(`${mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully.`)
      resetSelectedMedia()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed. Check your connection and try again.')
    } finally {
      setIsUploading(false)
      setUploadDetail('')
    }
  }

  function requestDelete(asset: MediaAssetRecord) {
    setPendingDeleteAsset(asset)
  }

  async function confirmDelete() {
    if (!pendingDeleteAsset) {
      return
    }

    setStatus('')
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/media/${pendingDeleteAsset.id}`, { method: 'DELETE' })
      const result = await readJsonResponse<{ error?: string; usages?: Array<{ entityType: string; field: string; entityLabel: string }> }>(response)

      if (!response.ok) {
        if (response.status === 409 && Array.isArray(result?.usages)) {
          const usagePreview = result.usages
            .slice(0, 3)
            .map((usage: { entityType: string; field: string; entityLabel: string }) => `${usage.entityType}.${usage.field} (${usage.entityLabel})`)
            .join(', ')
          setStatus(`Cannot delete: asset is in use by ${usagePreview}.`)
          return
        }

        setStatus(parseApiError(result, 'Delete failed').message)
        return
      }

      await refreshAssets()
      setStatus('Asset deleted successfully.')
      setPendingDeleteAsset(null)
    } catch {
      setStatus('Delete failed. Check your connection and try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const statusTone = getAdminStatusTone(status)

  return (
    <div className="space-y-8 admin-fade-in">
      <form
        onSubmit={handleSubmit}
        className="admin-surface space-y-6 rounded-2xl border bg-white p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-2xl">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Fast Media Upload
          </p>
          <h2 className="mt-1 text-balance font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            Select, Review & Upload
          </h2>
          <p className="mt-2 text-pretty font-body text-sm leading-6 text-gray-500">
            Choose 1 image or video. Its title is filled from the file name, then you can review the preview and edit details before upload.
          </p>
        </div>

        <div className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 p-1" aria-label="Choose upload type">
          {(['image', 'video'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setMediaType(type)
                resetSelectedMedia()
                setStatus('')
              }}
              className={`rounded-full px-4 py-2 font-body text-sm font-semibold capitalize transition-colors ${
                mediaType === type ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              aria-pressed={mediaType === type}
            >
              {type}
            </button>
          ))}
        </div>

        <div>
          <span className="block font-body text-sm font-semibold text-slate-800">
            {mediaType === 'video' ? 'Video' : 'Image'} <span className="text-red-600" aria-hidden="true">*</span>
          </span>
          <p id="image-upload-help" className="mt-1 font-body text-xs text-slate-500">
            {mediaType === 'video' ? 'MP4 or WebM. Maximum size: 200 MB.' : 'JPG, PNG, WebP, GIF, or AVIF. Maximum size: 10 MB.'}
          </p>
          <input
            ref={fileInputRef}
            id="image-upload-file"
            name="image"
            type="file"
            accept={ACCEPTED_BY_TYPE[mediaType]}
            tabIndex={-1}
            aria-label={`Choose ${mediaType} to upload`}
            aria-required="true"
            aria-describedby="image-upload-help"
            onChange={(event) => selectMedia(event.target.files?.[0] ?? null)}
            className="sr-only"
            suppressHydrationWarning
          />

          {!selectedFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="admin-interactive mt-3 flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-emerald-600 hover:bg-emerald-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                {mediaType === 'video' ? <Video className="h-6 w-6" aria-hidden="true" /> : <ImagePlus className="h-6 w-6" aria-hidden="true" />}
              </span>
              <span className="mt-3 font-body text-sm font-semibold text-slate-900">Choose {mediaType === 'video' ? 'Video' : 'Image'}</span>
              <span className="mt-1 font-body text-xs text-slate-500">
                Select {mediaType === 'image' ? 'an image' : 'a video'} from this device
              </span>
            </button>
          ) : null}
        </div>

        {selectedFile && selectedPreviewUrl ? (
          <section
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
            aria-labelledby="selected-image-heading"
          >
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
              <figure className="flex min-h-72 items-center justify-center bg-slate-950 p-3 sm:p-5">
                {/* Blob URLs cannot be optimized by next/image. */}
                {mediaType === 'video' ? (
                  <video
                    src={selectedPreviewUrl}
                    controls
                    preload="metadata"
                    className="max-h-[28rem] w-full rounded-xl object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPreviewUrl}
                    alt={altText || label || 'Selected image preview'}
                    width={1200}
                    height={800}
                    onLoad={(event) => {
                      setImageDimensions({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      })
                    }}
                    className="max-h-[28rem] w-full rounded-xl object-contain"
                  />
                )}
              </figure>

              <div className="min-w-0 space-y-5 p-5 sm:p-6">
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Ready to Upload
                  </p>
                  <h3 id="selected-image-heading" className="mt-1 truncate font-heading text-xl font-bold text-slate-900">
                    {selectedFile.name}
                  </h3>
                  <p className="mt-2 font-body text-xs text-slate-500">
                    {formatBytes(selectedFile.size)}
                    {imageDimensions && mediaType === 'image' ? ` · ${imageDimensions.width} × ${imageDimensions.height} px` : ''}
                  </p>
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="image-title">
                    Media Title <span className="text-red-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="image-title"
                    name="title"
                    value={label}
                    required
                    maxLength={120}
                    autoComplete="off"
                    aria-describedby="image-title-help"
                    onChange={(event) => setLabel(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-body text-sm text-slate-900 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
                  />
                  <p id="image-title-help" className="mt-1.5 font-body text-xs text-slate-500">
                    Filled automatically from the file name. Edit it to make the media easy to find.
                  </p>
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-slate-800" htmlFor="image-alt-text">
                    Alt Text / Video Label <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="image-alt-text"
                    name="altText"
                    value={altText}
                    maxLength={200}
                    autoComplete="off"
                    aria-describedby="image-alt-help"
                    onChange={(event) => setAltText(event.target.value)}
                    placeholder="Example: Dr. Didi speaking at a women’s health outreach…"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-body text-sm text-slate-900 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/20"
                  />
                  <p id="image-alt-help" className="mt-1.5 font-body text-xs text-slate-500">
                    Describe meaningful content. Leave blank only when the media is decorative.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="admin-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 font-body text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900 disabled:opacity-60"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Replace Media
                  </button>
                  <button
                    type="button"
                    onClick={resetSelectedMedia}
                    disabled={isUploading}
                    className="admin-interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2 font-body text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <UploadProgress
          active={isUploading}
          label={`Uploading ${mediaType}`}
          detail={uploadDetail}
          value={uploadProgress}
        />
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={isUploading}
            className="admin-interactive min-h-11 rounded-full px-6 py-3 font-body font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            {isUploading ? 'Uploading…' : `Upload ${mediaType === 'video' ? 'Video' : 'Image'}`}
          </button>
          <p className="font-body text-xs text-slate-500">2 required inputs · 1 optional input</p>
        </div>
        {status ? <div aria-live="polite"><AdminInlineStatus tone={statusTone} message={status} /></div> : null}
      </form>

      <section className="admin-surface bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="mb-5">
          <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Asset Catalog</h2>
          <p className="font-body text-sm text-gray-500">Assets are tracked in CockroachDB and served through Cloudflare R2 storage.</p>
        </div>
        <div className="grid gap-3 md:hidden">
          {assets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-5 font-body text-sm text-gray-500">No assets uploaded yet.</p>
          ) : (
            assets.map((asset) => (
              <article key={asset.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <AssetPreview asset={asset} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{asset.label}</p>
                    <p className="mt-1 font-body text-xs text-gray-500">{asset.kind} / {formatBytes(asset.sizeBytes)}</p>
                    <p className="mt-1 font-body text-xs text-gray-400">{new Date(asset.createdAt).toLocaleString('en-NG')}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href={asset.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-2 font-body text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                    Open asset
                  </a>
                  <button
                    type="button"
                    onClick={() => requestDelete(asset)}
                    disabled={isDeleting || isUploading}
                    className="admin-interactive rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th className="py-3 font-body text-xs uppercase tracking-[0.2em] text-gray-400">Asset</th>
                <th className="py-3 font-body text-xs uppercase tracking-[0.2em] text-gray-400">Type</th>
                <th className="py-3 font-body text-xs uppercase tracking-[0.2em] text-gray-400">Size</th>
                <th className="py-3 font-body text-xs uppercase tracking-[0.2em] text-gray-400">URL</th>
                <th className="py-3 font-body text-xs uppercase tracking-[0.2em] text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 font-body text-sm text-gray-500">No assets uploaded yet.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="border-b last:border-0 transition-colors hover:bg-slate-50" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <AssetPreview asset={asset} />
                        <div className="min-w-0">
                          <p className="truncate font-body font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>{asset.label}</p>
                          <p className="font-body text-xs text-gray-400">{new Date(asset.createdAt).toLocaleString('en-NG')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-body text-sm text-gray-600">{asset.kind}</td>
                    <td className="py-4 font-body text-sm text-gray-600">{formatBytes(asset.sizeBytes)}</td>
                    <td className="py-4 font-body text-sm">
                      <a href={asset.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                        Open asset
                      </a>
                    </td>
                    <td className="py-4 font-body text-sm">
                      <button
                        type="button"
                        onClick={() => requestDelete(asset)}
                        disabled={isDeleting || isUploading}
                        className="admin-interactive rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminConfirmDialog
        open={Boolean(pendingDeleteAsset)}
        title="Delete media asset"
        message={pendingDeleteAsset ? `Delete \"${pendingDeleteAsset.label}\" permanently from storage and records?` : ''}
        confirmLabel="Delete asset"
        confirmTone="danger"
        busy={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setPendingDeleteAsset(null)
          }
        }}
        onConfirm={() => {
          void confirmDelete()
        }}
      />
    </div>
  )
}

function AssetPreview({ asset }: { asset: MediaAssetRecord }) {
  if (asset.kind === 'image') {
    return (
      <span className="relative inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.url}
          alt={asset.altText || asset.label}
          width={48}
          height={48}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </span>
    )
  }

  if (asset.kind === 'video') {
    return (
      <span className="relative inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-900">
        <video
          src={asset.url}
          muted
          preload="metadata"
          className="h-full w-full object-cover"
          aria-label={asset.altText || asset.label}
        />
      </span>
    )
  }

  const Icon = asset.kind === 'document' ? File : ImageIcon

  return (
    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  )
}
