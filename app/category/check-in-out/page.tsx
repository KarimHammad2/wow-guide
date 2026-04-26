import Link from 'next/link'
import { ArrowLeft, Key } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { AlertBox } from '@/components/guide/alert-box'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { GuideBlockRenderer } from '@/components/guide/blocks/guide-block-renderer'
import { BuildingAnalyticsTracker } from '@/components/site/building-analytics-tracker'
import { getBuildingCategories, getBuildingCategoryContent } from '@/lib/building-guides-repository'
import { buildings, getCategoryBySlug, getCategoryContent } from '@/lib/data'

const currentBuilding = buildings[0]
const categorySlug = 'check-in-out'

export default async function CheckInOutPage() {
  const category = getCategoryBySlug(categorySlug)
  const fallbackContent = getCategoryContent(categorySlug)
  const [buildingCategories, publishedContent] = await Promise.all([
    getBuildingCategories(currentBuilding.id),
    getBuildingCategoryContent(currentBuilding.id, categorySlug),
  ])

  const content = publishedContent ?? fallbackContent
  if (!category || !content) return null

  return (
    <div className="min-h-screen bg-background">
      <Header
        buildingName={currentBuilding.name}
        buildingSlug={currentBuilding.id}
        supportEmail={currentBuilding.supportEmail}
      />

      <main className="pt-24 pb-24 md:pb-10">
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Guide
          </Link>

          <header className="guide-section p-4 sm:p-6 md:p-8 shadow-sm border border-border/70 bg-linear-to-br from-card to-secondary/20">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground ring-8 ring-background">
              <Key className="h-7 w-7" />
            </div>
            <h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {category.title}
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {content.intro}
            </p>
          </header>

          {content.alert && <AlertBox type={content.alert.type} message={content.alert.message} />}

          <GuideBlockRenderer sections={content.sections} />

          <NeedHelpCard />
          <RelatedCategories
            currentSlug={categorySlug}
            categoryObjects={buildingCategories}
            buildingSlug={currentBuilding.id}
          />
        </div>
      </main>

      <StickyBottomBar buildingSlug={currentBuilding.id} supportEmail={currentBuilding.supportEmail} />
      <BuildingAnalyticsTracker
        buildingId={currentBuilding.id}
        pageTitle={category.title}
        pageType="category"
        categorySlug={categorySlug}
      />
    </div>
  )
}

export const metadata = {
  title: 'Check-In / Check-Out | WOW Guide',
  description: 'Published check-in details, local essentials, and departure steps from the visual builder.',
}
