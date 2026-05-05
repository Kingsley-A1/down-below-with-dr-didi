'use client'

import { useState } from 'react'
import type { MediaAssetRecord } from '@/lib/admin/repository'

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    setStatus('')
    setIsUploading(true)

    const response = await fetch('/api/admin/media', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    setIsUploading(false)

    if (!response.ok) {
      setStatus(result.error || 'Upload failed')
      return
    }

    const refreshed = await fetch('/api/admin/media', { cache: 'no-store' })
    const refreshedResult = await refreshed.json()
    setAssets(refreshedResult.assets || [])
    setStatus('Asset uploaded successfully.')
    form.reset()
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Upload New Asset</h2>
          <p className="font-body text-sm text-gray-500">Hero images, article covers, outreach media, and downloadable files should pass through this R2-backed pipeline.</p>
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
        <div className="flex items-center gap-4">
          <button type="submit" disabled={isUploading} className="rounded-full px-6 py-3 font-body font-semibold" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
            {isUploading ? 'Uploading...' : 'Upload Asset'}
          </button>
          {status ? <p className="font-body text-sm text-gray-600">{status}</p> : null}
        </div>
      </form>

      <section className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="mb-5">
          <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Media Library</h2>
          <p className="font-body text-sm text-gray-500">Uploaded assets are persisted in CockroachDB and served from Cloudflare R2.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th className="py-3 font-body text-xs uppercase tracking-[0.2em] text-gray-400">Label</th>
                <th className="py-3 font-body text-xs uppercase tracking-[0.2em] text-gray-400">Type</th>
                <th className="py-3 font-body text-xs uppercase tracking-[0.2em] text-gray-400">Size</th>
                <th className="py-3 font-body text-xs uppercase tracking-[0.2em] text-gray-400">URL</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 font-body text-sm text-gray-500">No media assets yet.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}