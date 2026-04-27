import Link from 'next/link'
import { ArrowLeft, Trash2, Package, FileText, Wine, Droplet, Sofa, MapPin, Calendar, Info } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { AlertBox } from '@/components/guide/alert-box'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { buildings } from '@/lib/data'
import { cn } from '@/lib/utils'

const currentBuilding = buildings[0]

const wasteCategories = [
  {
    id: 'household',
    title: 'Household Garbage',
    icon: Trash2,
    description: 'General waste that cannot be recycled',
    instructions: 'Use official Basel garbage bags (Bebbisagg) available at Migros, Coop, and other supermarkets. Regular trash without Bebbisagg will not be collected.',
    color: 'bg-muted-foreground/20',
    iconColor: 'text-foreground',
    collection: 'Tuesdays & Fridays, before 07:00',
  },
  {
    id: 'cardboard',
    title: 'Cardboard',
    icon: Package,
    description: 'Boxes, packaging, carton',
    instructions: 'Flatten all boxes and bundle with string or stack neatly. Remove tape and labels when possible. Keep dry.',
    color: 'bg-amber-100',
    iconColor: 'text-amber-700',
    collection: 'Every 2nd Tuesday',
  },
  {
    id: 'paper',
    title: 'Paper',
    icon: FileText,
    description: 'Newspapers, magazines, office paper',
    instructions: 'Bundle with string. No plastic wrapping. No paper with food residue or coated paper.',
    color: 'bg-blue-100',
    iconColor: 'text-blue-700',
    collection: '1st Monday of month',
  },
  {
    id: 'glass',
    title: 'Glass',
    icon: Wine,
    description: 'Bottles, jars (no ceramics)',
    instructions: 'Separate by color (clear, brown, green). Remove lids. Rinse if necessary. Drop at nearest glass container - not collected at building.',
    color: 'bg-green-100',
    iconColor: 'text-green-700',
    collection: 'Bring to collection point',
  },
  {
    id: 'pet',
    title: 'PET Bottles',
    icon: Droplet,
    description: 'Plastic bottles with PET symbol',
    instructions: 'Crush bottles to save space. Return to any supermarket (Migros, Coop) or designated PET collection points.',
    color: 'bg-cyan-100',
    iconColor: 'text-cyan-700',
    collection: 'Return to supermarket',
  },
  {
    id: 'bulky',
    title: 'Bulky Goods',
    icon: Sofa,
    description: 'Furniture, large items',
    instructions: 'Large items require special pickup. Contact building management to arrange collection. Additional fees may apply.',
    color: 'bg-purple-100',
    iconColor: 'text-purple-700',
    collection: 'By appointment only',
  },
]

const pickupSchedule = [
  { type: 'Household Waste', day: 'Tuesday & Friday', time: 'Before 07:00' },
  { type: 'Cardboard', day: 'Every 2nd Tuesday', time: 'Before 07:00' },
  { type: 'Paper', day: '1st Monday of month', time: 'Before 07:00' },
]

export default function WastePlanPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header buildingName={currentBuilding.name} plumNav />

      <main className="pt-16 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Back navigation */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guide
          </Link>

          {/* Page Header */}
          <header className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Waste Plan
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Switzerland has a comprehensive recycling system. Please help us keep our environment clean by following the local waste guidelines.
            </p>
          </header>

          {/* Important Alert */}
          <AlertBox
            type="info"
            message="Most household waste requires special &quot;Bebbisagg&quot; bags in Basel. These are available at local supermarkets (Migros, Coop). Regular bags will NOT be collected."
            className="mb-8"
          />

          {/* Collection Point */}
          <div className="rounded-2xl bg-primary text-primary-foreground p-5 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Collection Point</h3>
            </div>
            <p className="text-primary-foreground/90">
              The building recycling station is located in the courtyard, accessible through the back entrance. Please keep the area tidy.
            </p>
          </div>

          {/* Waste Categories */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Recycling Categories
            </h2>
            <div className="space-y-4">
              {wasteCategories.map((category) => {
                const Icon = category.icon
                return (
                  <div
                    key={category.id}
                    className="rounded-2xl bg-card border border-border overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                            category.color
                          )}
                        >
                          <Icon className={cn('w-6 h-6', category.iconColor)} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            {category.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        {category.instructions}
                      </p>
                    </div>
                    <div className="px-4 py-3 bg-secondary/50 border-t border-border flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {category.collection}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Pickup Schedule Summary */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Pickup Schedule
            </h2>
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              {pickupSchedule.map((item, index) => (
                <div
                  key={item.type}
                  className={cn(
                    'flex items-center justify-between p-4',
                    index < pickupSchedule.length - 1 && 'border-b border-border'
                  )}
                >
                  <span className="font-medium text-foreground">{item.type}</span>
                  <div className="text-right">
                    <span className="text-sm text-foreground">{item.day}</span>
                    <span className="text-xs text-muted-foreground block">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tips for Expats */}
          <div className="rounded-2xl bg-accent/30 border border-accent/50 p-5 mb-8">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Tips for New Residents
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Bebbisagg:</strong> Official garbage bags cost about CHF 2 each and include disposal fees.
                  </li>
                  <li>
                    <strong>Glass:</strong> Find the nearest glass container at{' '}
                    <a href="https://map.geo.bs.ch" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      map.geo.bs.ch
                    </a>
                  </li>
                  <li>
                    <strong>Electronics:</strong> Return to any electronics store (free of charge).
                  </li>
                  <li>
                    <strong>Batteries:</strong> Return to any supermarket (collection boxes at entrance).
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Need Help Card */}
          <NeedHelpCard className="mt-8" />

          {/* Related Categories */}
          <RelatedCategories currentSlug="waste-plan" className="mt-8" />
        </div>
      </main>

      <StickyBottomBar />
    </div>
  )
}

export const metadata = {
  title: 'Waste Plan | WOW Guide',
  description: 'Recycling guide and waste disposal information for Basel, Switzerland.',
}
