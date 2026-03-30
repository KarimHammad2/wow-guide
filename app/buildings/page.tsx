import Link from 'next/link'
import { ArrowLeft, MapPin, ChevronRight, Building2 } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { Footer } from '@/components/guide/footer'
import { getBuildings } from '@/lib/admin-store'
import { cn } from '@/lib/utils'

export default function BuildingsPage() {
  const buildings = getBuildings()
  const currentBuilding = buildings[0]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16 pb-8">
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
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Select Your Building
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Choose your building to access the specific guide for your apartment. Each building has unique information about amenities and services.
            </p>
          </header>

          {/* Current Selection Banner */}
          <div className="rounded-2xl bg-accent/30 border border-accent/50 p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currently viewing</p>
                <p className="font-semibold text-foreground">
                  {currentBuilding ? `${currentBuilding.name}, ${currentBuilding.city}` : 'No building selected'}
                </p>
              </div>
            </div>
          </div>

          {/* Building List */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              All Buildings
            </h2>
            {buildings.map((building, index) => (
              <Link
                key={building.id}
                href={`/?building=${building.id}`}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98]',
                  index === 0
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card border-border hover:border-primary/20 hover:shadow-md'
                )}
              >
                {/* Building Image Placeholder */}
                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                </div>

                {/* Building Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {building.name}
                    </h3>
                    {index === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex-shrink-0">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">
                      {building.address}, {building.city}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </section>

          {/* Info Note */}
          <div className="mt-8 p-4 rounded-xl bg-secondary">
            <p className="text-sm text-muted-foreground text-center">
              Can&apos;t find your building? Contact{' '}
              <a href="mailto:mail@wowliving.ch" className="text-primary font-medium">
                mail@wowliving.ch
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const metadata = {
  title: 'Select Building | WOW Guide',
  description: 'Choose your WOW Living building to access the specific apartment guide.',
}
