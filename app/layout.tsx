import type { Metadata, Viewport } from 'next'
import { Montserrat, Cormorant_Garamond } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { cn } from '@/lib/utils'
import { BackToTopButton } from '@/components/site/back-to-top-button'
import { ConsentAwareAnalytics, CookieConsentBanner } from '@/components/site/cookie-consent-banner'
import { COOKIE_CONSENT_KEY, isCookieConsentStatus } from '@/lib/cookie-consent'

const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: '--font-montserrat',
  display: 'swap',
})

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WOW Living | Premium Serviced Apartments in Switzerland',
  description: 'Experience thoughtfully designed apartments with hotel-like service. Your complete guide to living in your WOW Living apartment.',
  generator: 'wowguide',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#9B5A74',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const consentCookie = cookieStore.get(COOKIE_CONSENT_KEY)?.value
  const initialConsent = isCookieConsentStatus(consentCookie) ? consentCookie : null

  return (
    <html lang="en" className={cn(montserrat.variable, display.variable)}>
      <body suppressHydrationWarning className="font-sans antialiased min-h-screen">
        {children}
        <BackToTopButton />
        <CookieConsentBanner />
        <ConsentAwareAnalytics initialConsent={initialConsent} />
      </body>
    </html>
  )
}
