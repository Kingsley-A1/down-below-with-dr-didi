'use client'

import { useState } from 'react'
import type { VaultSubmissionRecord } from '@/lib/admin/repository'

type VaultStatus = VaultSubmissionRecord['status']

const statusOptions: VaultStatus[] = ['new', 'reviewed', 'answered_privately', 'approved_for_faq', 'archived']

export default function VaultModerationBoard({ initialSubmissions }: { initialSubmissions: VaultSubmissionRecord[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [activeId, setActiveId] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  async function refresh() {
    const response = await fetch('/api/admin/vault', { cache: 'no-store' })
    const result = await response.json()
    setSubmissions(result.submissions || [])
  }

  async function saveSubmission(payload: {
    id: string
    status: VaultStatus
    moderationNotes: string
    approvedFaqTitle: string
  }) {
    setStatusMessage('')
    setActiveId(payload.id)

    const response = await fetch('/api/admin/vault', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok) {
      setStatusMessage(result.error || 'Failed to update submission')
      setActiveId('')
      return
    }

    await refresh()
    setStatusMessage('Submission moderation saved successfully.')
    setActiveId('')
  }

  return (
    <section className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
          V-Vault Moderation
        </h1>
        <p className="font-body text-sm text-gray-600 max-w-3xl">
          Review anonymous submissions, update their moderation state, and mark approved items for FAQ conversion.
        </p>
      </div>

      {statusMessage ? <p className="font-body text-sm mb-4 text-gray-600">{statusMessage}</p> : null}

      <div className="space-y-5">
        {submissions.length === 0 ? (
          <div className="rounded-xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
            <p className="font-body text-sm text-gray-500">No V-Vault submissions have been received yet.</p>
          </div>
        ) : (
          submissions.map((submission) => {
            const isSaving = activeId === submission.id

            return (
              <form
                key={submission.id}
                className="rounded-xl border p-5 space-y-4"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                onSubmit={(event) => {
                  event.preventDefault()
                  const form = event.currentTarget
                  const formData = new FormData(form)
                  saveSubmission({
                    id: submission.id,
                    status: String(formData.get('status')) as VaultStatus,
                    moderationNotes: String(formData.get('moderationNotes') || ''),
                    approvedFaqTitle: String(formData.get('approvedFaqTitle') || ''),
                  })
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-body text-xs text-gray-400">Submitted {new Date(submission.createdAt).toLocaleString('en-NG')}</p>
                  <span
                    className="font-body text-xs uppercase tracking-[0.14em] px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                  >
                    {submission.category}
                  </span>
                </div>

                <p className="font-body text-sm text-gray-700 leading-relaxed">{submission.question}</p>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-[0.12em] text-gray-400 mb-2">Status</label>
                    <select
                      name="status"
                      defaultValue={submission.status}
                      className="w-full rounded-xl border px-4 py-3 text-sm"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block font-body text-xs uppercase tracking-[0.12em] text-gray-400 mb-2">FAQ title (optional)</label>
                    <input
                      name="approvedFaqTitle"
                      defaultValue={submission.approvedFaqTitle || ''}
                      className="w-full rounded-xl border px-4 py-3 text-sm"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-xs uppercase tracking-[0.12em] text-gray-400 mb-2">Moderation notes</label>
                  <textarea
                    name="moderationNotes"
                    rows={3}
                    defaultValue={submission.moderationNotes || ''}
                    className="w-full rounded-xl border px-4 py-3 text-sm"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex rounded-full px-5 py-2.5 font-body font-semibold"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  {isSaving ? 'Saving...' : 'Save Moderation'}
                </button>
              </form>
            )
          })
        )}
      </div>
    </section>
  )
}
