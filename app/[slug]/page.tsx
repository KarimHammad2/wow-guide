import { notFound } from 'next/navigation'
import { cache } from 'react'
import { Header } from '@/components/guide/header'
import { AlertBox } from '@/components/guide/alert-box'
import { BuildingHero, BUILDING_HERO_WELCOME_TEXT } from '@/components/guide/building-hero'
import { SearchBar } from '@/components/guide/search-bar'
import { QuickActions } from '@/components/guide/quick-actions'
import { CategoryTile } from '@/components/guide/category-tile'
import { EmergencyBanner } from '@/components/guide/emergency-banner'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { GuideBlockRenderer } from '@/components/guide/blocks/guide-block-renderer'
import { BuildingAnalyticsTracker } from '@/components/site/building-analytics-tracker'
import { getBuildingById } from '@/lib/buildings-repository'
import { getBuildingCategories, getBuildingQuickAccessCategories } from '@/lib/building-guides-repository'
import { getSitePageBySlug } from '@/lib/site-pages-repository'
import { DEFAULT_SUPPORT_EMAIL } from '@/lib/emergency-defaults'
import { formatQuietHoursDisplay } from '@/lib/quiet-hours'

interface BuildingPageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

const getSitePageCached = cache(async (slug: string) => getSitePageBySlug(slug))
const getBuildingCached = cache(async (slug: string) => getBuildingById(slug))
const getBuildingCategoriesCached = cache(async (buildingId: string) => getBuildingCategories(buildingId))
const getBuildingQuickAccessCached = cache(async (buildingId: string) =>
  getBuildingQuickAccessCategories(buildingId)
)

export async function generateMetadata({ params }: BuildingPageProps) {
  const { slug } = await params
  const sitePage = await getSitePageCached(slug)
  if (sitePage) {
    const description = sitePage.content.intro.trim() || sitePage.title
    return {
      title: `${sitePage.title} | WOW Guide`,
      description,
    }
  }

  const building = await getBuildingCached(slug)

  if (!building) {
    return {
      title: 'Not Found | WOW Guide',
    }
  }

  const description =
    building.welcomeMessage.trim() || BUILDING_HERO_WELCOME_TEXT

  return {
    title: `${building.name} | WOW Guide`,
    description,
  }
}

export default async function BuildingPage({ params }: BuildingPageProps) {
  const { slug } = await params
  const sitePage = await getSitePageCached(slug)
  if (sitePage) {
    const leadIsCatalogBand = sitePage.content.sections[0]?.type === 'catalogBand'
    return (
      <div
        data-site-page-surface
        className="min-h-screen bg-background text-foreground antialiased"
      >
        <Header flatNavbar sitePage={{ title: sitePage.title }} />

        <main className="pt-24 pb-24 md:pb-10 space-y-6">
          <section className="guide-shell">
            <div className="mx-auto w-full max-w-3xl space-y-6">
              {!leadIsCatalogBand ? (
                <header className="space-y-3 py-1">
                  <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white tracking-tight text-balance wrap-break-word">
                    {sitePage.title}
                  </h1>
                  {sitePage.content.intro.trim() ? (
                    <p className="text-white/90 leading-relaxed text-base md:text-lg">
                      {sitePage.content.intro}
                    </p>
                  ) : null}
                </header>
              ) : null}

              {sitePage.content.alert ? (
                <AlertBox
                  type={sitePage.content.alert.type}
                  message={sitePage.content.alert.message}
                />
              ) : null}

              <div className="text-white [&_.text-muted-foreground]:text-white/85 [&_.text-foreground]:text-white">
                <GuideBlockRenderer surface="flat" sections={sitePage.content.sections} />
              </div>
            </div>
          </section>
        </main>

        <StickyBottomBar />
      </div>
    )
  }

  const building = await getBuildingCached(slug)

  if (!building) {
    notFound()
  }

  const contactEmail = building.supportEmail.trim() || DEFAULT_SUPPORT_EMAIL

  const [categories, quickAccessCategories] = await Promise.all([
    getBuildingCategoriesCached(building.id),
    getBuildingQuickAccessCached(building.id),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Header
        buildingName={building.name}
        buildingSlug={building.id}
        supportEmail={building.supportEmail}
        navCategories={categories}
      />

      <main className="pt-24 pb-24 md:pb-10 space-y-6">
        <section className="guide-shell pt-4">
          <BuildingHero building={building} className="w-full" />
        </section>

        <section className="guide-shell">
          <div className="guide-section p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">
              How can we help?
            </h2>
            <SearchBar
              variant="hero"
              placeholder="Search for WiFi, parking, check-in..."
              buildingSlug={building.id}
            />
          </div>
        </section>

        {quickAccessCategories.length > 0 ? (
          <section className="guide-shell">
            <QuickActions
              buildingSlug={building.id}
              categories={quickAccessCategories}
              className="guide-section p-4 md:p-6"
            />
          </section>
        ) : null}

        <section className="guide-shell">
          <section className="guide-section p-4 md:p-6 space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              All Topics
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {categories.map((category) => (
                <CategoryTile
                  key={category.id}
                  category={category}
                  buildingSlug={building.id}
                />
              ))}
            </div>
          </section>
        </section>

        <section className="guide-shell">
          <section className="guide-section p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-3">
              Building Information
            </h3>
            <dl className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="rounded-xl bg-secondary/70 border border-border p-3">
                <dt className="text-muted-foreground mb-1">Address</dt>
                <dd className="font-medium text-foreground">{building.address}</dd>
              </div>
              <div className="rounded-xl bg-secondary/70 border border-border p-3">
                <dt className="text-muted-foreground mb-1">City</dt>
                <dd className="font-medium text-foreground">{building.city}</dd>
              </div>
              <div className="rounded-xl bg-secondary/70 border border-border p-3">
                <dt className="text-muted-foreground mb-1">Quiet Hours</dt>
                <dd className="font-medium text-foreground">{formatQuietHoursDisplay(building.quietHours)}</dd>
              </div>
              <div className="rounded-xl bg-secondary/70 border border-border p-3 min-w-0">
                <dt className="text-muted-foreground mb-1">Good to know</dt>
                <dd className="font-medium text-foreground wrap-break-word">
                  {building.goodToKnow.trim() ? building.goodToKnow : '—'}
                </dd>
              </div>
              <div className="rounded-xl bg-secondary/70 border border-border p-3">
                <dt className="text-muted-foreground mb-1">contact WOW via</dt>
                <dd className="font-medium text-primary break-all">
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </dd>
              </div>
            </dl>
          </section>
        </section>

        <section className="guide-shell">
          <EmergencyBanner phone={building.emergencyPhone} buildingSlug={building.id} className="p-5 md:p-6" />
        </section>
      </main>

      <StickyBottomBar buildingSlug={building.id} supportEmail={building.supportEmail} />
      <BuildingAnalyticsTracker buildingId={building.id} pageTitle={building.name} pageType="building_home" />
    </div>
  )
}
