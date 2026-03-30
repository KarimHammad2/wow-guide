'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Search, Clock, TrendingUp, X } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { CategoryTile } from '@/components/guide/category-tile'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { categories, popularTopics, categoryContent, type Category } from '@/lib/data'
import { cn } from '@/lib/utils'
import { getLucideIcon } from '@/lib/icons'

// Mock recent searches
const recentSearches = ['WiFi password', 'Check-in time', 'Laundry']

export function SearchPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [recentItems, setRecentItems] = useState(recentSearches)

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

    Object.entries(categoryContent).forEach(([slug, content]) => {
      const category = categories.find((c) => c.slug === slug)
      if (!category) return

      // Check intro
      if (content.intro.toLowerCase().includes(q)) {
        contentResults.push({
          categorySlug: slug,
          categoryTitle: category.title,
          sectionTitle: 'Overview',
          match: content.intro.slice(0, 100) + '...',
        })
      }

      // Check sections
      content.sections.forEach((section) => {
        if (section.title?.toLowerCase().includes(q)) {
          contentResults.push({
            categorySlug: slug,
            categoryTitle: category.title,
            sectionTitle: section.title,
            match: section.content?.slice(0, 100) || '',
          })
        }
      })
    })

    return { categories: categoryResults, content: contentResults }
  }, [query])

  const hasResults =
    (searchResults?.categories.length ?? 0) > 0 || (searchResults?.content.length ?? 0) > 0
  const isSearching = query.trim().length > 0

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    if (q !== query) setQuery(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const setQueryAndUrl = (next: string) => {
    setQuery(next)
    const trimmed = next.trim()
    const params = new URLSearchParams(searchParams.toString())
    if (trimmed) params.set('q', trimmed)
    else params.delete('q')
    const qs = params.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
  }

  const clearRecent = (item: string) => {
    setRecentItems(recentItems.filter((i) => i !== item))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-24 md:pb-10 space-y-5">
        {/* Back navigation */}
        <section className="guide-shell pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guide
          </Link>
        </section>

        {/* Search input */}
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
          {/* Search Results */}
          {isSearching && (
            <section className="guide-section p-4 md:p-6">
              {hasResults ? (
                <div className="space-y-6">
                  {(searchResults?.categories.length ?? 0) > 0 && (
                    <section>
                      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.22em] mb-3">
                        Categories
                      </h2>
                      <div className="grid gap-3 md:grid-cols-2">
                        {searchResults?.categories.map((category) => (
                          <CategoryTile key={category.id} category={category} />
                        ))}
                      </div>
                    </section>
                  )}

                  {(searchResults?.content.length ?? 0) > 0 && (
                    <section>
                      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.22em] mb-3">
                        Related Content
                      </h2>
                      <div className="grid gap-3 md:grid-cols-2">
                        {searchResults?.content.map((result, index) => (
                          <Link
                            key={index}
                            href={`/category/${result.categorySlug}`}
                            className="block p-4 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-[0_18px_36px_-32px_rgba(30,15,22,0.6)] transition-all"
                          >
                            <div className="flex items-center gap-2 text-sm text-primary mb-1">
                              <span>{result.categoryTitle}</span>
                              <span className="text-muted-foreground">&middot;</span>
                              <span className="text-muted-foreground">{result.sectionTitle}</span>
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

          {/* Default State - Recent & Popular */}
          {!isSearching && (
            <section className="guide-section p-4 md:p-6 space-y-8">
              {recentItems.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.22em]">
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
                          type="button"
                          onClick={() => clearRecent(item)}
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
                  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.22em]">
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
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.22em] mb-3">
              Browse by Category
            </h2>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-6">
              {categories.slice(0, 12).map((category) => {
                const Icon = getLucideIcon(category.icon)
                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className={cn(
                      'group flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-all',
                      'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-[1.02]',
                        category.color === 'primary'
                          ? 'bg-primary/10 text-primary'
                          : category.color === 'accent'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5" />
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

      <StickyBottomBar />
    </div>
  )
}
