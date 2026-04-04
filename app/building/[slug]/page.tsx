import { notFound } from 'next/navigation'
import { Header } from '@/components/guide/header'
import { BuildingHero } from '@/components/guide/building-hero'
import { SearchBar } from '@/components/guide/search-bar'
import { QuickActions } from '@/components/guide/quick-actions'
import { CategoryTile } from '@/components/guide/category-tile'
import { EmergencyBanner } from '@/components/guide/emergency-banner'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { getBuildingById, getBuildingCategories } from '@/lib/admin-store'

interface BuildingPageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: BuildingPageProps) {
  const { slug } = await params
  const building = getBuildingById(slug)

  if (!building) {
    return {
      title: 'Building Not Found | WOW Guide',
    }
  }

  return {
    title: `${building.name} | WOW Guide`,
    description: building.welcomeMessage,
  }
}

export default async function BuildingPage({ params }: BuildingPageProps) {
  const { slug } = await params
  const building = getBuildingById(slug)

  if (!building) {
    notFound()
  }

  const categories = getBuildingCategories(slug)

  return (
    <div className="min-h-screen bg-background">
      <Header buildingName={building.name} buildingSlug={building.id} />

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

        <section className="guide-shell">
          <QuickActions buildingSlug={building.id} className="guide-section p-4 md:p-6" />
        </section>

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
            <dl className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-secondary/70 border border-border p-3">
                <dt className="text-muted-foreground mb-1">Address</dt>
                <dd className="font-medium text-foreground">{building.address}</dd>
              </div>
              <div className="rounded-xl bg-secondary/70 border border-border p-3">
                <dt className="text-muted-foreground mb-1">City</dt>
                <dd className="font-medium text-foreground">{building.city}</dd>
              </div>
              <div className="rounded-xl bg-secondary/70 border border-border p-3">
                <dt className="text-muted-foreground mb-1">Country</dt>
                <dd className="font-medium text-foreground">{building.country}</dd>
              </div>
              <div className="rounded-xl bg-secondary/70 border border-border p-3">
                <dt className="text-muted-foreground mb-1">Support</dt>
                <dd className="font-medium text-primary break-all">
                  <a href={`mailto:${building.supportEmail}`}>{building.supportEmail}</a>
                </dd>
              </div>
            </dl>
          </section>
        </section>

        <section className="guide-shell">
          <EmergencyBanner phone={building.emergencyPhone} className="p-5 md:p-6" />
        </section>
      </main>

      <StickyBottomBar buildingSlug={building.id} />
    </div>
  )
}
