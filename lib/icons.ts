import type { LucideIcon } from 'lucide-react'
import { HelpCircle } from 'lucide-react'
import { LUCIDE_ICON_MAP } from './category-lucide-icons'

export function getLucideIcon(iconName: string): LucideIcon {
  const fromMap = LUCIDE_ICON_MAP[iconName]
  if (fromMap) return fromMap
  return HelpCircle
}

/** True when `icon` stores an uploaded image URL (or public path) instead of a Lucide name. */
export function isCategoryIconImageUrl(icon: string | null | undefined): boolean {
  if (!icon || typeof icon !== 'string') return false
  return /^https?:\/\//i.test(icon) || icon.startsWith('/')
}
