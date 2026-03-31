'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { Button } from '@/components/ui/button'
import {
  buildConsentCookieValue,
  COOKIE_CONSENT_ACCEPTED,
  COOKIE_CONSENT_REJECTED,
  type CookieConsentStatus,
  readConsentFromCookieString,
} from '@/lib/cookie-consent'

const CONSENT_UPDATED_EVENT = 'cookie-consent-updated'

type ConsentAwareAnalyticsProps = {
  initialConsent: CookieConsentStatus | null
}

function readConsentFromDocument(): CookieConsentStatus | null {
  if (typeof document === 'undefined') {
    return null
  }

  return readConsentFromCookieString(document.cookie)
}

export function ConsentAwareAnalytics({ initialConsent }: ConsentAwareAnalyticsProps) {
  const [consent, setConsent] = useState<CookieConsentStatus | null>(initialConsent)

  useEffect(() => {
    setConsent(readConsentFromDocument())

    const onConsentUpdate = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentStatus>).detail
      setConsent(detail)
    }

    window.addEventListener(CONSENT_UPDATED_EVENT, onConsentUpdate)
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, onConsentUpdate)
    }
  }, [])

  if (consent !== COOKIE_CONSENT_ACCEPTED) {
    return null
  }

  return <Analytics />
}

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsentStatus | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setConsent(readConsentFromDocument())
    setReady(true)
  }, [])

  const saveConsent = (status: CookieConsentStatus) => {
    document.cookie = buildConsentCookieValue(status)
    setConsent(status)
    window.dispatchEvent(new CustomEvent<CookieConsentStatus>(CONSENT_UPDATED_EVENT, { detail: status }))
  }

  if (!ready || consent) {
    return null
  }

  return (
    <section
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-70 border-t border-border/70 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6">
        <p className="text-sm text-foreground">
          We use essential cookies to keep this site working. With your permission, we also use analytics cookies to understand
          usage and improve the experience.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => saveConsent(COOKIE_CONSENT_REJECTED)}>
            Reject
          </Button>
          <Button size="sm" className="cursor-pointer" onClick={() => saveConsent(COOKIE_CONSENT_ACCEPTED)}>
            Accept
          </Button>
        </div>
      </div>
    </section>
  )
}
