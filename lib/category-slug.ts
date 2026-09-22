const RESERVED_CATEGORY_SLUGS = new Set(['new', 'edit'])

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Client-side check for optional category URL path input (`/wifi` or blank). */
export function isValidCategorySlugPath(value: string): boolean {
  const v = value.trim()
  if (v === '') return true
  return /^\/[a-z0-9-]+$/i.test(v) || /^[a-z0-9-]+$/i.test(v)
}

function stripLeadingSlash(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value
}

function isReservedSlug(slug: string): boolean {
  return RESERVED_CATEGORY_SLUGS.has(slug)
}

/**
 * Normalizes a per-building category URL segment.
 * Accepts `/wifi` or `wifi`; blank/invalid values fall back to slugified title.
 */
export function normalizeCategorySlug(value: unknown, fallbackTitle: string): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (raw) {
    const candidate = stripLeadingSlash(raw)
    if (/^[a-z0-9-]+$/i.test(candidate)) {
      const normalized = candidate.toLowerCase()
      if (isReservedSlug(normalized)) {
        throw new Error('This URL path is reserved.')
      }
      return normalized
    }
  }

  const fromTitle = slugify(fallbackTitle || 'category') || 'category'
  if (isReservedSlug(fromTitle)) {
    return 'category'
  }
  return fromTitle
}

export function categorySlugConflictMessage(): string {
  return 'A category with this URL path already exists for this building.'
}

export function isCategorySlugConflictError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.message.includes('already exists') || err.message.includes('duplicate key'))
  )
}
