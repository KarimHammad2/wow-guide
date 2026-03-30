import type { ReactNode } from 'react'

export function ModuleHeader({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <header className="rounded-3xl border border-border/70 bg-card/85 backdrop-blur-md p-6 md:p-8 shadow-[0_30px_70px_-55px_rgba(0,0,0,0.65)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
        {actions}
      </div>
    </header>
  )
}
