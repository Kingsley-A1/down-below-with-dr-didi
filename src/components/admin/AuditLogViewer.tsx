'use client'

import { PublicUserAuditLogRecord } from '@/lib/admin/user-repository'
import { formatDistanceToNow } from 'date-fns'

interface AuditLogViewerProps {
  logs: PublicUserAuditLogRecord[]
  isLoading?: boolean
}

/**
 * Component to display user audit logs
 */
export default function AuditLogViewer({ logs, isLoading = false }: AuditLogViewerProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="font-body text-sm text-slate-600">No audit events recorded for this account yet.</p>
      </div>
    )
  }

  const getActionColor = (action: string): string => {
    if (action.includes('created') || action.includes('register')) return 'border-blue-200 bg-blue-50'
    if (action.includes('login')) return 'border-emerald-200 bg-emerald-50'
    if (action.includes('deactivated')) return 'border-rose-200 bg-rose-50'
    if (action.includes('activated')) return 'border-emerald-200 bg-emerald-50'
    if (action.includes('password')) return 'border-amber-200 bg-amber-50'
    if (action.includes('updated') || action.includes('changed')) return 'border-violet-200 bg-violet-50'
    return 'border-slate-200 bg-slate-50'
  }

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'user.created': 'User Created',
      'user.register': 'User Registration',
      'user.email_verified': 'Email Verified',
      'user.login_success': 'Login Success',
      'user.login_failed': 'Login Failed',
      'user.password_changed': 'Password Changed',
      'user.password_reset_requested': 'Password Reset Requested',
      'user.profile_updated': 'Profile Updated',
      'user.deactivated': 'User Deactivated',
      'user.activated': 'User Activated',
    }
    return labels[action] || action
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <article key={log.id} className={`rounded-xl border p-4 ${getActionColor(log.action)}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-body text-sm font-semibold text-slate-900">{getActionLabel(log.action)}</h4>
              <p className="mt-1 font-body text-sm text-slate-600">{log.summary}</p>
            </div>
            <span className="ml-4 whitespace-nowrap font-body text-xs text-slate-500">
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
            </span>
          </div>
          {(log.ipAddress || log.userAgent) && (
            <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 font-body text-xs text-slate-500">
              {log.ipAddress ? <p>IP: {log.ipAddress}</p> : null}
              {log.userAgent ? <p>Agent: {log.userAgent.substring(0, 50)}...</p> : null}
            </div>
          )}
          {!log.success && (
            <div className="mt-2 font-body text-xs font-semibold text-rose-700">Action failed</div>
          )}
        </article>
      ))}
    </div>
  )
}
