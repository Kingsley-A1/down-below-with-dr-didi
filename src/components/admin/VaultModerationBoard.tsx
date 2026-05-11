'use client'

import { useState } from 'react'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import type { VaultSubmissionRecord } from '@/lib/admin/repository'

type VaultStatus = VaultSubmissionRecord['status']

const statusOptions: VaultStatus[] = ['new', 'reviewed', 'answered_privately', 'approved_for_faq', 'archived']

export default function VaultModerationBoard({
  initialSubmissions,
  canRevealIdentity,
}: {
  initialSubmissions: VaultSubmissionRecord[]
  canRevealIdentity: boolean
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [activeId, setActiveId] = useState('')
  const [respondingId, setRespondingId] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({})
  const [identityRevealed, setIdentityRevealed] = useState(false)
  const [identityActionLoading, setIdentityActionLoading] = useState(false)

  async function refresh(options?: { includeIdentity?: boolean }) {
    const includeIdentity = options?.includeIdentity === true
    const query = includeIdentity ? '?includeIdentity=1' : ''

    const response = await fetch(`/api/admin/vault${query}`, { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to refresh V-Vault submissions')
    }

    setSubmissions(result.submissions || [])
    setIdentityRevealed(includeIdentity)
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

    await refresh({ includeIdentity: identityRevealed })
    setStatusMessage('Submission moderation saved successfully.')
    setActiveId('')
  }

  async function sendResponse(submissionId: string) {
    const responseBody = (responseDrafts[submissionId] || '').trim()

    if (!responseBody) {
      setStatusMessage('Response body is required before sending.')
      return
    }

    setStatusMessage('')
    setRespondingId(submissionId)

    const response = await fetch(`/api/admin/vault/${submissionId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseBody }),
    })

    const result = await response.json()

    if (!response.ok) {
      setStatusMessage(result.error || 'Failed to send response')
      setRespondingId('')
      return
    }

    setResponseDrafts((prev) => ({ ...prev, [submissionId]: '' }))
    await refresh({ includeIdentity: identityRevealed })
    setStatusMessage(
      result.notificationCreated
        ? 'Response sent and user notification queued successfully.'
        : 'Response sent successfully. No linked user account was available for notification.'
    )
    setRespondingId('')
  }

  async function toggleIdentityReveal(nextIncludeIdentity: boolean) {
    setStatusMessage('')
    setIdentityActionLoading(true)

    try {
      await refresh({ includeIdentity: nextIncludeIdentity })
      setStatusMessage(
        nextIncludeIdentity
          ? 'Linked identities are now visible to this super admin session.'
          : 'Linked identities are now masked.'
      )
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to update identity visibility')
    } finally {
      setIdentityActionLoading(false)
    }
  }

  return (
    <section className="admin-fade-in admin-surface bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
          V-Vault Moderation
        </h1>
        <p className="font-body text-sm text-gray-600 max-w-3xl">
          Review anonymous submissions, update their moderation state, and mark approved items for FAQ conversion.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {canRevealIdentity ? (
            <button
              type="button"
              disabled={identityActionLoading}
              onClick={() => {
                void toggleIdentityReveal(!identityRevealed)
              }}
              className="admin-interactive inline-flex rounded-full px-4 py-2 text-sm font-body font-semibold"
              style={{
                backgroundColor: identityRevealed ? '#f3f4f6' : '#111827',
                color: identityRevealed ? '#111827' : '#fff',
              }}
            >
              {identityActionLoading
                ? 'Updating identity view...'
                : identityRevealed
                  ? 'Mask Linked Identities'
                  : 'Reveal Linked Identities'}
            </button>
          ) : (
            <p className="font-body text-xs text-gray-500">
              Linked identities are masked for this role. Only super_admin can reveal.
            </p>
          )}
        </div>
      </div>

      {statusMessage ? (
        <div className="mb-4" aria-live="polite">
          <AdminInlineStatus
            tone={statusMessage.toLowerCase().includes('failed') || statusMessage.toLowerCase().includes('required') ? 'error' : 'info'}
            message={statusMessage}
          />
        </div>
      ) : null}

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
                className="admin-surface rounded-xl border p-5 space-y-4"
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
                  <div className="flex items-center gap-2">
                    <span
                      className="font-body text-xs uppercase tracking-[0.14em] px-3 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                    >
                      {submission.category}
                    </span>
                    <span
                      className="font-body text-xs uppercase tracking-[0.14em] px-3 py-1 rounded-full"
                      style={{ backgroundColor: '#eef2ff', color: '#3730a3' }}
                    >
                      {submission.source.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <p className="font-body text-xs text-gray-500">
                  {submission.submitter.hasLinkedAccount
                    ? submission.submitter.email
                      ? `Linked account: ${submission.submitter.displayName || 'User'} (${submission.submitter.email})`
                      : canRevealIdentity
                        ? 'Linked account: masked. Use "Reveal Linked Identities" to view.'
                        : 'Linked account: hidden by privacy policy (super_admin only)'
                    : 'Linked account: none'}
                </p>

                <p className="font-body text-sm text-gray-700 leading-relaxed">{submission.question}</p>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-[0.12em] text-gray-400 mb-2">Status</label>
                    <select
                      name="status"
                      defaultValue={submission.status}
                      className="w-full rounded-xl border px-4 py-3 text-sm admin-interactive"
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
                      className="w-full rounded-xl border px-4 py-3 text-sm admin-interactive"
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
                    className="w-full rounded-xl border px-4 py-3 text-sm admin-interactive"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="admin-interactive inline-flex rounded-full px-5 py-2.5 font-body font-semibold"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                >
                  {isSaving ? 'Saving...' : 'Save Moderation'}
                </button>

                <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <label className="block font-body text-xs uppercase tracking-[0.12em] text-gray-400 mb-2">
                    Private response to user
                  </label>
                  <textarea
                    rows={4}
                    value={responseDrafts[submission.id] || ''}
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      setResponseDrafts((prev) => ({ ...prev, [submission.id]: value }))
                    }}
                    onKeyDown={(event) => {
                      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                        event.preventDefault()
                        void sendResponse(submission.id)
                      }
                    }}
                    placeholder="Write a private response for this submission..."
                    className="w-full rounded-xl border px-4 py-3 text-sm mb-3 admin-interactive"
                    style={{ borderColor: 'var(--color-border)' }}
                  />
                  <p className="mb-3 font-body text-xs text-gray-500">Use Ctrl+Enter (or Cmd+Enter) to send quickly.</p>
                  <button
                    type="button"
                    disabled={respondingId === submission.id}
                    onClick={() => {
                      void sendResponse(submission.id)
                    }}
                    className="admin-interactive inline-flex rounded-full px-5 py-2.5 font-body font-semibold"
                    style={{ backgroundColor: '#1f2937', color: '#fff' }}
                  >
                    {respondingId === submission.id ? 'Sending response...' : 'Send Private Response'}
                  </button>
                </div>
              </form>
            )
          })
        )}
      </div>
    </section>
  )
}
