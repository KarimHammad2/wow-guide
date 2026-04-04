import { MapPin } from 'lucide-react'
import type { Building } from '@/lib/data'
import { getBuildingGoogleMapsUrl } from '@/lib/maps'
import { cn } from '@/lib/utils'

interface BuildingHeroProps {
  building: Building
  className?: string
}

export function BuildingHero({ building, className }: BuildingHeroProps) {
  const mapsUrl = getBuildingGoogleMapsUrl(building)

  return (
    <section
      className={cn(
        'relative bg-primary text-primary-foreground rounded-3xl overflow-hidden',
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative px-6 py-8 md:px-8 md:py-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-balance">WOW Guide</h1>

        <div className="flex items-center gap-2 text-primary-foreground/80">
          <MapPin className="w-4 h-4 shrink-0" aria-hidden />
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 decoration-primary-foreground/40 hover:decoration-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground rounded-sm"
          >
            {building.address}, {building.city}
          </a>
        </div>

        <p className="mt-4 text-primary-foreground/90 leading-relaxed max-w-2xl">
          {building.welcomeMessage}
        </p>
      </div>
    </section>
  )
}
