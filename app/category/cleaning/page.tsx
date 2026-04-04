import Link from 'next/link'
import { ArrowLeft, Sparkles, Calendar, CheckCircle, Clock, Star } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { buildings } from '@/lib/data'

const currentBuilding = buildings[0]

// Example cleaning schedule for 2024
const cleaningSchedule = [
  { month: 'January', dates: ['Jan 8', 'Jan 22'] },
  { month: 'February', dates: ['Feb 5', 'Feb 19'] },
  { month: 'March', dates: ['Mar 4', 'Mar 18'] },
  { month: 'April', dates: ['Apr 1', 'Apr 15', 'Apr 29'] },
  { month: 'May', dates: ['May 13', 'May 27'] },
  { month: 'June', dates: ['Jun 10', 'Jun 24'] },
]

const routineCleaningItems = [
  'Vacuuming and mopping all floors',
  'Dusting surfaces, furniture, and decor',
  'Kitchen cleaning (counters, stovetop, sink)',
  'Bathroom deep clean (toilet, shower, sink)',
  'Fresh bed linens and towels',
  'Emptying all trash bins',
  'Window sill cleaning',
]

const finalCleaningItems = [
  'Complete deep clean of entire apartment',
  'Inside oven and microwave cleaning',
  'Refrigerator interior cleaning',
  'All cabinet exteriors wiped down',
  'Window cleaning (interior)',
  'Balcony/terrace cleanup',
  'Final inspection and quality check',
]

export default function CleaningPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header buildingName={currentBuilding.name} />

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
            <div className="w-14 h-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Cleaning
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Your apartment is professionally cleaned to the highest standards. Here&apos;s everything you need to know about our cleaning services.
            </p>
          </header>

          {/* Cleaning Frequency Banner */}
          <div className="rounded-2xl bg-primary text-primary-foreground p-5 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-6 h-6 text-accent" />
              <h3 className="font-semibold text-lg">Bi-Weekly Cleaning</h3>
            </div>
            <p className="text-primary-foreground/90">
              Routine cleaning is provided every two weeks during your stay. Our team will coordinate access with you in advance via email or phone.
            </p>
          </div>

          {/* Cleaning Schedule */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Cleaning Schedule 2024
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {cleaningSchedule.map((item) => (
                <div
                  key={item.month}
                  className="p-4 rounded-xl bg-card border border-border"
                >
                  <h4 className="font-medium text-foreground text-sm mb-2">
                    {item.month}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {item.dates.map((date) => (
                      <span
                        key={date}
                        className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Dates may vary. You will receive confirmation before each visit.
            </p>
          </section>

          {/* Routine Cleaning Details */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              What&apos;s Included in Routine Cleaning
            </h2>
            <div className="rounded-2xl bg-card border border-border p-5">
              <ul className="space-y-3">
                {routineCleaningItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Final Cleaning Details */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Final Cleaning (at Check-Out)
            </h2>
            <div className="rounded-2xl bg-accent/30 border border-accent/50 p-5">
              <p className="text-muted-foreground mb-4">
                A comprehensive final cleaning is included in your booking. You don&apos;t need to deep clean before departure, just leave the apartment in a reasonable condition.
              </p>
              <ul className="space-y-3">
                {finalCleaningItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Extra Cleaning CTA */}
          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5 mb-8">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Want Weekly Cleaning?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We offer additional cleaning services at a reasonable rate. Contact us to arrange weekly or more frequent cleaning during your stay.
                </p>
                <a
                  href="mailto:mail@wowliving.ch?subject=Weekly Cleaning Request"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  Request Extra Cleaning
                </a>
              </div>
            </div>
          </div>

          {/* Need Help Card */}
          <NeedHelpCard className="mt-8" />

          {/* Related Categories */}
          <RelatedCategories currentSlug="cleaning" className="mt-8" />
        </div>
      </main>

      <StickyBottomBar />
    </div>
  )
}

export const metadata = {
  title: 'Cleaning | WOW Guide',
  description: 'Cleaning schedule and services for your WOW Living apartment.',
}
