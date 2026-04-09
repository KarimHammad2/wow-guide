'use client'

import { useEffect, useMemo, useState, use } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Search, Clock, TrendingUp, X } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { CategoryTile } from '@/components/guide/category-tile'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import type { Building, Category } from '@/lib/data'
import { cn } from '@/lib/utils'
import { CategoryIconDisplay } from '@/components/guide/category-icon'

// Mock recent searches
const recentSearches = ['WiFi password', 'Check-in time', 'Laundry']

const browseCategoryIconShell: Record<Category['color'], string> = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/20 text-accent-foreground',
  muted: 'bg-secondary text-foreground border border-border',
}

interface BuildingSearchPageClientProps {
  params: Promise<{ slug: string }>
}

export function BuildingSearchPageClient({ params }: BuildingSearchPageClientProps) {
  const { slug } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [recentItems, setRecentItems] = useState(recentSearches)
  const [building, setBuilding] = useState<Building | null>(null)
  const [loadingBuilding, setLoadingBuilding] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [popularTopics, setPopularTopics] = useState<string[]>([])
  const [categoryContent, setCategoryContent] = useState<Record<string, {
    intro: string
    sections: Array<{ title?: string; content?: string }>
  }>>({})

  type ContentSearchResult = {
    categorySlug: string
    categoryTitle: string
    sectionTitle: string
    match: string
  }
  type SearchResults = {
    categories: Category[]
    content: ContentSearchResult[]
  }

  useEffect(() => {
    const controller = new AbortController()
    setLoadingBuilding(true)
    setLoadingError(null)

    void fetch(`/api/public/buildings/${slug}/guide`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(payload?.error ?? 'Unable to load building guide.')
        }
        return (await response.json()) as {
          building?: Building
          categories?: Category[]
          popularTopics?: string[]
          categoryContent?: Record<
            string,
            {
              intro: string
              sections: Array<{ title?: string; content?: string }>
            }
          >
        }
      })
      .then((data) => {
        setBuilding(data.building ?? null)
        setCategories(data.categories ?? [])
        setPopularTopics(data.popularTopics ?? [])
        setCategoryContent(data.categoryContent ?? {})
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        const message = error instanceof Error ? error.message : 'Unable to load building guide.'
        setLoadingError(message)
        setBuilding(null)
        setCategories([])
        setPopularTopics([])
        setCategoryContent({})
      })
      .finally(() => {
        setLoadingBuilding(false)
      })

    return () => {
      controller.abort()
    }
  }, [slug])

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    if (q !== query) setQuery(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const setQueryAndUrl = (next: string) => {
    setQuery(next)
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = query.trim()
      const current = searchParams.get('q') ?? ''
      if (trimmed === current) return
      const paramsObj = new URLSearchParams(searchParams.toString())
      if (trimmed) paramsObj.set('q', trimmed)
      else paramsObj.delete('q')
      const qs = paramsObj.toString()
      router.replace(qs ? `/${slug}/search?${qs}` : `/${slug}/search`, { scroll: false })
    }, 250)
    return () => clearTimeout(handle)
  }, [query, router, searchParams, slug])

  const categoriesBySlug = useMemo(
    () => new Map(categories.map((category) => [category.slug, category])),
    [categories]
  )

  // Search results based on query
  const searchResults = useMemo<SearchResults | null>(() => {
    if (!query.trim()) return null

    const q = query.toLowerCase()

    // Search through categories
    const categoryResults = categories.filter(
      (cat) =>
        cat.title.toLowerCase().includes(q) ||
        cat.subtitle.toLowerCase().includes(q)
    )

    // Search through content
    const contentResults: ContentSearchResult[] = []

    Object.entries(categoryContent).forEach(([catSlug, content]) => {
      const category = categoriesBySlug.get(catSlug)
      if (!category) return

      // Check intro
      if (content.intro.toLowerCase().includes(q)) {
        contentResults.push({
          categorySlug: catSlug,
          categoryTitle: category.title,
          sectionTitle: 'Overview',
          match: content.intro.slice(0, 100) + '...',
        })
      }

      // Check sections
      content.sections.forEach((section) => {
        if (section.title?.toLowerCase().includes(q)) {
          contentResults.push({
            categorySlug: catSlug,
            categoryTitle: category.title,
            sectionTitle: section.title,
            match: section.content?.slice(0, 100) || '',
          })
        }
      })
    })

    return { categories: categoryResults, content: contentResults }
  }, [query, categories, categoriesBySlug, categoryContent])

  const hasResults =
    (searchResults?.categories.length ?? 0) > 0 || (searchResults?.content.length ?? 0) > 0
  const isSearching = query.trim().length > 0

  const clearRecent = (item: string) => {
    setRecentItems((prev) => prev.filter((i) => i !== item))
  }

  if (loadingBuilding) {
    return (
      <div className="min-h-screen bg-background">
        <Header buildingName="Loading…" buildingSlug={slug} />
        <main className="pt-24 pb-24 md:pb-10 space-y-5">
          <section className="guide-shell pt-2">
            <Link
              href={`/${slug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Guide
            </Link>
          </section>
          <section className="guide-shell">
            <div className="guide-section p-4 md:p-6">
              <div className="h-12 rounded-2xl bg-secondary animate-pulse" />
            </div>
          </section>
          <section className="guide-shell">
            <div className="guide-section p-4 md:p-6">
              <div className="h-4 w-40 rounded bg-secondary animate-pulse mb-4" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-[92px] rounded-xl bg-secondary animate-pulse" />
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    )
  }

  if (loadingError || !building) {
    return (
      <div className="min-h-screen bg-background">
        <Header buildingName="Guide unavailable" buildingSlug={slug} />
        <main className="pt-24 pb-24 md:pb-10 space-y-5">
          <section className="guide-shell pt-2">
            <Link
              href={`/${slug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Guide
            </Link>
          </section>
          <section className="guide-shell">
            <div className="guide-section p-4 md:p-6 text-center">
              <h2 className="text-xl font-semibold text-foreground">Unable to load this guide</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {loadingError ?? 'This building could not be found.'}
              </p>
            </div>
          </section>
        </main>
      </div>
    )
  }

  const buildingSlug = building.id

  return (
    <div className="min-h-screen bg-background">
      <Header
        buildingName={building.name}
        buildingSlug={building.id}
        supportEmail={building.supportEmail}
      />

      <main className="pt-24 pb-24 md:pb-10 space-y-5">
        <section className="guide-shell pt-2">
          <Link
            href={`/${buildingSlug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guide
          </Link>
        </section>

        <section className="guide-shell">
          <div className="guide-section p-4 md:p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQueryAndUrl(e.target.value)}
                placeholder="Search for help..."
                autoFocus
                inputMode="search"
                className="w-full pl-12 pr-11 py-4 text-base md:text-lg bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQueryAndUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="guide-shell space-y-6">
          {isSearching && (
            <section className="guide-section p-4 md:p-6">
              {hasResults ? (
                <div className="space-y-6">
                  {(searchResults?.categories.length ?? 0) > 0 && (
                    <section>
                      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Categories
                      </h2>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {searchResults?.categories.map((category) => (
                          <CategoryTile
                            key={category.id}
                            category={category}
                            buildingSlug={buildingSlug}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {(searchResults?.content.length ?? 0) > 0 && (
                    <section>
                      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Related Content
                      </h2>
                      <div className="grid gap-3 md:grid-cols-2">
                        {searchResults?.content.map((result, index) => (
                          <Link
                            key={index}
                            href={`/${buildingSlug}/category/${result.categorySlug}`}
                            className="block p-4 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-[0_20px_35px_-30px_rgba(101,40,67,0.7)] transition-all"
                          >
                            <div className="flex items-center gap-2 text-sm text-primary mb-1">
                              <span>{result.categoryTitle}</span>
                              <span className="text-muted-foreground">
                                &middot;
                              </span>
                              <span className="text-muted-foreground">
                                {result.sectionTitle}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {result.match}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <div className="text-center py-14">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    No results found
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {"We couldn't find anything matching"} &quot;{query}&quot;. Try
                    different keywords.
                  </p>
                </div>
              )}
            </section>
          )}

          {!isSearching && (
            <section className="guide-section p-4 md:p-6 space-y-8">
              {recentItems.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Recent Searches
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentItems.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => setQueryAndUrl(item)}
                          className="px-2 text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {item}
                        </button>
                        <button
                          onClick={() => clearRecent(item)}
                          type="button"
                          className="grid size-7 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background/60"
                          aria-label={`Remove recent search: ${item}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Popular Topics
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setQueryAndUrl(topic)}
                      className="px-4 py-2 rounded-full bg-primary/5 text-sm font-medium text-foreground hover:bg-primary/10 active:scale-[0.99] transition-all"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </section>
            </section>
          )}

          <section className="guide-section p-4 md:p-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {categories.slice(0, 12).map((category) => {
                return (
                  <Link
                    key={category.id}
                    href={`/${buildingSlug}/category/${category.slug}`}
                    className={cn(
                      'group flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-all',
                      'active:scale-[0.98]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-[1.02] overflow-hidden',
                        browseCategoryIconShell[category.color] ?? browseCategoryIconShell.primary
                      )}
                    >
                      <CategoryIconDisplay
                        icon={category.icon}
                        className="w-5 h-5"
                        imgClassName="w-full h-full min-w-10 min-h-10"
                      />
                    </div>
                    <span className="text-xs font-medium text-center line-clamp-1">
                      {category.title}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        </section>
      </main>

      <StickyBottomBar buildingSlug={buildingSlug} supportEmail={building.supportEmail} />
    </div>
  )
}
