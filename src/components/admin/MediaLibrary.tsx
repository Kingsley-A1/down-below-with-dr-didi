'use client'

import { useState } from 'react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import type { MediaAssetRecord } from '@/lib/admin/repository'
import UploadProgress from '@/components/admin/UploadProgress'

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

  async function refreshAssets() {
    const refreshed = await fetch('/api/admin/media', { cache: 'no-store' })
    const refreshedResult = await refreshed.json()
    setAssets(refreshedResult.assets || [])
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const selectedFile = formData.get('file')

    setStatus('')
    setUploadDetail(selectedFile instanceof File ? selectedFile.name : 'Preparing file')
    setIsUploading(true)

    try {
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setStatus(result.error || 'Upload failed')
        return
      }

      setUploadDetail('Refreshing media library')
      await refreshAssets()
      setStatus('Asset uploaded successfully.')
      form.reset()
    } catch {
      setStatus('Upload failed. Check your connection and try again.')
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

  const statusTone = status.toLowerCase().includes('failed') || status.toLowerCase().includes('cannot')
    ? 'error'
    : 'success'

  return (
    <div className="space-y-8 admin-fade-in">
      <form onSubmit={handleSubmit} className="admin-surface bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Upload Asset</h2>
          <p className="font-body text-sm text-gray-500">Add approved files to the managed media pipeline for use across the platform.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="block font-body text-sm font-semibold mb-2" htmlFor="label">Label</label>
            <input id="label" name="label" className="w-full rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-border)' }} />
          </div>
          <div>
            <label className="block font-body text-sm font-semibold mb-2" htmlFor="altText">Alt text</label>
            <input id="altText" name="altText" className="w-full rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-border)' }} />
          </div>
        </div>
        <div>
          <label className="block font-body text-sm font-semibold mb-2" htmlFor="file">File</label>
          <input id="file" name="file" type="file" required className="w-full rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--color-border)' }} />
        </div>
        <UploadProgress
          active={isUploading}
          label="Uploading asset"
          detail={uploadDetail}
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th className="py-3 font-body text-xs uppercase tracking-[0.2em] text-gray-400">Label</th>
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
                      <p className="font-body font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>{asset.label}</p>
                      <p className="font-body text-xs text-gray-400">{new Date(asset.createdAt).toLocaleString('en-NG')}</p>
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
