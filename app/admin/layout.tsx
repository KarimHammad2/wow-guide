import type { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.9)_0%,transparent_38%),radial-gradient(circle_at_top_left,hsl(var(--primary)/0.25)_0%,transparent_30%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]">
      {children}
    </div>
  )
}
