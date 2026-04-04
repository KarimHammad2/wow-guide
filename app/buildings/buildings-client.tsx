'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, MapPin, ChevronRight, Hotel, Search, X } from 'lucide-react'
import { Header } from '@/components/guide/header'
import type { Building } from '@/lib/data'
import { cn } from '@/lib/utils'

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
    const q = query.trim().toLowerCase()
    if (!q) return buildings
    return buildings.filter(
      (building) =>
        building.name.toLowerCase().includes(q) ||
        building.city.toLowerCase().includes(q) ||
        building.address.toLowerCase().includes(q)
    )
  }, [buildings, query])

  const hasQuery = query.trim().length > 0
  const cityOptions = useMemo(
    () => Array.from(new Set(buildings.map((building) => building.city))).sort((a, b) => a.localeCompare(b)),
    [buildings]
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guide
          </Link>

          <header className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
              <Hotel className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Select Your Building
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Choose your building to access the specific guide for your apartment. Each building has unique information about amenities and services.
            </p>
          </header>

          <section className="mb-6 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by city, building, or address"
                className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/40"
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
                <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  City filter: {initialCity}
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                {filteredBuildings.length} result{filteredBuildings.length === 1 ? '' : 's'}
              </span>
              {hasQuery && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Clear filter
                </button>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              {hasQuery ? 'Matching Buildings' : 'All Buildings'}
            </h2>
            {filteredBuildings.map((building) => (
              <Link
                key={building.id}
                href={`/building/${building.id}`}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98]',
                  'bg-card border-border hover:border-primary/20 hover:shadow-md'
                )}
              >
                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Hotel className="w-8 h-8 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {building.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">
                      {building.address}, {building.city}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </Link>
            ))}
            {filteredBuildings.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-medium text-foreground mb-2">
                  No buildings found for &quot;{query.trim() || initialCity}&quot;.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try another city, building name, or address.
                </p>
                <div className="flex flex-wrap gap-2">
                  {cityOptions.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setQuery(city)}
                      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="mt-8 p-4 rounded-xl bg-secondary">
            <p className="text-sm text-muted-foreground text-center">
              Can&apos;t find your building? Contact{' '}
              <a href="mailto:mail@wowliving.ch" className="text-primary font-medium">
                mail@wowliving.ch
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
