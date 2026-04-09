/** Hourly slots for quiet-hours pickers (00:00–23:00). */
export const QUIET_HOUR_OPTIONS: { value: string; label: string }[] = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0')
  const value = `${h}:00`
  return { value, label: value }
})

const QUIET_HOUR_SET = new Set(QUIET_HOUR_OPTIONS.map((o) => o.value))

/** Sentinel for “not chosen yet” in admin selects. */
export const QUIET_HOUR_UNSET = '__unset__'

/**
 * Parse stored quiet hours like "22:00–07:00" or "22:00 - 07:00".
 * Returns normalized HH:00 strings when recognized.
 */
export function parseQuietHoursRange(s: string): { from: string; to: string } {
  const m = s.trim().match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/)
  if (!m) return { from: '', to: '' }
  const from = normalizeToHourSlot(m[1])
  const to = normalizeToHourSlot(m[2])
  return { from, to }
}

function normalizeToHourSlot(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return ''
  let h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (Number.isNaN(h)) return ''
  h = Math.min(23, Math.max(0, h))
  if (min >= 30) h = Math.min(23, h + 1)
  return `${String(h).padStart(2, '0')}:00`
}

/** Store as en-dash between times (matches existing seed copy). */
export function formatQuietHoursRange(from: string, to: string): string {
  return `${from.trim()}–${to.trim()}`
}

export function isValidQuietHourSlot(value: string): boolean {
  return QUIET_HOUR_SET.has(value)
}

/** Public guide: show em dash when unset; normalize recognized ranges to en-dash format. */
export function formatQuietHoursDisplay(stored: string): string {
  const t = stored.trim()
  if (!t) return '—'
  const { from, to } = parseQuietHoursRange(t)
  if (from && to) return formatQuietHoursRange(from, to)
  return t
}
