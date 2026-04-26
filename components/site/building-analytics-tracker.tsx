'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { COOKIE_CONSENT_ACCEPTED, type CookieConsentStatus } from '@/lib/cookie-consent'

const CONSENT_UPDATED_EVENT = 'cookie-consent-updated'
const VISITOR_COOKIE_KEY = 'wow_analytics_visitor'
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

function readConsentFromDocument(): CookieConsentStatus | null {
  if (typeof document === 'undefined') {
    return null
  }

  const parsed = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('wow_cookie_consent='))
    ?.split('=')[1]

  return parsed === COOKIE_CONSENT_ACCEPTED ? COOKIE_CONSENT_ACCEPTED : null
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const entry = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))

  if (!entry) return null
  return entry.slice(name.length + 1)
}

function buildVisitorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `visitor_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

function getOrCreateVisitorId(consent: CookieConsentStatus | null): string | null {
  if (consent !== COOKIE_CONSENT_ACCEPTED) {
    return null
  }

  const existing = readCookie(VISITOR_COOKIE_KEY)
  if (existing) {
    return existing
  }

  const visitorId = buildVisitorId()
  document.cookie = `${VISITOR_COOKIE_KEY}=${visitorId}; path=/; max-age=${VISITOR_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
  return visitorId
}

async function sendAnalyticsEvent(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload)

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon('/api/analytics/track', blob)
    return
  }

  await fetch('/api/analytics/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  })
}

export function BuildingAnalyticsTracker({
  buildingId,
  pageTitle,
  pageType,
  categorySlug,
}: {
  buildingId: string
  pageTitle: string
  pageType: 'building_home' | 'category'
  categorySlug?: string | null
}) {
  const pathname = usePathname()
  const [consent, setConsent] = useState<CookieConsentStatus | null>(null)
  const trackedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    setConsent(readConsentFromDocument())

    const handleConsentUpdate = () => {
      setConsent(readConsentFromDocument())
    }

    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdate)
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsentUpdate)
    }
  }, [])

  useEffect(() => {
    if (consent !== COOKIE_CONSENT_ACCEPTED || !pathname) {
      return
    }

    const visitorId = getOrCreateVisitorId(consent)
    if (!visitorId) {
      return
    }

    const trackingKey = `${visitorId}:${pathname}`
    if (trackedKeyRef.current === trackingKey) {
      return
    }

    trackedKeyRef.current = trackingKey

    void sendAnalyticsEvent({
      buildingId,
      visitorId,
      pathname,
      pageTitle,
      pageType,
      categorySlug: categorySlug ?? null,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    }).catch(() => {
      // Analytics should never block rendering.
    })
  }, [buildingId, categorySlug, consent, pageTitle, pageType, pathname])

  return null
}
