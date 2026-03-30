import type { Metadata, Viewport } from 'next'
import { Montserrat, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { cn } from '@/lib/utils'
import { BackToTopButton } from '@/components/site/back-to-top-button'

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
    icon: '/favicon.png',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#9B5A74',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn(montserrat.variable, display.variable)}>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <BackToTopButton />
        <Analytics />
      </body>
    </html>
  )
}
