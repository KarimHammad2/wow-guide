import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { ContactCard } from '@/components/guide/contact-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { buildings, supportContacts } from '@/lib/data'

const currentBuilding = buildings[0]
const emergencyPhone = supportContacts.emergency.phone

export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header buildingName={currentBuilding.name} plumNav />

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

        <section className="guide-shell">
          <div className="max-w-xl mx-auto space-y-6">
            <header className="guide-section p-5 md:p-7">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-destructive text-destructive-foreground flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
                    Emergency?
                  </h1>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    Please only call for urgent issues, outside The office hours.
                  </p>
                </div>
              </div>
            </header>

            <ContactCard
              variant="emergency"
              phone={emergencyPhone}
              className="shadow-sm"
            />
          </div>

          <div className="max-w-xl mx-auto mt-8">
            <RelatedCategories currentSlug="emergency" />
          </div>
        </section>
      </main>

      <StickyBottomBar />
    </div>
  )
}

export const metadata = {
  title: 'Emergency? | WOW Guide',
  description:
    'Urgent issues outside office hours — WOW Living emergency contact.',
}
