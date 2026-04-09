'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, MapPin, ChevronRight, Hotel, Search, X } from 'lucide-react'
import { Header } from '@/components/guide/header'
import type { Building } from '@/lib/data'
import { cn } from '@/lib/utils'

function BuildingCardMedia({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-secondary">
        <Hotel className="h-6 w-6 text-muted-foreground/60" aria-hidden />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={title}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 80px, 96px"
      onError={() => setFailed(true)}
    />
  )
}

interface BuildingsClientProps {
  buildings: Building[]
  initialCity: string
}

export function BuildingsClient({ buildings, initialCity }: BuildingsClientProps) {
  const [query, setQuery] = useState(initialCity)

  useEffect(() => {
    setQuery(initialCity)
  }, [initialCity])

  const filteredBuildings = useMemo(() => {
    const tokens = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
    if (tokens.length === 0) return buildings
    return buildings.filter((building) => {
      const haystack = [building.id, building.name, building.address, building.city, building.country]
        .join(' ')
        .toLowerCase()
      return tokens.every((t) => haystack.includes(t))
    })
  }, [buildings, query])

  const hasQuery = query.trim().length > 0
  const cityOptions = useMemo(
    () => Array.from(new Set(buildings.map((building) => building.city))).sort((a, b) => a.localeCompare(b)),
    [buildings]
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-10 md:pb-12">
        <div className="guide-shell py-6">
          <div className="max-w-3xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Guide
            </Link>

            <header className="mb-6">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-primary/90 text-primary-foreground">
                <Hotel className="size-5" aria-hidden />
              </div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-2 text-balance tracking-tight">
                Select Your Building
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose your building to access the specific guide for your apartment. Each building has unique
                information about amenities and services.
              </p>
            </header>
          </div>

          <section className="mb-6 space-y-5 max-w-3xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by city, building, or address"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {initialCity && (
                <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
                  City filter: {initialCity}
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {filteredBuildings.length} result{filteredBuildings.length === 1 ? '' : 's'}
              </span>
              {hasQuery && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Clear filter
                </button>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {hasQuery ? 'Matching Buildings' : 'All Buildings'}
            </h2>
            <div className="flex flex-col gap-2.5">
              {filteredBuildings.map((building) => (
                <Link
                  key={building.id}
                  href={`/${building.id}`}
                  className={cn(
                    'group flex flex-row items-center gap-3 md:gap-4 rounded-xl border bg-card p-3 md:p-4 text-left transition-colors',
                    'border-border hover:border-primary/20 hover:bg-secondary/35 hover:shadow-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  )}
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary md:h-24 md:w-24">
                    <BuildingCardMedia src={building.imageUrl} title={building.name} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-foreground md:text-base leading-snug group-hover:text-primary transition-colors">
                      {building.name}
                    </h3>
                    <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground md:text-sm">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
                      <span className="leading-snug line-clamp-2">
                        {building.address}, {building.city}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-opacity group-hover:text-primary group-hover:opacity-100 opacity-70"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
            {filteredBuildings.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-4 md:p-5 mt-2">
                {buildings.length === 0 ? (
                  <>
                    <p className="text-sm font-medium text-foreground mb-1.5">
                      No buildings are listed yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please check back soon, or contact{' '}
                      <a href="mailto:mail@wowliving.ch" className="text-primary font-medium hover:underline">
                        mail@wowliving.ch
                      </a>
                      .
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground mb-1.5">
                      No buildings found for &quot;{query.trim() || initialCity}&quot;.
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Try another city, building name, or address.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cityOptions.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setQuery(city)}
                          className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          <div className="mt-8 rounded-lg border border-border/60 bg-secondary px-4 py-3">
            <p className="text-sm text-muted-foreground text-center">
              Can&apos;t find your building? Contact{' '}
              <a href="mailto:mail@wowliving.ch" className="text-primary font-medium hover:underline">
                mail@wowliving.ch
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
