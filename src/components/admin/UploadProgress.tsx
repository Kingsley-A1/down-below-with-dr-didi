type UploadProgressProps = {
  active?: boolean
  label: string
  detail?: string
  value?: number
  className?: string
}

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export default function UploadProgress({
  active = true,
  label,
  detail,
  value,
  className = '',
}: UploadProgressProps) {
  if (!active) return null

  const isDeterminate = typeof value === 'number'
  const progress = isDeterminate ? clampProgress(value) : undefined

  return (
    <div
      className={`upload-progress rounded-xl px-4 py-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="font-body text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
            {label}
          </p>
          {detail ? (
            <p className="font-body text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {detail}
            </p>
          ) : null}
        </div>
        {isDeterminate ? (
          <span className="font-body text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
            {progress}%
          </span>
        ) : null}
      </div>
      <div
        className="upload-progress__track h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-valuetext={isDeterminate ? `${progress}% complete` : 'Upload in progress'}
      >
        <div
          className={`upload-progress__bar h-full rounded-full ${isDeterminate ? '' : 'upload-progress__bar--indeterminate'}`}
          style={isDeterminate ? { width: `${progress}%` } : undefined}
        />
      </div>
    </div>
  )
}
