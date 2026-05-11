'use client'

import { useMemo, useState } from 'react'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import AdminInlineStatus from '@/components/admin/AdminInlineStatus'
import type { SiteAlertRecord } from '@/lib/admin/repository'

type AlertState = 'active' | 'scheduled' | 'inactive' | 'expired'

type FormState = {
  text: string
  speed: number
  durationSeconds: number
  isActive: boolean
  startsAt: string
  endsAt: string
}

const EMPTY_FORM: FormState = {
  text: '',
  speed: 100,
  durationSeconds: 24,
  isActive: true,
  startsAt: new Date().toISOString().slice(0, 16),
  endsAt: '',
}

function toDateTimeLocal(value: string) {
  return new Date(value).toISOString().slice(0, 16)
}

function toIsoOrEmpty(value: string) {
  if (!value.trim()) {
    return ''
  }

  return new Date(value).toISOString()
}

function getAlertState(alert: SiteAlertRecord): AlertState {
  const now = Date.now()
  const startsAt = new Date(alert.startsAt).getTime()
  const endsAt = alert.endsAt ? new Date(alert.endsAt).getTime() : null

  if (!alert.isActive) {
    return 'inactive'
  }

  if (startsAt > now) {
    return 'scheduled'
  }

  if (endsAt !== null && endsAt <= now) {
    return 'expired'
  }

  return 'active'
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not set'
  }

  return new Date(value).toLocaleString()
}

