'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { LogOut, Mail, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminSidebarNavItems } from '@/components/admin/admin-sidebar-nav'
import { WowWordmark } from '@/components/site/wow-wordmark'
import { cn } from '@/lib/utils'

export function AdminShell({
  userEmail,
  canManageTeam,
  onLogout,
  summary,
  children,
}: {
  userEmail: string | null
  canManageTeam: boolean
  onLogout: () => void
  summary?: Array<{ label: string; value: string | number }>
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const stored = globalThis.localStorage?.getItem('admin_sidebar_collapsed')
    if (stored === '1') {
      setCollapsed(true)
    }
  }, [])

  useEffect(() => {
    globalThis.localStorage?.setItem('admin_sidebar_collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <main className="w-full px-3 py-4 md:px-6 md:py-6 lg:min-h-screen">
      <div className="grid w-full gap-5 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[auto_1fr] lg:items-stretch">
        <div className="lg:hidden flex items-center justify-between rounded-2xl border border-border/70 bg-card/90 px-3 py-2 safe-top">
          <div className="inline-flex min-w-0 items-center gap-2">
            <WowWordmark className="h-7" />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
        </div>

        {mobileOpen && (
          <button
            aria-label="Close sidebar overlay"
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={cn(
            'z-40 lg:z-auto',
            'lg:sticky lg:top-0 lg:self-stretch',
            'fixed lg:relative left-0 top-0 h-screen lg:h-full',
            'transition-all duration-200',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div
            className={cn(
              'h-full lg:h-full rounded-r-3xl lg:rounded-3xl border border-border/70 bg-card/95 backdrop-blur-md p-3 shadow-[0_24px_55px_-45px_rgba(0,0,0,0.7)]',
              'flex flex-col',
              collapsed ? 'w-20' : 'w-72'
            )}
          >
            <div
              className={cn(
                'relative flex items-center',
                collapsed ? 'justify-center pt-3 pb-1' : 'justify-center px-1 min-h-10'
              )}
            >
              <div className={cn('flex w-full min-w-0 items-center justify-center pr-11', collapsed && 'hidden')}>
                <WowWordmark />
              </div>

              <Button
                variant="ghost"
                size="icon"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!collapsed}
                className={cn(
                  'hidden lg:inline-flex',
                  collapsed
                    ? 'relative size-10 shrink-0 rounded-xl border border-border/60 bg-muted/45 text-foreground shadow-sm hover:bg-muted/70 hover:border-border/80'
                    : 'absolute right-1 top-1/2 -translate-y-1/2'
                )}
                onClick={() => setCollapsed((v) => !v)}
              >
                {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </Button>
            </div>

            <div className={cn('mt-3', !collapsed && 'mt-4')}>
              <AdminSidebarNavItems
                collapsed={collapsed}
                canManageTeam={canManageTeam}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>

            <div
              className={cn(
                'mt-auto border-t border-border/50 pt-4',
                collapsed ? 'flex flex-col items-center gap-3 px-0' : 'flex flex-col gap-3 px-1'
              )}
            >
              {!collapsed ? (
                <>
                  <p
                    className="text-center text-sm font-medium text-foreground leading-snug break-words"
                    title={userEmail ?? undefined}
                  >
                    {userEmail ?? '—'}
                  </p>
                  <Button variant="outline" className="w-full gap-2 rounded-lg" onClick={onLogout} type="button">
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex justify-center" title={userEmail ?? undefined}>
                    <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={onLogout}
                    type="button"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-6 min-w-0">
          {summary && summary.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {summary.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm"
                >
                  <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
                  <div className="text-lg font-semibold tabular-nums">{item.value}</div>
                </div>
              ))}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </main>
  )
}
