import Link from 'next/link'

type AdminDataLoadAlertProps = {
  title: string
  message: string
  requestId: string
  retryPath: string
}

export default function AdminDataLoadAlert({
  title,
  message,
  requestId,
  retryPath,
}: AdminDataLoadAlertProps) {
  return (
    <section
      className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5"
      role="status"
      aria-live="polite"
    >
      <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
        Data load warning
      </p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-amber-900">{title}</h1>
      <p className="mt-2 font-body text-sm text-amber-800">{message}</p>
      <p className="mt-2 font-body text-xs text-amber-700">
        Reference ID: <span className="font-semibold">{requestId}</span>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={retryPath}
          className="rounded-full bg-amber-800 px-4 py-2 font-body text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Retry this page
        </Link>
        <Link
          href="/admin"
          className="rounded-full border border-amber-700 px-4 py-2 font-body text-xs font-semibold text-amber-800"
        >
          Back to dashboard
        </Link>
        <Link
          href="/admin/media"
          className="rounded-full border border-amber-700 px-4 py-2 font-body text-xs font-semibold text-amber-800"
        >
          Open media library
        </Link>
      </div>
    </section>
  )
}
