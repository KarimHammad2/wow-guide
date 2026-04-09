const UNSAFE_SCHEME_PATTERN = /^\s*(?:javascript|data|vbscript|file):/i

function normalizeInput(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function isSafeRelativePath(value: string | null | undefined): boolean {
  const normalized = normalizeInput(value)
  return normalized.startsWith('/') && !normalized.startsWith('//')
}

export function isSafeHttpUrl(value: string | null | undefined): boolean {
  const normalized = normalizeInput(value)
  if (!normalized || UNSAFE_SCHEME_PATTERN.test(normalized)) return false
  try {
    const parsed = new URL(normalized)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isSafeNavigationTarget(
  value: string | null | undefined,
  options?: { allowRelative?: boolean }
): boolean {
  const normalized = normalizeInput(value)
  if (!normalized || UNSAFE_SCHEME_PATTERN.test(normalized)) return false
  if (options?.allowRelative !== false && isSafeRelativePath(normalized)) return true
  return isSafeHttpUrl(normalized)
}

export function normalizeSafeNavigationTarget(
  value: string | null | undefined,
  options?: { fallback?: string; allowRelative?: boolean }
): string {
  const fallback = options?.fallback ?? '#'
  return isSafeNavigationTarget(value, options) ? normalizeInput(value) : fallback
}

export function normalizeSafeEmbedUrl(value: string | null | undefined): string | null {
  return isSafeHttpUrl(value) ? normalizeInput(value) : null
}
