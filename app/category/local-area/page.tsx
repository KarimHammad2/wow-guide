"use client"

import { Header } from "@/components/guide/header"
import { Footer } from "@/components/guide/footer"
import { NeedHelpCard } from "@/components/guide/need-help-card"
import { 
  MapPin, 
  Coffee, 
  ShoppingBag, 
  Utensils,
  Train,
  TreePine,
  Building2,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

const localSpots = [
  {
    category: "Coffee & Cafes",
    icon: Coffee,
    color: "bg-amber-500/10 text-amber-600",
    places: [
      { name: "Workshop Coffee", distance: "2 min walk", description: "Specialty coffee roasters" },
      { name: "Notes Coffee", distance: "5 min walk", description: "Great for remote working" },
      { name: "Ozone Coffee", distance: "7 min walk", description: "Excellent brunch spot" },
    ]
  },
  {
    category: "Restaurants & Dining",
    icon: Utensils,
    color: "bg-red-500/10 text-red-600",
    places: [
      { name: "Caravan", distance: "3 min walk", description: "All-day dining, great cocktails" },
      { name: "The Eagle", distance: "5 min walk", description: "Traditional British pub" },
      { name: "Grain Store", distance: "8 min walk", description: "Vegetable-forward fine dining" },
    ]
  },
  {
    category: "Shopping",
    icon: ShoppingBag,
    color: "bg-pink-500/10 text-pink-600",
    places: [
      { name: "Coal Drops Yard", distance: "5 min walk", description: "Designer shops and boutiques" },
      { name: "Waitrose", distance: "8 min walk", description: "Premium supermarket" },
      { name: "Sainsbury's Local", distance: "3 min walk", description: "Convenience store" },
    ]
  },
  {
    category: "Parks & Green Spaces",
    icon: TreePine,
    color: "bg-green-500/10 text-green-600",
    places: [
      { name: "Granary Square", distance: "2 min walk", description: "Fountains and waterside seating" },
      { name: "Regent's Canal", distance: "5 min walk", description: "Beautiful towpath walks" },
      { name: "Camley Street Natural Park", distance: "10 min walk", description: "Urban nature reserve" },
    ]
  },
]

const transport = [
  { name: "King's Cross Station", type: "National Rail & Underground", time: "8 min walk", lines: "Victoria, Northern, Piccadilly, Circle, H&C, Metropolitan" },
  { name: "St Pancras International", type: "Eurostar & Thameslink", time: "10 min walk", lines: "Direct to Paris, Brussels, East Midlands" },
  { name: "Angel Station", type: "Underground", time: "12 min walk", lines: "Northern Line" },
]

export default function LocalAreaPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="px-4 py-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <MapPin className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Local Area Guide
            </h1>
            <p className="text-muted-foreground">
              Discover the best of King&apos;s Cross - one of London&apos;s most vibrant neighbourhoods.
            </p>
          </div>

          {/* Neighbourhood Overview */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 border border-border mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">King&apos;s Cross</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Once an industrial hub, King&apos;s Cross has transformed into one of London&apos;s most exciting areas. 
                  With world-class restaurants, independent shops, and beautiful canalside walks, 
                  there&apos;s always something to explore.
                </p>
              </div>
            </div>
          </div>

          {/* Transport Links */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Train className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Transport Links</h2>
            </div>
            <div className="space-y-3">
              {transport.map((station, index) => (
                <div key={index} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">{station.name}</h4>
                      <p className="text-sm text-muted-foreground">{station.type}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {station.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{station.lines}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Local Spots by Category */}
          {localSpots.map((section, index) => (
            <div key={index} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.color}`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{section.category}</h2>
              </div>
              <div className="space-y-3">
                {section.places.map((place, placeIndex) => (
                  <div 
                    key={placeIndex} 
                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-foreground">{place.name}</h4>
                      <p className="text-sm text-muted-foreground">{place.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {place.distance}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Map Link */}
          <Link
            href="https://maps.google.com/?q=Kings+Cross+London"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors mb-8"
          >
            <MapPin className="w-5 h-5" />
            Open in Google Maps
            <ExternalLink className="w-4 h-4" />
          </Link>

          <NeedHelpCard />
        </div>
      </main>

      <Footer />
    </div>
  )
}
