import Link from 'next/link'
import { ArrowLeft, Key, Clock, CheckCircle, Star, Utensils, ShoppingBag, House, Mailbox, Archive } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { AlertBox } from '@/components/guide/alert-box'
import { InstructionStepper } from '@/components/guide/instruction-stepper'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { buildings } from '@/lib/data'

const currentBuilding = buildings[0]

const checkInSteps = [
  {
    id: '1',
    title: 'Code Access for Front Door and Apartment',
    description: 'The front door and the apartment can both be opened by code.',
  },
  {
    id: '2',
    title: 'Receive Entry Code Before Arrival',
    description: 'You will receive the entry code at least 24 hours before arrival.',
  },
  {
    id: '3',
    title: 'Enter Code and Access',
    description: 'After entering the code, the front door and the apartment can be opened.',
  },
  {
    id: '4',
    title: 'Find Apartment Number and Floor',
    description: 'The apartment number and floor are specified in the contract.',
  },
]

const restaurantCafeItems = [
  {
    id: '1',
    title: 'Cafe Bar Rosenkranz',
    description: 'Lovely and cozy coffee spot, also good for an afterwork beer.',
  },
  {
    id: '2',
    title: 'Restaurant Milchhusli',
    description: 'Swiss and European kitchen, good for lunch or dinner.',
  },
  {
    id: '3',
    title: 'Taverne Johann',
    description: 'Fancy and delicious kitchen, good for lunch or dinner.',
  },
  {
    id: '4',
    title: 'Sun kitchen',
    description: 'Authentic Thai food for lunch, take-away also available.',
  },
  {
    id: '5',
    title: 'eat.ch',
    description: 'Useful when you prefer to order online.',
  },
  {
    id: '6',
    title: 'Uber Eats',
    description: 'Order something online through Uber Eats.',
  },
]

const houseRules = [
  'General night rest is at 10 pm.',
  'Please respect your neighbours.',
  'Please keep the hallway and common areas free of personal belongings.',
  'Please ventilate the apartment twice a day.',
  'Please use the kitchen ventilation while cooking.',
  'Please leave the oven door open after using the oven so steam can escape.',
  'To prevent burn marks, do not put hot pans on the kitchen tray or dining table.',
]

const checkOutSteps = [
  {
    id: '1',
    title: 'Remove Personal Belongings',
    description: 'Double-check all rooms, closets, and storage areas for your personal items.',
  },
  {
    id: '2',
    title: 'Empty Refrigerator',
    description: 'Remove all food items and dispose of perishables. No need to clean inside.',
  },
  {
    id: '3',
    title: 'Close Windows & Doors',
    description: 'Ensure all windows and balcony doors are securely closed and locked.',
  },
  {
    id: '4',
    title: 'Turn Off Appliances',
    description: 'Switch off lights, heating/AC. Leave the water heater on.',
  },
  {
    id: '5',
    title: 'Return Keys',
    description: 'Place ALL keys back in the key box and close it securely. You do not need to lock it.',
  },
]

