'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  AlertTriangle,
  Users,
  MapPinned,
  Hotel,
  Layers,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const baseNavItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/emergency', label: 'Emergency', icon: AlertTriangle },
  { href: '/admin/team', label: 'Team Access', icon: Users },
  { href: '/admin/cities', label: 'Cities', icon: MapPinned },
  { href: '/admin/buildings', label: 'Buildings', icon: Hotel },
  { href: '/admin/categories', label: 'Category', icon: Layers },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
] as const

export function AdminSidebarNav() {
  return <AdminSidebarNavItems collapsed={false} canManageTeam />
}

export function AdminSidebarNavItems({
  collapsed,
  canManageTeam,
  onNavigate,
}: {
  collapsed: boolean
  canManageTeam: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const navItems = canManageTeam ? baseNavItems : baseNavItems.filter((item) => item.href !== '/admin/team')

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === '/admin/buildings' && pathname.startsWith('/admin/buildings/')) ||
          (item.href === '/admin/categories' && pathname.startsWith('/admin/categories')) ||
          (item.href === '/admin/analytics' && pathname.startsWith('/admin/analytics'))

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              'group flex items-center rounded-xl text-sm transition-all',
              collapsed ? 'justify-center px-2 py-2.5' : 'gap-2 px-3 py-2',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-secondary'
            )}
          >
            <item.icon className={cn('shrink-0', collapsed ? 'w-4.5 h-4.5' : 'w-4 h-4')} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
