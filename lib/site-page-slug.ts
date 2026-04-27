/** Top-level routes and segments that must not shadow CMS pages at `/{slug}`. */
export const RESERVED_SITE_PAGE_SLUGS = new Set([
  '_next',
  'admin',
  'api',
  'buildings',
  'building',
  'category',
  'search',
  'login',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
])

const SITE_PAGE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function normalizeSitePageSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isValidSitePageSlugFormat(slug: string): boolean {
  if (slug.length < 1 || slug.length > 80) return false
  return SITE_PAGE_SLUG_REGEX.test(slug)
}

export function assertSitePageSlugAllowed(
  slug: string,
  options: { reservedBuildingSegments: Set<string> }
): { ok: true } | { ok: false; error: string } {
  if (!isValidSitePageSlugFormat(slug)) {
    return {
      ok: false,
      error: 'URL must be 1–80 characters: lowercase letters, numbers, and single hyphens only.',
    }
  }
  if (RESERVED_SITE_PAGE_SLUGS.has(slug)) {
    return { ok: false, error: 'This URL is reserved for the app.' }
  }
  if (options.reservedBuildingSegments.has(slug)) {
    return { ok: false, error: 'This URL conflicts with a building address.' }
  }
  return { ok: true }
}
