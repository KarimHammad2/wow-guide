import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { AlertBox } from '@/components/guide/alert-box'
import { ContactCard } from '@/components/guide/contact-card'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { Footer } from '@/components/guide/footer'
import { GuideBlockRenderer } from '@/components/guide/blocks/guide-block-renderer'
import {
  getBuildingById,
  getBuildingCategories,
  getBuildingCategoryContent,
} from '@/lib/admin-store'
import { cn } from '@/lib/utils'
import { getLucideIcon } from '@/lib/icons'

interface CategoryPageProps {
  params: Promise<{ slug: string; categorySlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function BuildingCategoryPage({ params }: CategoryPageProps) {
  const { slug, categorySlug } = await params
  const building = getBuildingById(slug)

  if (!building) {
    notFound()
  }

  const buildingCategories = getBuildingCategories(slug)
  const category = buildingCategories.find((item) => item.slug === categorySlug)
  const content = getBuildingCategoryContent(slug, categorySlug)

  if (!category || !content) {
    notFound()
  }

  const Icon = getLucideIcon(category.icon)
  const isEmergency = categorySlug === 'emergency'

  return (
    <div className="min-h-screen bg-background">
      <Header buildingName={building.name} buildingSlug={building.id} />

      <main className="pt-24 pb-24 md:pb-10 space-y-6">
        <section className="guide-shell pt-2">
          <Link
            href={`/building/${building.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guide
          </Link>
        </section>

        <section className="guide-shell space-y-6">
          <header className="guide-section p-6 md:p-8 shadow-sm border border-border/70 bg-gradient-to-br from-card to-secondary/20">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ring-8 ring-background',
                isEmergency
                  ? 'bg-destructive text-destructive-foreground'
                  : category.color === 'primary'
                  ? 'bg-primary text-primary-foreground'
                  : category.color === 'accent'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-secondary text-foreground'
              )}
            >
              <Icon className="w-7 h-7" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
              {category.title}
            </h1>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-3xl">
              {content.intro}
            </p>
          </header>

          {content.alert && (
            <AlertBox
              type={content.alert.type}
              message={content.alert.message}
            />
          )}

          {isEmergency && (
            <ContactCard
              variant="emergency"
              title="24/7 Emergency Hotline"
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

      <Footer />
      <StickyBottomBar buildingSlug={building.id} />
    </div>
  )
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug, categorySlug } = await params
  const building = getBuildingById(slug)

  if (!building) {
    return {
      title: 'Not Found | WOW Guide',
    }
  }

  const category = getBuildingCategories(slug).find((item) => item.slug === categorySlug)

  if (!category) {
    return {
      title: 'Not Found | WOW Guide',
    }
  }

  return {
    title: `${category.title} - ${building.name} | WOW Guide`,
    description: category.subtitle,
  }
}
