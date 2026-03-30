import type { ReactNode } from 'react'

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_100%_-20%,oklch(0.52_0.1_350/0.14),transparent_50%),radial-gradient(ellipse_100%_60%_at_0%_100%,oklch(0.94_0.12_95/0.28),transparent_55%)]"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
