const ABSOLUTE_URL_PATTERN = /^https?:\/\//i

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function normalizeBaseUrl(value: string) {
  const trimmed = trimTrailingSlash(value.trim())
  if (!trimmed) return ''
  if (!ABSOLUTE_URL_PATTERN.test(trimmed)) return ''
  return trimmed
}

export function getSiteBaseUrl() {
  const envValue = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL ?? '')
  if (envValue) return envValue

  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin)
  }

  return ''
}

export function toAbsoluteSiteUrl(path: string) {
  const safePath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = getSiteBaseUrl()
  if (!baseUrl) return safePath
  return `${baseUrl}${safePath}`
}
