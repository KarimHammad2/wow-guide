'use client'

import Link from 'next/link'
import { Mail, Search } from 'lucide-react'
import { buildings } from '@/lib/data'
import { cn } from '@/lib/utils'

interface StickyBottomBarProps {
  className?: string
  buildingSlug?: string
}

export function StickyBottomBar({ className, buildingSlug }: StickyBottomBarProps) {
  const basePath = buildingSlug ? `/building/${buildingSlug}` : ''
  const supportEmail =
    (buildingSlug && buildings.find((b) => b.id === buildingSlug)?.supportEmail) ?? 'mail@wowliving.ch'

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'bg-card/95 backdrop-blur-xl border-t border-border',
        'safe-bottom',
        className
      )}
    >
      <div className="flex items-center justify-center gap-12 py-2 px-4">
        <Link
          href={`${basePath}/search`}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Search</span>
        </Link>

        <a
          href={`mailto:${supportEmail}`}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <Mail className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium text-primary">Contact</span>
        </a>
      </div>
    </div>
  )
}
