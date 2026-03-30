'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Clock, TrendingUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/guide/header'
import { CategoryTile } from '@/components/guide/category-tile'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { categories, popularTopics, categoryContent, type Category } from '@/lib/data'
import { cn } from '@/lib/utils'
import { getLucideIcon } from '@/lib/icons'

// Mock recent searches
const recentSearches = ['WiFi password', 'Check-in time', 'Laundry']

export default function SearchPage() {
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

  const clearRecent = (item: string) => {
    setRecentItems(recentItems.filter((i) => i !== item))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guide
          </Link>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for help..."
              autoFocus
              className="w-full pl-12 pr-4 py-4 text-lg bg-card border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="space-y-6">
              {hasResults ? (
                <>
                  {/* Category Results */}
                  {(searchResults?.categories.length ?? 0) > 0 && (
                    <section>
                      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Categories
                      </h2>
                      <div className="space-y-3">
                        {searchResults?.categories.map((category) => (
                          <CategoryTile key={category.id} category={category} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Content Results */}
                  {(searchResults?.content.length ?? 0) > 0 && (
                    <section>
                      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Related Content
                      </h2>
                      <div className="space-y-3">
                        {searchResults?.content.map((result, index) => (
                          <Link
                            key={index}
                            href={`/category/${result.categorySlug}`}
                            className="block p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
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
                </>
              ) : (
                /* No Results */
                <div className="text-center py-12">
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
            </div>
          )}

          {/* Default State - Recent & Popular */}
          {!isSearching && (
            <div className="space-y-8">
              {/* Recent Searches */}
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
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary"
                      >
                        <button
                          onClick={() => setQuery(item)}
                          className="text-sm text-foreground hover:text-primary transition-colors"
                        >
                          {item}
                        </button>
                        <button
                          onClick={() => clearRecent(item)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Popular Topics */}
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
                      onClick={() => setQuery(topic)}
                      className="px-4 py-2 rounded-full bg-primary/5 text-sm font-medium text-foreground hover:bg-primary/10 transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </section>

              {/* Quick Filters by Category */}
              <section>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Browse by Category
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {categories.slice(0, 9).map((category) => {
                    const Icon = getLucideIcon(category.icon)
                    return (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-all',
                          'active:scale-[0.98]'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
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
            </div>
          )}
        </div>
      </main>

      <StickyBottomBar />
    </div>
  )
}
