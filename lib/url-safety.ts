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

/** Looks like user omitted the scheme, e.g. example.com/path or //example.com/path */
function hasExplicitNonHttpScheme(normalized: string): boolean {
  return /^[\w+.-]+:/i.test(normalized)
}

/**
 * Resolves a safe navigation href, including scheme-less absolute URLs (https implied).
 * Relative paths must start with a single /.
 */
function resolveSafeNavigationHref(normalized: string, allowRelative: boolean): string | null {
  if (UNSAFE_SCHEME_PATTERN.test(normalized)) return null
  if (allowRelative && isSafeRelativePath(normalized)) return normalized
  if (isSafeHttpUrl(normalized)) {
    try {
      return new URL(normalized).href
    } catch {
      return null
    }
  }
  if (normalized.startsWith('//')) {
    const candidate = `https:${normalized}`
    if (isSafeHttpUrl(candidate)) {
      try {
        return new URL(candidate).href
      } catch {
        return null
      }
    }
    return null
  }
  if (!hasExplicitNonHttpScheme(normalized)) {
    const candidate = `https://${normalized}`
    if (isSafeHttpUrl(candidate)) {
      try {
        return new URL(candidate).href
      } catch {
        return null
      }
    }
  }
  return null
}

export function isSafeNavigationTarget(
  value: string | null | undefined,
  options?: { allowRelative?: boolean }
): boolean {
  const normalized = normalizeInput(value)
  if (!normalized || UNSAFE_SCHEME_PATTERN.test(normalized)) return false
  const allowRelative = options?.allowRelative !== false
  return resolveSafeNavigationHref(normalized, allowRelative) !== null
}

export function normalizeSafeNavigationTarget(
  value: string | null | undefined,
  options?: { fallback?: string; allowRelative?: boolean }
): string {
  const fallback = options?.fallback ?? '#'
  const normalized = normalizeInput(value)
  if (!normalized || UNSAFE_SCHEME_PATTERN.test(normalized)) return fallback
  const allowRelative = options?.allowRelative !== false
  return resolveSafeNavigationHref(normalized, allowRelative) ?? fallback
}

export function normalizeSafeEmbedUrl(value: string | null | undefined): string | null {
  return isSafeHttpUrl(value) ? normalizeInput(value) : null
}
