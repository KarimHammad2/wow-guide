export const COOKIE_CONSENT_KEY = 'wow_cookie_consent'

export const COOKIE_CONSENT_ACCEPTED = 'accepted'
export const COOKIE_CONSENT_REJECTED = 'rejected'

export type CookieConsentStatus =
  | typeof COOKIE_CONSENT_ACCEPTED
  | typeof COOKIE_CONSENT_REJECTED

export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export function isCookieConsentStatus(value: string | undefined): value is CookieConsentStatus {
  return value === COOKIE_CONSENT_ACCEPTED || value === COOKIE_CONSENT_REJECTED
}

export function readConsentFromCookieString(cookieString: string): CookieConsentStatus | null {
  const parsed = cookieString
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_CONSENT_KEY}=`))
    ?.split('=')[1]

  return isCookieConsentStatus(parsed) ? parsed : null
}

export function buildConsentCookieValue(status: CookieConsentStatus): string {
  return `${COOKIE_CONSENT_KEY}=${status}; path=/; max-age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; samesite=lax`
}
