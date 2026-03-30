import type { LucideIcon } from 'lucide-react'
import { HelpCircle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

export function getLucideIcon(iconName: string): LucideIcon {
  const icon = (LucideIcons as Record<string, unknown>)[iconName]
  return typeof icon === 'function' ? (icon as LucideIcon) : HelpCircle
}
