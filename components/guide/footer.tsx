'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Linkedin, Mail, Phone, Youtube } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const text = {
    quickLinks: 'Quick Links',
    searchGuide: 'Search Guide',
    emergency: 'Emergency',
    changeBuilding: 'Change Building',
    contact: 'Contact',
    supportLine: 'Support line',
    phoneLabel: 'Phone',
    social: 'Follow us',
    rights: 'All rights reserved.',
  } as const

  return (
    <footer
      className={cn(
        'border-t border-border bg-linear-to-b from-background to-secondary/40 px-4 py-10 md:px-8 xl:px-14',
        className
      )}
    >
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <Link href="/" aria-label="WOW Living" className="flex items-center gap-3 min-w-0">
            <div className="relative h-8 w-24 md:h-9 md:w-28">
              <Image
                src="/logo.png"
                alt="WOW Living"
                fill
                sizes="(min-width: 768px) 112px, 96px"
                className="object-contain object-left"
              />
            </div>
          </Link>

        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3 xl:grid-cols-4">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{text.quickLinks}</h4>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/search"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {text.searchGuide}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/emergency"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {text.emergency}
                </Link>
              </li>
              <li>
                <Link
                  href="/buildings"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {text.changeBuilding}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{text.contact}</h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="mailto:mail@wowliving.ch"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  {text.supportLine}: mail@wowliving.ch
                </a>
              </li>
              <li>
                <a
                  href="tel:+41611234567"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Phone className="h-4 w-4" />
                  {text.phoneLabel}: +41 61 123 45 67
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{text.social}</h4>
            <div className="flex w-[168px] items-center justify-between">
              <a
                href="https://www.linkedin.com/company/wow-living-ag/"
                aria-label="LinkedIn"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="mailto:mail@wowliving.ch"
                aria-label="Email"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://www.youtube.com/channel/UCUTrYP3RVQCM-b74wGOaVVA"
                aria-label="YouTube"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href="https://open.spotify.com/user/31smpi6muwirpdupdls2sazm3jdm?si=CsDk6AGCSumGC5OC3yW3Uw&nd=1&dlsi=d66f57bb7cdc40cb"
                aria-label="Spotify"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
              >
                <SpotifyIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="hidden xl:block">
            <h4 className="mb-3 text-sm font-semibold text-foreground">Stay prepared</h4>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Keep this guide nearby during your stay for fast access to arrival details,
              amenities, local info, and emergency contacts.
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} WOW Living. {text.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 10.2C10.9 9.2 13.6 9.5 16.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.2 12.9C10.7 12.2 12.9 12.5 15 13.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 15.5C10.8 15 12.2 15.1 13.8 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
