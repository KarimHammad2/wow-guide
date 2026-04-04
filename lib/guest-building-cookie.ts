/** Remembers the last visited building guide slug for redirect from `/`. */
export const GUEST_BUILDING_COOKIE = 'wow_guest_building'

const NINETY_DAYS_SEC = 60 * 60 * 24 * 90

export const guestBuildingCookieOptions = {
  path: '/' as const,
  maxAge: NINETY_DAYS_SEC,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}
