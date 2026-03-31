'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { LogOut, PanelLeftClose, PanelLeftOpen, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminSidebarNavItems } from '@/components/admin/admin-sidebar-nav'
import { cn } from '@/lib/utils'

export function AdminShell({
  access,
  onLogout,
  summary,
  children,
}: {
  access: 'read-only' | 'full-access'
  onLogout: () => void
  summary?: Array<{ label: string; value: string | number }>
  children: ReactNode
}) {
  const canEdit = access === 'full-access'
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
        <div className="lg:hidden flex items-center justify-between rounded-2xl border border-border/70 bg-card/90 px-3 py-2">
          <div className="inline-flex items-center gap-2">
            <div className="relative h-7 w-20">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                sizes="80px"
                className="object-contain object-left"
                priority
              />
            </div>
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
                collapsed ? 'justify-center' : 'justify-center px-1'
              )}
            >
              <div className={cn('inline-flex items-center justify-center w-full', collapsed && 'hidden')}>
                <div className="relative h-8 w-24">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    fill
                    sizes="96px"
                    className="object-contain object-center"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex absolute right-1"
                onClick={() => setCollapsed((v) => !v)}
              >
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </Button>
            </div>

            <div className={cn('mt-4', collapsed && 'mt-5')}>
              <AdminSidebarNavItems collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
            </div>

            <div className={cn('mt-auto pt-4 flex items-center gap-2 px-1', collapsed ? 'flex-col' : '')}>
              <Badge
                variant={canEdit ? 'default' : 'secondary'}
                className={cn('h-8', collapsed ? 'w-full justify-center px-0' : 'px-3')}
                title={collapsed ? access : undefined}
              >
                <Shield className={cn('w-3.5 h-3.5', !collapsed && 'mr-1.5')} />
                {!collapsed && access}
              </Badge>
              <Button
                variant="outline"
                onClick={onLogout}
                className={cn('gap-2', collapsed ? 'w-full px-0' : 'flex-1')}
                title={collapsed ? 'Logout' : undefined}
              >
                <LogOut className="w-4 h-4" />
                {!collapsed && 'Logout'}
              </Button>
            </div>
          </div>
        </aside>

        <div className="space-y-6 min-w-0">{children}</div>
      </div>
    </main>
  )
}
