'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/data'
import { getLucideIcon } from '@/lib/icons'

interface CategoryTileProps {
  category: Category
  size?: 'default' | 'large'
  buildingSlug?: string
}

export function CategoryTile({ category, size = 'default', buildingSlug }: CategoryTileProps) {
  const Icon = getLucideIcon(category.icon)

  const colorClasses = {
    primary: 'bg-primary/5 hover:bg-primary/10 border-primary/10',
    accent: 'bg-accent/30 hover:bg-accent/50 border-accent/30',
    muted: 'bg-secondary hover:bg-secondary/80 border-secondary',
  }

  const iconColorClasses = {
    primary: 'bg-primary text-primary-foreground',
    accent: 'bg-accent text-accent-foreground',
    muted: 'bg-muted-foreground/20 text-foreground',
  }

  const href = buildingSlug 
    ? `/building/${buildingSlug}/category/${category.slug}`
    : `/category/${category.slug}`

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200',
        'active:scale-[0.98]',
        colorClasses[category.color],
        size === 'large' && 'p-5'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-xl transition-transform group-hover:scale-105',
          iconColorClasses[category.color],
          size === 'large' ? 'w-14 h-14' : 'w-12 h-12'
        )}
      >
        <Icon className={cn(size === 'large' ? 'w-7 h-7' : 'w-6 h-6')} />
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            'font-semibold text-foreground truncate',
            size === 'large' ? 'text-lg' : 'text-base'
          )}
        >
          {category.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">
          {category.subtitle}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </Link>
  )
}
