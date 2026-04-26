import type { AdminCategoryIconName } from './category-lucide-icons'
import { ADMIN_CATEGORY_ICON_OPTIONS } from './category-lucide-icons'

export type InlineIconKind = 'lucide' | 'symbol'

export interface InlineIconOption {
  id: string
  kind: InlineIconKind
  name: string
  label: string
  symbol: string
}

const LUCIDE_ICON_SYMBOLS: Record<AdminCategoryIconName, string> = {
  BookOpen: '📖',
  Wifi: '📶',
  Key: '🔑',
  KeyRound: '🗝️',
  Car: '🚗',
  Trash2: '🗑️',
  Sparkles: '✨',
  AlertTriangle: '⚠️',
  Bike: '🚲',
  Dumbbell: '🏋️',
  Home: '🏠',
  Shirt: '👕',
  Users: '👥',
  MapPin: '📍',
  Phone: '☎️',
  Mail: '✉️',
  Smartphone: '📱',
  Search: '🔍',
  QrCode: '▣',
  Camera: '📷',
  Spotify: '🎵',
  Clock: '⏰',
  Package: '📦',
  Lightbulb: '💡',
  WashingMachine: '🧺',
  Archive: '🗄️',
  LogOut: '🚪',
  CircleCheck: '✅',
  HousePlug: '🔌',
}

const SYMBOL_ICON_OPTIONS: InlineIconOption[] = [
  { id: 'symbol:star', kind: 'symbol', name: 'Star', label: 'Star', symbol: '★' },
  { id: 'symbol:sparkle', kind: 'symbol', name: 'Sparkle', label: 'Sparkle', symbol: '✦' },
  { id: 'symbol:check', kind: 'symbol', name: 'Check', label: 'Check', symbol: '✓' },
  { id: 'symbol:bullet', kind: 'symbol', name: 'Bullet', label: 'Bullet', symbol: '•' },
  { id: 'symbol:arrow', kind: 'symbol', name: 'Arrow', label: 'Arrow', symbol: '➜' },
  { id: 'symbol:pin', kind: 'symbol', name: 'Pin', label: 'Pin', symbol: '⌂' },
  { id: 'symbol:info', kind: 'symbol', name: 'Info', label: 'Info', symbol: 'ⓘ' },
  { id: 'symbol:warning', kind: 'symbol', name: 'Warning', label: 'Warning', symbol: '⚠' },
  { id: 'symbol:phone', kind: 'symbol', name: 'Phone', label: 'Phone', symbol: '☎' },
  { id: 'symbol:mail', kind: 'symbol', name: 'Mail', label: 'Mail', symbol: '✉' },
  { id: 'symbol:clock', kind: 'symbol', name: 'Clock', label: 'Clock', symbol: '⏰' },
  { id: 'symbol:key', kind: 'symbol', name: 'Key', label: 'Key', symbol: '🔑' },
  { id: 'symbol:light', kind: 'symbol', name: 'Light', label: 'Light', symbol: '💡' },
  { id: 'symbol:link', kind: 'symbol', name: 'Link', label: 'Link', symbol: '↗' },
  { id: 'symbol:music', kind: 'symbol', name: 'Music', label: 'Music', symbol: '♪' },
  { id: 'symbol:leaf', kind: 'symbol', name: 'Leaf', label: 'Leaf', symbol: '❧' },
]

function humanizeIconName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())
}

export const INLINE_LUCIDE_ICON_OPTIONS: InlineIconOption[] = ADMIN_CATEGORY_ICON_OPTIONS.map((name) => ({
  id: `lucide:${name}`,
  kind: 'lucide',
  name,
  label: humanizeIconName(name),
  symbol: LUCIDE_ICON_SYMBOLS[name],
}))

export const INLINE_SYMBOL_ICON_OPTIONS = SYMBOL_ICON_OPTIONS

export const INLINE_ICON_OPTIONS = {
  lucide: INLINE_LUCIDE_ICON_OPTIONS,
  symbol: INLINE_SYMBOL_ICON_OPTIONS,
} as const
