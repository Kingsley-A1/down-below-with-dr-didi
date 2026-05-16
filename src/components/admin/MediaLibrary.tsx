'use client'

import { useEffect, useMemo, useState } from 'react'
import { Camera, File, ImageIcon } from 'lucide-react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import type { MediaAssetRecord } from '@/lib/admin/repository'
import UploadProgress from '@/components/admin/UploadProgress'
import { clearAdminDraft, readAdminDraft, writeAdminDraft } from '@/components/admin/adminDraft'
import { uploadAdminMediaAsset } from '@/components/admin/media-upload'

const MEDIA_DRAFT_KEY = 'admin-draft:media-upload'

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const selectedPreviewUrl = useMemo(() => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) {
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

  useEffect(() => {
    const draft = readAdminDraft<{ label: string; altText: string }>(MEDIA_DRAFT_KEY)

    if (!draft) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setLabel(draft.value.label)
      setAltText(draft.value.altText)
      setStatus(`Recovered upload details from ${new Date(draft.savedAt).toLocaleString('en-NG')}. Choose the file again to continue.`)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!label && !altText) {
      return
    }

    writeAdminDraft(MEDIA_DRAFT_KEY, { label, altText })
  }, [altText, label])

  async function refreshAssets() {
    const refreshed = await fetch('/api/admin/media', { cache: 'no-store' })
    const refreshedResult = await refreshed.json()
    setAssets(refreshedResult.assets || [])
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

      await uploadAdminMediaAsset(selectedFile, label.trim() || selectedFile.name, altText.trim(), {
        onProgress: setUploadProgress,
      })

      setUploadDetail('Refreshing media library')
      await refreshAssets()
      setStatus('Asset uploaded successfully.')
      clearAdminDraft(MEDIA_DRAFT_KEY)
      setLabel('')
      setAltText('')
      setSelectedFile(null)
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
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409 && Array.isArray(result.usages)) {
          const usagePreview = result.usages
            .slice(0, 3)
            .map((usage: { entityType: string; field: string; entityLabel: string }) => `${usage.entityType}.${usage.field} (${usage.entityLabel})`)
            .join(', ')
          setStatus(`Cannot delete: asset is in use by ${usagePreview}.`)
          return
        }

        setStatus(result.error || 'Delete failed')
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

  const statusTone = status.toLowerCase().includes('failed') || status.toLowerCase().includes('cannot') || status.toLowerCase().includes('could not') || status.toLowerCase().includes('choose')
    ? 'error'
    : 'success'

  return (
    <div className="space-y-8 admin-fade-in">
      <form onSubmit={handleSubmit} className="admin-surface bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Upload Asset</h2>
          <p className="font-body text-sm text-gray-500">Add approved files to the managed media pipeline for use across the platform.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block font-body text-sm font-semibold mb-2" htmlFor="label">Label</label>
            <input id="label" name="label" value={label} onChange={(event) => setLabel(event.target.value)} className="w-full rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-border)' }} />
          </div>
          <div>
            <label className="block font-body text-sm font-semibold mb-2" htmlFor="altText">Alt text</label>
            <input id="altText" name="altText" value={altText} onChange={(event) => setAltText(event.target.value)} className="w-full rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-border)' }} />
          </div>
        </div>
        <div>
          <label className="block font-body text-sm font-semibold mb-2" htmlFor="file">File</label>
          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            <Camera className="h-3.5 w-3.5" />
            <span>Media</span>
          </div>
          <input
            id="file"
            name="file"
            type="file"
            required
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setSelectedFile(file)
              if (file && !label.trim()) {
                setLabel(file.name.replace(/\.[^./\\]+$/, '').replace(/[_-]+/g, ' '))
              }
            }}
            className="w-full rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--color-border)' }}
          />
          {selectedPreviewUrl ? (
            <div className="mt-3 inline-flex max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedPreviewUrl} alt="Selected upload preview" className="max-h-72 max-w-full rounded-lg object-contain" />
            </div>
          ) : null}
        </div>
        <UploadProgress
          active={isUploading}
          label="Uploading asset"
          detail={uploadDetail}
          value={uploadProgress}
        />
        <div className="flex items-center gap-4">
          <button type="submit" disabled={isUploading} className="admin-interactive rounded-full px-6 py-3 font-body font-semibold" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
            {isUploading ? 'Uploading...' : 'Upload Asset'}
          </button>
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
        <img src={asset.url} alt={asset.altText || asset.label} className="h-full w-full object-cover" />
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
