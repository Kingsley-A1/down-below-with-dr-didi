export default function AdminLoading() {
  return (
    <div className="admin-fade-in min-h-[60vh] w-full bg-(--color-surface)">
      <div className="mx-auto max-w-container px-4 py-10 md:px-6">
        <div className="mb-6 h-14 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-44 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  )
}
