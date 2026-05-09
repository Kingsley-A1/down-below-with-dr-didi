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
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No audit logs found</p>
      </div>
    )
  }

  const getActionColor = (action: string): string => {
    if (action.includes('created') || action.includes('register')) return 'bg-blue-50 border-l-4 border-blue-500'
    if (action.includes('login')) return 'bg-green-50 border-l-4 border-green-500'
    if (action.includes('deactivated')) return 'bg-red-50 border-l-4 border-red-500'
    if (action.includes('activated')) return 'bg-green-50 border-l-4 border-green-500'
    if (action.includes('password')) return 'bg-yellow-50 border-l-4 border-yellow-500'
    if (action.includes('updated') || action.includes('changed')) return 'bg-purple-50 border-l-4 border-purple-500'
    return 'bg-gray-50 border-l-4 border-gray-500'
  }

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'user.created': '👤 User Created',
      'user.register': '📝 Registration',
      'user.email_verified': '✅ Email Verified',
      'user.login_success': '🔓 Login Success',
      'user.login_failed': '❌ Login Failed',
      'user.password_changed': '🔑 Password Changed',
      'user.password_reset_requested': '🔄 Reset Requested',
      'user.profile_updated': '✏️ Profile Updated',
      'user.deactivated': '❌ Deactivated',
      'user.activated': '✅ Activated',
    }
    return labels[action] || action
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className={`p-4 rounded-lg ${getActionColor(log.action)}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-gray-800">{getActionLabel(log.action)}</h4>
              <p className="text-sm text-gray-600 mt-1">{log.summary}</p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
            </span>
          </div>
          {(log.ipAddress || log.userAgent) && (
            <div className="text-xs text-gray-500 space-y-1 mt-2 border-t border-current border-opacity-20 pt-2">
              {log.ipAddress && <p>📍 IP: {log.ipAddress}</p>}
              {log.userAgent && <p>🌐 Agent: {log.userAgent.substring(0, 50)}...</p>}
            </div>
          )}
          {!log.success && (
            <div className="text-xs text-red-600 mt-2">⚠️ Action Failed</div>
          )}
        </div>
      ))}
    </div>
  )
}
