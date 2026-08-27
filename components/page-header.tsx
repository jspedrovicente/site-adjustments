export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return <header className="relative flex flex-col gap-4 overflow-hidden border-b border-white/10 bg-slate-950/55 px-5 py-6 text-slate-100 backdrop-blur-md before:absolute before:-right-16 before:-top-24 before:size-56 before:rounded-full before:bg-violet-500/15 before:blur-3xl sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
    <div className="relative">
      {eyebrow && <p className="font-mono text-xs font-semibold uppercase tracking-[.16em] text-indigo-300"><span className="mr-1 text-cyan-300">{"//"}</span>{eyebrow}</p>}
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p>}
    </div>
    <div className="relative">{actions}</div>
  </header>;
}
