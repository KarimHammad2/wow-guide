'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  MapPin,
  ChevronRight,
  Clock,
  ArrowRight,
  Building2,
  BadgeCheck,
  Search,
  Linkedin,
  Mail,
  Phone,
  Youtube,
} from 'lucide-react'
import { buildings } from '@/lib/data'
import { Navbar } from '@/components/site/navbar'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredBuildings = buildings.filter(
    (building) =>
      building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const locationSummary = Object.entries(
    buildings.reduce<Record<string, { count: number; addresses: string[] }>>((acc, building) => {
      if (!acc[building.city]) {
        acc[building.city] = { count: 0, addresses: [] }
      }

      acc[building.city].count += 1
      acc[building.city].addresses.push(building.address)
      return acc
    }, {})
  )
    .map(([city, info]) => ({
      city,
      count: info.count,
      addresses: info.addresses,
    }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))

  const locationHighlights: Record<string, string> = {
    Basel: 'Business district access and vibrant city life.',
    Zug: 'International business hub with lakefront calm.',
    'Pfäffikon SZ': 'Modern, tranquil setting with fast rail links.',
  }

  const featureCards = [
    {
      title: 'Curated Interiors',
      description:
        'Fully furnished residences with kitchen essentials, premium linens, and ready-to-work spaces from day one.',
      supportLabel: 'Fully furnished',
    },
    {
      title: 'Discreet Support',
      description: 'Secure access, guided self check-in, and responsive guest support whenever your stay needs attention.',
      supportLabel: '24/7 check-in',
    },
    {
      title: 'Flexible Contracts',
      description: 'From business assignments to relocation, stay terms are structured around your timeline and priorities.',
      supportLabel: '30-day notice model',
    },
  ] as const

  const footerText = {
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
    <div className="min-h-screen bg-background">
      <Navbar
        brandLabel="WOW Living"
        logoSrc="/apple-icon.png"
        links={[
          { label: 'Features', href: '#features' },
          { label: 'Locations', href: '#locations' },
          { label: 'Our Buildings', href: '#buildings' },
        ]}
        right={
          <Button
            asChild
            size="sm"
            className="rounded-full px-4 shadow-sm shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25"
          >
            <a href="mailto:mail@wowliving.ch">Contact</a>
          </Button>
        }
      />

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden pt-8">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-x-0 top-28 h-[460px] md:h-[520px] bg-primary/88" />

        <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-20 w-full">
          <div
            className={`mb-7 rounded-[26px] border border-primary/25 bg-accent/85 px-5 py-3 md:px-6 md:py-3.5 shadow-sm transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-foreground/90 font-medium">
                Trusted serviced apartments for business travelers and long stays
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex w-[126px] items-center justify-center gap-1.5 rounded-full border border-foreground/10 bg-background/80 px-3 py-1 text-xs text-foreground/80">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  Swiss quality
                </span>
                <span className="inline-flex w-[126px] items-center justify-center gap-1.5 rounded-full border border-foreground/10 bg-background/80 px-3 py-1 text-xs text-foreground/80">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  24/7 support
                </span>
              </div>
            </div>
          </div>

          <div className={`relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative h-[500px] md:h-[560px] rounded-[34px] overflow-hidden border border-white/20 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.5)]">
              <Image
                src="/images/hero/landing-hero.png"
                alt="Elegant furnished apartment by WOW Living"
                fill
                sizes="(min-width: 1024px) 1100px, 100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-black/10" />

              <div className="absolute left-5 right-5 bottom-14 md:left-10 md:right-10 md:bottom-20">
                <div className="max-w-2xl">
                  <p className="text-white/85 text-xs md:text-sm uppercase tracking-[0.2em] mb-3">Premium serviced apartments</p>
                  <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.05] mb-4">
                    Looking for a serviced apartment?
                    <span className="block">Here you go.</span>
                  </h1>
                  <p className="text-white/85 text-base md:text-lg max-w-xl mb-6">
                    Beautifully furnished spaces, seamless check-in, and reliable support across Switzerland.
                  </p>
                  <div className="flex flex-col sm:flex-row items-start gap-3">
                    <Link
                      href="#buildings"
                      className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-foreground px-6 py-3 text-sm md:text-base font-semibold transition-all hover:bg-white/90"
                    >
                      Search Apartments
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a
                      href="mailto:mail@wowliving.ch"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/45 bg-white/10 text-white px-6 py-3 text-sm md:text-base font-medium backdrop-blur-sm transition-all hover:bg-white/20"
                    >
                      Start Request
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 right-5 md:right-7 rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold shadow-md">
              Swiss quality stays
            </div>
            <div className="absolute right-5 md:right-8 bottom-[26%] rounded-3xl bg-primary px-5 py-4 shadow-lg hidden sm:block">
              <p className="text-primary-foreground text-2xl font-bold leading-none">Business Ready</p>
              <p className="text-primary-foreground/85 text-sm mt-1">Move in within days</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            <div className="rounded-2xl border border-border/70 bg-card/95 px-4 py-3">
              <p className="text-xl font-semibold text-foreground">4+</p>
              <p className="text-xs text-muted-foreground">Swiss locations</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/95 px-4 py-3">
              <p className="text-xl font-semibold text-foreground">24/7</p>
              <p className="text-xs text-muted-foreground">Emergency support</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/95 px-4 py-3">
              <p className="text-xl font-semibold text-foreground">100%</p>
              <p className="text-xs text-muted-foreground">Fully furnished</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative overflow-hidden py-20 bg-[#9b5f85]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/35 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-black/20 to-transparent" />
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-14">
            <p className="inline-flex items-center rounded-full border border-[#f4e3ad]/60 bg-[#f4e3ad]/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fff3c4] mb-5">
              WOW services included
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#fff4ce] mb-4 tracking-tight">
              Everything you need
            </h2>
            <p className="text-[#f6deeb] text-lg max-w-2xl mx-auto leading-relaxed">
              Premium serviced apartments with the comfort, flexibility, and reliability expected by modern professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {featureCards.map((feature, index) => {
              return (
                <article
                  key={feature.title}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/95 p-7 md:p-8 shadow-[0_14px_35px_-24px_rgba(49,16,38,0.45)] transition-all duration-500 hover:-translate-y-1 hover:border-[#f4e3ad]/60 hover:shadow-[0_20px_40px_-24px_rgba(49,16,38,0.55)] motion-reduce:transform-none motion-reduce:transition-none ${
                    mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                  }`}
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/25 via-transparent to-[#f5dd9f]/15 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-[2.2rem] bg-linear-to-bl from-[#f4e3ad]/35 to-transparent" />

                  <h3 className="text-xl font-semibold text-[#5a2c44] mb-3">{feature.title}</h3>
                  <p className="text-[#7d6880] leading-relaxed">{feature.description}</p>

                  <p className="mt-6 inline-flex w-fit items-center rounded-full border border-[#b06a90]/25 bg-[#f4dce9]/60 px-3 py-1 text-xs font-semibold text-[#714a63]">
                    {feature.supportLabel}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section id="locations" className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-primary/10 to-transparent" />
        <div className="pointer-events-none absolute -top-16 right-1/4 h-44 w-44 rounded-full bg-accent/35 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-14">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              <Building2 className="h-4 w-4" />
              Prime Locations
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Stay where business happens
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Discover city addresses chosen for business mobility, quality neighborhood life, and effortless daily routines.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <span className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
                {locationSummary.length} Swiss locations
              </span>
              <span className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
                {buildings.length} fully furnished apartments
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-7">
            {locationSummary.map((location) => (
              <article
                key={location.city}
                className="group overflow-hidden rounded-3xl border border-border/80 bg-card/95 shadow-[0_14px_35px_-24px_rgba(49,16,38,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_45px_-24px_rgba(49,16,38,0.5)]"
              >
                <div className="relative border-b border-border/70 bg-linear-to-br from-primary/14 via-primary/7 to-accent/40 px-5 py-5">
                  <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-accent/45 blur-2xl" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-card text-primary shadow-sm">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-primary/25 bg-card px-3 py-1 text-xs font-medium text-primary">
                      {location.count} building{location.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-foreground">{location.city}</h3>
                </div>

                <div className="p-6">
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5 min-h-11">
                    {locationHighlights[location.city] ?? 'Premium furnished apartments with reliable support and easy self check-in.'}
                  </p>

                  <div className="space-y-2.5 mb-6">
                    {location.addresses.slice(0, 2).map((address) => (
                      <p key={address} className="inline-flex items-center gap-2 text-sm text-foreground/90">
                        <MapPin className="h-4 w-4 text-primary/80" />
                        {address}
                      </p>
                    ))}
                    {location.addresses.length > 2 && (
                      <p className="text-xs text-muted-foreground">+ {location.addresses.length - 2} additional address(es)</p>
                    )}
                  </div>

                  <Link
                    href="#buildings"
                    className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-all group-hover:border-primary/55 group-hover:bg-primary/5 group-hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                  >
                    Explore apartments
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Buildings Section */}
      <section id="buildings" className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-secondary/45 via-background to-background" />
        <div className="pointer-events-none absolute -top-14 left-1/3 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-14">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-5">
              <MapPin className="h-4 w-4 text-primary" />
              Building Finder
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Find your building
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Search by address or city to open the exact guide for your stay in seconds.
            </p>

            <div className="max-w-2xl mx-auto rounded-3xl border border-border/80 bg-card/95 p-4 shadow-[0_12px_32px_-24px_rgba(49,16,38,0.45)]">
              <label htmlFor="building-search" className="sr-only">
                Search by building name, street, or city
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="building-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try Basel, Zug, Kannenfeldstrasse..."
                  className="w-full rounded-2xl border border-border bg-background/80 py-3.5 pl-11 pr-24 text-foreground placeholder:text-muted-foreground transition-all focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {filteredBuildings.length} result{filteredBuildings.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Can’t find it? Try a street name, city, or contact us for quick support.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-7">
            {filteredBuildings.map((building) => (
              <Link
                key={building.id}
                href={`/building/${building.id}`}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card/95 p-5 shadow-[0_12px_30px_-24px_rgba(49,16,38,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_40px_-24px_rgba(49,16,38,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-1">{building.city}</p>
                    <h3 className="text-lg font-semibold text-foreground truncate">{building.name}</h3>
                  </div>
                </div>

                <div className="mb-5 rounded-2xl border border-border/80 bg-secondary/35 px-3.5 py-3">
                  <p className="text-sm text-foreground/95">{building.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">{building.country}</p>
                </div>

                <div className="inline-flex items-center gap-2 text-primary text-sm font-medium">
                  <span>Open Guest Guide</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>

          {filteredBuildings.length === 0 && (
            <div className="mx-auto mt-3 max-w-xl rounded-3xl border border-border bg-card/95 px-6 py-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-foreground mb-2">No building matches that search yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Check spelling, try a nearby city, or contact WOW Living support and we will route you to the right guide.
              </p>
              <a
                href="mailto:mail@wowliving.ch"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
              >
                Contact Support
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to make yourself at home?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Contact us to learn more about availability and booking your perfect apartment
          </p>
          <a
            href="mailto:mail@wowliving.ch"
            className="inline-flex items-center justify-center gap-2 bg-background text-foreground px-8 py-4 rounded-full font-medium hover:bg-background/90 transition-colors"
          >
            Contact Us
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-linear-to-b from-background to-secondary/40 px-4 py-10">
        <div className="mx-auto max-w-5xl">
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

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">{footerText.quickLinks}</h4>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/search" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {footerText.searchGuide}
                  </Link>
                </li>
                <li>
                  <Link href="/category/emergency" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {footerText.emergency}
                  </Link>
                </li>
                <li>
                  <Link href="/buildings" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {footerText.changeBuilding}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">{footerText.contact}</h4>
              <ul className="space-y-1.5">
                <li>
                  <a
                    href="mailto:mail@wowliving.ch"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    {footerText.supportLine}: mail@wowliving.ch
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+41611234567"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Phone className="h-4 w-4" />
                    {footerText.phoneLabel}: +41 61 123 45 67
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">{footerText.social}</h4>
              <div className="flex flex-wrap items-center gap-2">
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
          </div>

          <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} WOW Living. {footerText.rights}
          </div>
        </div>
      </footer>
    </div>
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
