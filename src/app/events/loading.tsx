export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-container space-y-6 px-6 py-16">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  )
}
