import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { AlertBox } from '@/components/guide/alert-box'
import { InfoCard } from '@/components/guide/info-card'
import { InstructionStepper } from '@/components/guide/instruction-stepper'
import { FAQAccordion } from '@/components/guide/faq-accordion'
import { ContactCard } from '@/components/guide/contact-card'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import {
  getCategoryBySlug,
  getCategoryContent,
  buildings,
  supportContacts,
} from '@/lib/data'
import { cn } from '@/lib/utils'
import { getLucideIcon } from '@/lib/icons'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  const content = getCategoryContent(slug)
  const currentBuilding = buildings[0]

  if (!category || !content) {
    notFound()
  }

  const Icon = getLucideIcon(category.icon)
  const isEmergency = slug === 'emergency'

  return (
    <div className="min-h-screen bg-background">
      <Header buildingName={currentBuilding.name} />

      <main className="pt-24 pb-24 md:pb-10 space-y-5">
        <section className="guide-shell pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guide
          </Link>
        </section>

        <section className="guide-shell space-y-6">
          <header className="guide-section p-5 md:p-7">
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center mb-4',
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
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
              {category.title}
            </h1>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
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
              phone={supportContacts.emergency.phone}
            />
          )}

          <div className="space-y-6">
            {content.sections.map((section) => {
              switch (section.type) {
                case 'steps':
                  return (
                    <InstructionStepper
                      key={section.id}
                      title={section.title}
                      steps={section.items || []}
                    />
                  )
                case 'card':
                  return (
                    <InfoCard
                      key={section.id}
                      title={section.title}
                      content={section.content}
                      items={section.items}
                    />
                  )
                case 'accordion':
                  return (
                    <FAQAccordion
                      key={section.id}
                      title={section.title}
                      items={section.items || []}
                    />
                  )
                case 'contact':
                  if (isEmergency) return null
                  return (
                    <ContactCard
                      key={section.id}
                      title={section.title}
                      phone={section.content}
                    />
                  )
                case 'tabs':
                  return (
                    <LaundryTabs
                      key={section.id}
                      title={section.title}
                      items={section.items || []}
                    />
                  )
                case 'schedule':
                  return (
                    <ScheduleCard
                      key={section.id}
                      title={section.title}
                      items={section.items || []}
                    />
                  )
                default:
                  return null
              }
            })}
          </div>

          <NeedHelpCard />
          <RelatedCategories currentSlug={slug} />
        </section>
      </main>

      <StickyBottomBar />
    </div>
  )
}

// Laundry Tabs Component
function LaundryTabs({
  title,
  items,
}: {
  title?: string
  items: Array<{ id: string; title: string; description?: string }>
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      {title && (
        <h3 className="font-semibold text-lg mb-4 text-foreground">{title}</h3>
      )}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'p-4 rounded-xl',
              index === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-secondary'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {index === 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  This Building
                </span>
              )}
              <h4 className="font-medium text-foreground">{item.title}</h4>
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Schedule Card Component
function ScheduleCard({
  title,
  items,
}: {
  title?: string
  items: Array<{ id: string; title: string; description?: string }>
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      {title && (
        <h3 className="font-semibold text-lg mb-4 text-foreground">{title}</h3>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-secondary"
          >
            <span className="font-medium text-foreground">{item.title}</span>
            <span className="text-sm text-muted-foreground">
              {item.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Generate static params for all category pages
export async function generateStaticParams() {
  const { categories } = await import('@/lib/data')
  return categories.map((category) => ({
    slug: category.slug,
  }))
}

// Generate metadata for each category page
export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)

  if (!category) {
    return {
      title: 'Category Not Found | WOW Guide',
    }
  }

  return {
    title: `${category.title} | WOW Guide`,
    description: category.subtitle,
  }
}
