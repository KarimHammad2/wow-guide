'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLucideIcon, isCategoryIconImageUrl } from '@/lib/icons'

export function CategoryIconDisplay({
  icon,
  className,
  imgClassName,
  label,
}: {
  icon: string
  className?: string
  imgClassName?: string
  label?: string
}) {
  if (isCategoryIconImageUrl(icon)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote Supabase URLs; unoptimized global
      <img
        src={icon}
        alt=""
        className={cn('object-cover', imgClassName)}
        aria-hidden={!label}
      />
    )
  }

  const Icon = getLucideIcon(icon) as LucideIcon
  return <Icon className={className} aria-hidden />
}
