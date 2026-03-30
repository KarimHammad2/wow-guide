import Link from 'next/link'
import { ArrowLeft, Key, Clock, CheckCircle, Star } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { AlertBox } from '@/components/guide/alert-box'
import { InfoCard } from '@/components/guide/info-card'
import { InstructionStepper } from '@/components/guide/instruction-stepper'
import { ImageCard } from '@/components/guide/image-card'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { Footer } from '@/components/guide/footer'
import { buildings } from '@/lib/data'

const currentBuilding = buildings[0]

const checkInSteps = [
  {
    id: '1',
    title: 'Locate the Key Box',
    description: 'Find the key box at the main entrance. It is a gray metal box mounted on the wall to the right of the main door.',
  },
  {
    id: '2',
    title: 'Enter Your Access Code',
    description: 'Enter the 6-digit code provided in your welcome email. The code is unique to your reservation.',
  },
  {
    id: '3',
    title: 'Retrieve Your Keys',
    description: 'Inside you will find your apartment key (silver), mailbox key (small brass), and an info card.',
  },
  {
    id: '4',
    title: 'Enter the Building',
    description: 'Use the main entrance key to unlock the door. The elevator is straight ahead.',
  },
  {
    id: '5',
    title: 'Find Your Apartment',
    description: 'Take the elevator to your floor. Your apartment number is clearly marked on the door.',
  },
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
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Check-In / Check-Out
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Everything you need for a smooth arrival and departure. Self check-in is available 24/7.
            </p>
          </header>

          {/* Important Alert */}
          <AlertBox
            type="info"
            message="Please ensure you have received your access codes before arrival. Check your email for the welcome message with your unique code."
            className="mb-6"
          />

          {/* Check-in Times */}
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

          {/* Important Before Arrival Card */}
          <div className="rounded-2xl bg-accent/30 border border-accent/50 p-5 mb-8">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Important Before Arrival
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Save your access code from the welcome email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Download offline maps of Basel in case of poor signal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Note the emergency contact number</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Plan your route to {currentBuilding.address}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Check-In Steps */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Self Check-In Steps
            </h2>
            <InstructionStepper steps={checkInSteps} />
          </section>

          {/* Visual Reference Images */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Visual Reference
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <ImageCard alt="Key Box Location" caption="Key box at entrance" />
              <ImageCard alt="Main Entrance" caption="Building entrance" />
              <ImageCard alt="Elevator" caption="Elevator lobby" />
              <ImageCard alt="Apartment Door" caption="Apartment door" />
            </div>
          </section>

          {/* Check-Out Steps */}
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

      <Footer />
      <StickyBottomBar />
    </div>
  )
}

export const metadata = {
  title: 'Check-In / Check-Out | WOW Guide',
  description: 'Self check-in instructions and check-out checklist for your WOW Living apartment.',
}
