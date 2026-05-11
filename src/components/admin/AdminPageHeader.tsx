type AdminPageHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
  actions?: React.ReactNode
}

export default function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
}: AdminPageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-64 bg-linear-to-l from-emerald-100/60 to-transparent" />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="font-body text-xs uppercase tracking-[0.22em] text-emerald-700">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1 font-heading text-3xl font-bold text-slate-900">{title}</h1>
          {description ? <p className="mt-3 max-w-3xl font-body text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  )
}
