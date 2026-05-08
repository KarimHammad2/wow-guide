import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { AlertBox } from '@/components/guide/alert-box'
import { ContactCard } from '@/components/guide/contact-card'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { GuideBlockRenderer } from '@/components/guide/blocks/guide-block-renderer'
import { BuildingAnalyticsTracker } from '@/components/site/building-analytics-tracker'
import { getBuildingById } from '@/lib/buildings-repository'
import {
  getBuildingCategories,
  getBuildingCategoryContent,
  getEditorCategoryContent,
} from '@/lib/building-guides-repository'
import { getEditorSessionUser } from '@/lib/editor-api'
import { normalizeInternetCategoryGuestContent } from '@/lib/guide-internet-guest-normalize'
import { getCategoryBySlug, getCategoryContent } from '@/lib/data'
import type { GuideContent } from '@/lib/admin-types'
import { cn } from '@/lib/utils'
import { getLucideIcon, isCategoryIconImageUrl } from '@/lib/icons'

interface CategoryPageProps {
  params: Promise<{ slug: string; categorySlug: string }>
  searchParams: Promise<{ preview?: string }>
}

export const dynamic = 'force-dynamic'

const EMERGENCY_SLUG = 'emergency'

function emergencyGuideFallback(): GuideContent {
  const seed = getCategoryContent(EMERGENCY_SLUG)
  if (seed) {
    return {
      intro: seed.intro,
      alert: seed.alert,
      sections: seed.sections,
    }
  }
  return {
    intro: 'For urgent issues outside office hours, use the emergency number below.',
    sections: [],
  }
}

export default async function BuildingCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug, categorySlug } = await params
  const { preview: previewQuery } = await searchParams
  const building = await getBuildingById(slug)

  if (!building) {
    notFound()
  }

  const buildingCategories = await getBuildingCategories(building.id)
  let category =
    buildingCategories.find((item) => item.slug === categorySlug) ?? null
  let content = (await getBuildingCategoryContent(building.id, categorySlug)) ?? null
  let draftPreviewActive = false

  /**
   * Logged-in editors can open ?preview=draft to see the same merged draft as the Visual Builder.
   * Guests still only see published `content` (unchanged when this param is missing or user is anonymous).
   */
  if (previewQuery === 'draft') {
    const editorUser = await getEditorSessionUser()
    if (editorUser) {
      const editorRow = await getEditorCategoryContent(building.id, categorySlug)
      const allowed =
        editorRow &&
        (!editorRow.ownerUserId || editorRow.ownerUserId === editorUser.userId)
      if (allowed && editorRow) {
        content = editorRow.content
        category = editorRow.category
        draftPreviewActive = true
        if (categorySlug === 'internet') {
          content = normalizeInternetCategoryGuestContent(content)
        }
      }
    }
  }

  // Banner and deep links use /category/emergency even when the section was not seeded in DB.
  if (categorySlug === EMERGENCY_SLUG) {
    if (!category) {
      category = getCategoryBySlug(EMERGENCY_SLUG) ?? null
    }
    if (!content) {
      content = emergencyGuideFallback()
    }
  }

  if (!category || !content) {
    notFound()
  }

  const Icon = getLucideIcon(category.icon)
  const isEmergency = categorySlug === 'emergency'
  const iconIsImage = isCategoryIconImageUrl(category.icon)
  const leadIsCatalogBand = content.sections[0]?.type === 'catalogBand'

  return (
    <div className="min-h-screen bg-background text-foreground" data-guide-category-surface>
      <Header
        buildingName={building.name}
        buildingSlug={building.id}
        supportEmail={building.supportEmail}
        navCategories={buildingCategories}
        plumNav
      />

      <main className="pt-24 pb-24 md:pb-10 space-y-4 md:space-y-6">
        <section className="guide-shell pt-2">
          <Link
            href={`/${building.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guide
          </Link>
        </section>

        {draftPreviewActive && (
          <section className="guide-shell">
            <div
              role="status"
              className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/40 dark:text-amber-50"
            >
              Draft preview — this is how the page looks with your saved draft and inheritance merge. Guests only see
              the last published version until you click Publish in the Visual Builder.
            </div>
          </section>
        )}

        <section className="guide-shell space-y-6">
          {!leadIsCatalogBand ? (
            <header className="guide-section p-4 sm:p-6 md:p-8 shadow-sm border border-border/70 bg-linear-to-br from-card to-secondary/20">
              <div
                className={cn(
                  'category-page-hero-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ring-8 ring-background',
                  isEmergency
                    ? 'bg-destructive text-destructive-foreground'
                    : category.color === 'primary'
                    ? 'bg-primary text-primary-foreground'
                    : category.color === 'accent'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-foreground'
                )}
              >
                {iconIsImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- category icon may be Supabase URL
                  <img src={category.icon} alt="" className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <Icon className="w-7 h-7" />
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-3 tracking-tight text-balance wrap-break-word">
                {category.title}
              </h1>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-3xl">
                {content.intro}
              </p>
            </header>
          ) : null}

          {content.alert && (
            <AlertBox
              type={content.alert.type}
              message={content.alert.message}
            />
          )}

          {isEmergency && (
            <ContactCard
              variant="emergency"
              phone={building.emergencyPhone}
            />
          )}

          <GuideBlockRenderer sections={content.sections} />

          <NeedHelpCard />
          <RelatedCategories
            currentSlug={categorySlug}
            categoryObjects={buildingCategories}
            buildingSlug={building.id}
          />
        </section>
      </main>

      <StickyBottomBar buildingSlug={building.id} supportEmail={building.supportEmail} />
      <BuildingAnalyticsTracker
        buildingId={building.id}
        pageTitle={category.title}
        pageType="category"
        categorySlug={category.slug}
      />
    </div>
  )
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps) {
  const { slug, categorySlug } = await params
  const { preview: previewQuery } = await searchParams
  const building = await getBuildingById(slug)

  if (!building) {
    return {
      title: 'Not Found | WOW Guide',
    }
  }

  const cats = await getBuildingCategories(building.id)
  const category =
    cats.find((item) => item.slug === categorySlug) ??
    (categorySlug === EMERGENCY_SLUG ? getCategoryBySlug(EMERGENCY_SLUG) : undefined)

  if (!category) {
    return {
      title: 'Not Found | WOW Guide',
    }
  }

  return {
    title: `${category.title} - ${building.name} | WOW Guide`,
    description: category.subtitle,
    ...(previewQuery === 'draft' ? { robots: { index: false, follow: false } as const } : {}),
  }
}
