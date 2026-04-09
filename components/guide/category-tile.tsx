'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/data'
import { CategoryIconDisplay } from '@/components/guide/category-icon'

interface CategoryTileProps {
  category: Category
  size?: 'default' | 'large'
  buildingSlug?: string
}

const colorStyles: Record<
  Category['color'],
  { tile: string; icon: string }
> = {
  primary: {
    tile:
      'bg-primary/10 hover:bg-primary/15 border-primary/15 dark:bg-primary/20 dark:hover:bg-primary/30 dark:border-primary/25',
    icon: 'bg-primary text-primary-foreground',
  },
  accent: {
    tile:
      'bg-accent/10 hover:bg-accent/15 border-accent/25 dark:bg-accent/15 dark:hover:bg-accent/25 dark:border-accent/30',
    icon: 'bg-accent text-accent-foreground',
  },
  muted: {
    tile: 'bg-secondary/80 hover:bg-secondary border-border dark:bg-secondary/50 dark:hover:bg-secondary/70',
    icon: 'bg-secondary text-foreground border border-border',
  },
}

export function CategoryTile({ category, size = 'default', buildingSlug }: CategoryTileProps) {
  const palette = colorStyles[category.color] ?? colorStyles.primary
  const tileClass = palette.tile
  const iconClass = palette.icon

  const href = buildingSlug 
    ? `/${buildingSlug}/category/${category.slug}`
    : `/category/${category.slug}`

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200',
        'active:scale-[0.98]',
        tileClass,
        size === 'large' && 'p-5'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-xl transition-transform group-hover:scale-105 overflow-hidden shrink-0',
          iconClass,
          size === 'large' ? 'w-14 h-14' : 'w-12 h-12'
        )}
      >
        <CategoryIconDisplay
          icon={category.icon}
          className={cn(size === 'large' ? 'w-7 h-7' : 'w-6 h-6')}
          imgClassName={cn('w-full h-full', size === 'large' ? 'min-h-14 min-w-14' : 'min-h-12 min-w-12')}
        />
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
