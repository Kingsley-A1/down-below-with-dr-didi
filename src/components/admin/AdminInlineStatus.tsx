type Tone = 'info' | 'success' | 'warning' | 'error'

type AdminInlineStatusProps = {
  tone?: Tone
  message: string
}

const TONE_CLASSNAME: Record<Tone, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
}

export default function AdminInlineStatus({ tone = 'info', message }: AdminInlineStatusProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border px-4 py-2.5 font-body text-sm ${TONE_CLASSNAME[tone]}`}
    >
      {message}
    </div>
  )
}
