export default function RootLoading() {
  return (
    <div className="min-h-[60vh] w-full animate-pulse bg-(--color-surface)">
      <div className="max-w-container mx-auto px-6 py-20">
        <div className="h-5 w-32 rounded-full bg-slate-200" />
        <div className="mt-6 h-10 w-3/5 rounded-2xl bg-slate-200" />
        <div className="mt-3 h-4 w-2/3 rounded-xl bg-slate-200" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-40 rounded-3xl bg-slate-200" />
          <div className="h-40 rounded-3xl bg-slate-200" />
          <div className="h-40 rounded-3xl bg-slate-200" />
        </div>
      </div>
    </div>
  )
}
