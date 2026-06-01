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
    <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-48 bg-linear-to-l from-emerald-100/45 to-transparent" />
      <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-body text-xs uppercase tracking-[0.22em] text-emerald-700">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-4xl font-body text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div> : null}
      </div>
    </section>
  )
}