export default function AlertsBoard({ initialAlerts }: { initialAlerts: SiteAlertRecord[] }) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [pendingDeleteAlert, setPendingDeleteAlert] = useState<SiteAlertRecord | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const alertStateMap = useMemo(() => {
    const map = new Map<string, AlertState>()

    for (const alert of alerts) {
      map.set(alert.id, getAlertState(alert))
    }

    return map
  }, [alerts])

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alertStateMap.get(alert.id) === 'active'),
    [alerts, alertStateMap]
  )

  const historyAlerts = useMemo(
    () => alerts.filter((alert) => alertStateMap.get(alert.id) !== 'active'),
    [alerts, alertStateMap]
  )

  async function refresh() {
    const response = await fetch('/api/admin/alerts', { cache: 'no-store' })
    const data = await response.json()
    setAlerts(data.alerts ?? [])
  }

  function set(field: keyof FormState, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function startCreate() {
    setEditId(null)
    setForm({
      ...EMPTY_FORM,
      startsAt: new Date().toISOString().slice(0, 16),
    })
    setShowForm(true)
    setMessage('')
  }

  function startEdit(alert: SiteAlertRecord) {
    setEditId(alert.id)
    setForm({
      text: alert.text,
      speed: alert.speed,
      durationSeconds: alert.durationSeconds,
      isActive: alert.isActive,
      startsAt: toDateTimeLocal(alert.startsAt),
      endsAt: alert.endsAt ? toDateTimeLocal(alert.endsAt) : '',
    })
    setShowForm(true)
    setMessage('')
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm({
      ...EMPTY_FORM,
      startsAt: new Date().toISOString().slice(0, 16),
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    try {
      const payload = {
        text: form.text,
        speed: Number(form.speed),
        durationSeconds: Number(form.durationSeconds),
        isActive: form.isActive,
        startsAt: toIsoOrEmpty(form.startsAt),
        endsAt: toIsoOrEmpty(form.endsAt),
      }

      const url = editId ? `/api/admin/alerts/${editId}` : '/api/admin/alerts'
      const method = editId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error ?? 'Unable to save alert')
        return
      }

      await refresh()
      setMessage(editId ? 'Alert updated.' : 'Alert created.')
      cancelForm()
    } catch {
      setMessage('Unable to save alert right now.')
    } finally {
      setBusy(false)
    }
  }

  function requestDelete(alert: SiteAlertRecord) {
    setPendingDeleteAlert(alert)
  }

  async function confirmDelete() {
    if (!pendingDeleteAlert) {
      return
    }

    setBusy(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/alerts/${pendingDeleteAlert.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error ?? 'Unable to delete alert')
        return
      }

      await refresh()
      setMessage('Alert deleted.')
      setPendingDeleteAlert(null)
    } catch {
      setMessage('Unable to delete alert right now.')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleActive(alert: SiteAlertRecord) {
    setBusy(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/alerts/${alert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !alert.isActive }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error ?? 'Unable to update alert status')
        return
      }

      await refresh()
      setMessage(alert.isActive ? 'Alert paused.' : 'Alert activated.')
    } catch {
      setMessage('Unable to update alert status.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-6 admin-fade-in">
      <div className="admin-surface bg-white rounded-2xl border p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
            Site Alerts
          </h1>
          <p className="font-body text-sm text-gray-500">
            Manage the running notice under the public header. Control text, speed, duration, and schedule.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="admin-interactive font-body text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          + Add Alert
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active now" value={activeAlerts.length} />
        <StatCard label="Total alerts" value={alerts.length} />
        <StatCard label="History records" value={historyAlerts.length} />
      </div>

      {message ? <div aria-live="polite"><AdminInlineStatus tone="info" message={message} /></div> : null}

      {showForm ? (
        <div className="admin-surface bg-white rounded-2xl border p-6 space-y-5" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            {editId ? 'Edit alert' : 'Create alert'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Field label="Alert text *">
                <textarea
                  required
                  minLength={10}
                  maxLength={500}
                  rows={3}
                  value={form.text}
                  onChange={(event) => set('text', event.target.value)}
                  className="input-field"
                />
              </Field>
            </div>

            <Field label="Speed (40-220)">
              <input
                type="number"
                min={40}
                max={220}
                value={form.speed}
                onChange={(event) => set('speed', Number(event.target.value))}
                className="input-field"
              />
            </Field>

            <Field label="Duration in seconds (8-180)">
              <input
                type="number"
                min={8}
                max={180}
                value={form.durationSeconds}
                onChange={(event) => set('durationSeconds', Number(event.target.value))}
                className="input-field"
              />
            </Field>

            <Field label="Starts at">
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => set('startsAt', event.target.value)}
                className="input-field"
              />
            </Field>

            <Field label="Ends at (optional)">
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => set('endsAt', event.target.value)}
                className="input-field"
              />
            </Field>

            <label className="flex items-center gap-2 lg:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => set('isActive', event.target.checked)}
              />
              <span className="font-body text-sm text-gray-700">Set as active</span>
            </label>

            <div className="lg:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelForm}
                className="admin-interactive font-body text-sm px-5 py-2.5 rounded-xl border transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="admin-interactive font-body text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {busy ? 'Saving...' : editId ? 'Update alert' : 'Create alert'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="admin-surface bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            Active alerts
          </h3>
          <p className="font-body text-sm text-gray-500">Alerts currently displayed under the public header.</p>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="p-6 font-body text-sm text-gray-500">No active alerts at the moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <th className="px-4 py-3 font-semibold text-gray-500">Text</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Speed</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Duration</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Starts</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Ends</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b last:border-0 transition-colors hover:bg-slate-50" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 max-w-md text-gray-700">{alert.text}</td>
                    <td className="px-4 py-3">{alert.speed}</td>
                    <td className="px-4 py-3">{alert.durationSeconds}s</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(alert.startsAt)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(alert.endsAt)}</td>
                    <td className="px-4 py-3">
                      <ActionButtons
                        alert={alert}
                        busy={busy}
                        onEdit={startEdit}
                        onToggle={handleToggleActive}
                        onDelete={requestDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-surface bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-heading text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            Alert history
          </h3>
          <p className="font-body text-sm text-gray-500">Inactive, scheduled, and expired alerts.</p>
        </div>

        {historyAlerts.length === 0 ? (
          <div className="p-6 font-body text-sm text-gray-500">No history yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                  <th className="px-4 py-3 font-semibold text-gray-500">State</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Text</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Updated</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyAlerts.map((alert) => {
                  const state = alertStateMap.get(alert.id) || 'inactive'

                  return (
                    <tr key={alert.id} className="border-b last:border-0 transition-colors hover:bg-slate-50" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide" style={stateStyle(state)}>
                          {state}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-lg text-gray-700">{alert.text}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(alert.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <ActionButtons
                          alert={alert}
                          busy={busy}
                          onEdit={startEdit}
                          onToggle={handleToggleActive}
                          onDelete={requestDelete}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={Boolean(pendingDeleteAlert)}
        title="Delete site alert"
        message={pendingDeleteAlert ? `Delete this alert permanently? \"${pendingDeleteAlert.text}\"` : ''}
        confirmLabel="Delete alert"
        confirmTone="danger"
        busy={busy}
        onCancel={() => {
          if (!busy) {
            setPendingDeleteAlert(null)
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
      <span className="font-body text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="admin-surface rounded-2xl border bg-white px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
      <p className="font-body text-xs uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
        {value}
      </p>
    </article>
  )
}

function ActionButtons({
  alert,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  alert: SiteAlertRecord
  busy: boolean
  onEdit: (alert: SiteAlertRecord) => void
  onToggle: (alert: SiteAlertRecord) => void
  onDelete: (alert: SiteAlertRecord) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onEdit(alert)}
        className="admin-interactive text-xs font-semibold px-3 py-1 rounded-lg"
        style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => onToggle(alert)}
        disabled={busy}
        className="admin-interactive text-xs font-semibold px-3 py-1 rounded-lg border"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
      >
        {alert.isActive ? 'Pause' : 'Activate'}
      </button>
      <button
        type="button"
        onClick={() => onDelete(alert)}
        disabled={busy}
        className="admin-interactive text-xs font-semibold px-3 py-1 rounded-lg bg-red-50 text-red-600 disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  )
}

function stateStyle(state: AlertState) {
  if (state === 'active') {
    return { backgroundColor: '#dcfce7', color: '#166534' }
  }

  if (state === 'scheduled') {
    return { backgroundColor: '#dbeafe', color: '#1e40af' }
  }

  if (state === 'expired') {
    return { backgroundColor: '#fef3c7', color: '#92400e' }
  }

  return { backgroundColor: '#e5e7eb', color: '#374151' }
}