export default function CheckInOutPage() {
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
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
              <Key className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Check-In</h1>
            <p className="text-muted-foreground leading-relaxed">
              Welcome at your new WOW Apartment! It is our highest goal to make your stay as perfect
              as possible. Here is some useful information for your check in.
            </p>
          </header>

          {/* Check-In Info Alert */}
          <AlertBox
            type="info"
            message="Please ensure you have received your access codes before arrival. Check your email for the welcome message with your unique code."
            className="mb-6"
          />

          {/* Check-In / Check-Out Times */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Check-In</span>
              </div>
              <p className="text-2xl font-bold text-foreground">From 15:00</p>
              <p className="text-sm text-muted-foreground mt-1">
                Self check-in available 24/7
              </p>
            </div>
            <div className="rounded-2xl bg-accent/30 border border-accent/50 p-5">
              <div className="flex items-center gap-2 text-accent-foreground mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Check-Out</span>
              </div>
              <p className="text-2xl font-bold text-foreground">By 11:00</p>
              <p className="text-sm text-muted-foreground mt-1">
                Late check-out on request
              </p>
            </div>
          </div>

          {/* Check-In Essentials */}
          <div className="rounded-2xl bg-accent/30 border border-accent/50 p-5 mb-8">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-accent-foreground shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Check-In Essentials
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>The front door and apartment can be opened by code.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>You receive the entry code at least 24 hours before arrival.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Apartment number and floor are specified in your contract.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>Despite self check in, we would like to welcome you personally after arrival.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Check-In Arrival Steps */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Self Check-In
            </h2>
            <InstructionStepper steps={checkInSteps} />
            <p className="text-sm text-muted-foreground mt-4 rounded-xl bg-card border border-border p-4">
              Despite the self check in, we would like to welcome you personally after your arrival so
              we can answer your questions and share the most important information about the apartment
              and the building.
            </p>
          </section>

          {/* Local Area (Check-In) */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Restaurants / Cafe
            </h2>
            <div className="rounded-2xl bg-card border border-border p-5">
              <p className="text-sm text-muted-foreground mb-4">
                Here is our top list of cafes and restaurants in your area (max. 10 minutes), plus two
                food delivery websites.
              </p>
              <div className="space-y-3">
                {restaurantCafeItems.map((item) => (
                  <div key={item.id} className="rounded-xl bg-background border border-border p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Shopping */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Shopping</h2>
            <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
              <div className="flex gap-3">
                <ShoppingBag className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Directly across the street is the Migros grocery store. Here you can buy food and
                  everyday consumer goods.
                </p>
              </div>
              <div className="flex gap-3">
                <ShoppingBag className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  A little cheaper and smaller is Denner, another shopping possibility in the immediate
                  proximity of your flat.
                </p>
              </div>
            </div>
          </section>

          {/* House Rules */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">House Rules</h2>
            <div className="rounded-2xl bg-card border border-border p-5">
              <p className="text-sm text-muted-foreground mb-4">
                To make living together a pleasure for everyone, please follow these rules:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {houseRules.map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <House className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Letters & Parcels */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Letters & Parcels</h2>
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <div className="flex gap-3">
                <Mailbox className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Your letterbox is labelled and located in the entrance area. You can open and close it
                  with the designated key in your apartment. Please empty the letterbox from time to
                  time.
                </p>
              </div>
              <div className="flex gap-3">
                <Mailbox className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  In Switzerland, post usually arrives in the morning, while parcels may come later in
                  the afternoon. If you are not at home, the parcel may be left next to the postbox or
                  you receive a notice to pick it up at the nearby post office (about a 3 minute walk).
                </p>
              </div>
            </div>
          </section>

          {/* Storage */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Storage</h2>
            <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
              <div className="flex gap-3">
                <Archive className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  You can store luggage in a shared common cellar free of charge. This cellar can be
                  used by every guest in the house.
                </p>
              </div>
              <div className="rounded-xl bg-accent/30 border border-accent/50 p-4">
                <p className="text-sm text-foreground">
                  If you need a private cellar, we can provide one for a fee of <strong>CHF 50</strong>.
                  Please contact us.
                </p>
              </div>
            </div>
          </section>

          {/* Check-Out (Departure) */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Check-Out Checklist
            </h2>
            <InstructionStepper steps={checkOutSteps} />
          </section>

          {/* Feedback CTA */}
          <div className="rounded-2xl bg-card border border-border p-5 mb-8">
            <h3 className="font-semibold text-foreground mb-2">
              How was your stay?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {"We'd love to hear your feedback. Your input helps us improve."}
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
              Leave Feedback
            </button>
          </div>

          {/* Need Help Card */}
          <NeedHelpCard className="mt-8" />

          {/* Related Categories */}
          <RelatedCategories currentSlug="check-in-out" className="mt-8" />
        </div>
      </main>

      <StickyBottomBar />
    </div>
  )
}

export const metadata = {
  title: 'Check-In / Check-Out | WOW Guide',
  description: 'Check-in details, local essentials, house rules, and check-out checklist.',
}
