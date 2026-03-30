import { Suspense } from 'react'
import { Header } from '@/components/guide/header'
import { BuildingSearchPageClient } from './building-search-page-client'

interface PageProps {
  params: Promise<{ slug: string }>
}

function BuildingSearchFallback() {
  return (
    <div className="min-h-screen bg-background">
      <Header buildingName="Loading…" />
      <main className="pt-24 pb-24 md:pb-10 space-y-5">
        <section className="guide-shell pt-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </section>
        <section className="guide-shell">
          <div className="guide-section p-4 md:p-6">
            <div className="h-12 rounded-2xl bg-secondary animate-pulse" />
          </div>
        </section>
        <section className="guide-shell">
          <div className="guide-section p-4 md:p-6">
            <div className="h-4 w-40 rounded bg-secondary animate-pulse mb-4" />
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-6">
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

export default function BuildingSearchPage({ params }: PageProps) {
  return (
    <Suspense fallback={<BuildingSearchFallback />}>
      <BuildingSearchPageClient params={params} />
    </Suspense>
  )
}
