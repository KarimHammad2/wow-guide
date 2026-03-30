'use client'

import Link from 'next/link'
import { Search, Phone, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StickyBottomBarProps {
  className?: string
  buildingSlug?: string
}

export function StickyBottomBar({ className, buildingSlug }: StickyBottomBarProps) {
  const basePath = buildingSlug ? `/building/${buildingSlug}` : ''

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'bg-card/95 backdrop-blur-xl border-t border-border',
        'safe-bottom',
        className
      )}
    >
      <div className="flex items-center justify-around py-2 px-4">
        <Link
          href={`${basePath}/search`}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Search</span>
        </Link>

        <a
          href="tel:+41611234567"
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <Phone className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium text-primary">Call</span>
        </a>

        <Link
          href={`${basePath}/category/emergency`}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-destructive/10 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <span className="text-xs font-medium text-destructive">Emergency</span>
        </Link>
      </div>
    </div>
  )
}
