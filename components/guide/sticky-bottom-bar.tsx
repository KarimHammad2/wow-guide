'use client'

import Link from 'next/link'
import { Mail, Search } from 'lucide-react'
import { DEFAULT_SUPPORT_EMAIL } from '@/lib/emergency-defaults'
import { cn } from '@/lib/utils'

interface StickyBottomBarProps {
  className?: string
  buildingSlug?: string
  supportEmail?: string
}

export function StickyBottomBar({ className, buildingSlug, supportEmail }: StickyBottomBarProps) {
  const basePath = buildingSlug ? `/${buildingSlug}` : ''
  const resolvedSupportEmail =
    supportEmail?.trim() ||
    DEFAULT_SUPPORT_EMAIL

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'bg-card/95 backdrop-blur-xl border-t border-border',
        'safe-bottom',
        className
      )}
    >
      <div className="flex items-center justify-center gap-8 min-[380px]:gap-12 py-2 px-4 max-w-lg mx-auto">
        <Link
          href={`${basePath}/search`}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Search</span>
        </Link>

        <a
          href={`mailto:${resolvedSupportEmail}`}
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <Mail className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium text-primary">Contact</span>
        </a>
      </div>
    </div>
  )
}
