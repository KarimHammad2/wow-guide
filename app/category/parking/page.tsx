import Link from 'next/link'
import { ArrowLeft, Car, MapPin, Key, CreditCard, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { InstructionStepper } from '@/components/guide/instruction-stepper'
import { InfoCard } from '@/components/guide/info-card'
import { ImageCard } from '@/components/guide/image-card'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { Footer } from '@/components/guide/footer'
import { buildings } from '@/lib/data'

const currentBuilding = buildings[0]

const accessSteps = [
  {
    id: '1',
    title: 'Approach the Garage Entrance',
    description: 'The garage entrance is on the right side of the building on Kannenfeldstrasse. Look for the gray metal gate.',
  },
  {
    id: '2',
    title: 'Enter Your PIN Code',
    description: 'Use the keypad on the left pillar. Enter your 4-digit parking PIN provided in your welcome email.',
  },
  {
    id: '3',
    title: 'Wait for the Gate',
    description: 'The gate will begin opening automatically. Wait until fully open before proceeding.',
  },
  {
    id: '4',
    title: 'Drive In Slowly',
    description: 'Enter the garage carefully. Speed limit is 10 km/h. Follow the arrows to Level -1.',
  },
  {
    id: '5',
    title: 'Find Your Space',
    description: 'Your assigned parking space number is indicated in your parking contract. Spaces are clearly numbered.',
  },
]

const parkingRules = [
  'Park only in your assigned space',
  'Speed limit: 10 km/h in the garage',
  'No storage of items outside your vehicle',
  'Keep the garage clean and tidy',
  'Report any damages or issues immediately',
  'No honking inside the garage',
  'Secure your vehicle - we are not liable for theft',
]

export default function ParkingPage() {
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
              <Car className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Parking Space
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Parking is available for residents in the underground garage. Here&apos;s everything you need to know about accessing and using the parking facilities.
            </p>
          </header>

          {/* Parking Overview Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl bg-primary text-primary-foreground p-5">
              <CreditCard className="w-6 h-6 text-accent mb-3" />
              <p className="text-sm text-primary-foreground/70 mb-1">Monthly Rate</p>
              <p className="text-2xl font-bold">CHF 150</p>
              <p className="text-xs text-primary-foreground/70 mt-1">per month</p>
            </div>
            <div className="rounded-2xl bg-accent text-accent-foreground p-5">
              <MapPin className="w-6 h-6 mb-3" />
              <p className="text-sm text-accent-foreground/70 mb-1">Location</p>
              <p className="text-lg font-bold">Level -1</p>
              <p className="text-xs text-accent-foreground/70 mt-1">Underground garage</p>
            </div>
          </div>

          {/* Availability Note */}
          <div className="rounded-2xl bg-secondary border border-border p-5 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  Availability
                </h3>
                <p className="text-sm text-muted-foreground">
                  Parking spaces are subject to availability. If you need a parking space and haven&apos;t booked one yet, please contact us to check current availability.
                </p>
              </div>
            </div>
          </div>

          {/* Access Instructions */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              How to Access Parking
            </h2>
            <InstructionStepper steps={accessSteps} />
          </section>

          {/* Visual Reference */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Visual Reference
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <ImageCard alt="Garage Entrance" caption="Entrance location" />
              <ImageCard alt="Keypad" caption="PIN keypad" />
            </div>
          </section>

          {/* Parking Access Info */}
          <div className="rounded-2xl bg-card border border-border p-5 mb-8">
            <h3 className="font-semibold text-foreground mb-4">
              Your Parking Access
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-secondary">
                <span className="text-muted-foreground">Access PIN</span>
                <span className="font-mono font-bold text-foreground">****</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-secondary">
                <span className="text-muted-foreground">Space Number</span>
                <span className="font-bold text-foreground">See welcome email</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-secondary">
                <span className="text-muted-foreground">Level</span>
                <span className="font-bold text-foreground">-1 (Underground)</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Your parking PIN and space number are included in your welcome email or parking contract.
            </p>
          </div>

          {/* EV Charging */}
          <div className="rounded-2xl bg-accent/30 border border-accent/50 p-5 mb-8">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  Electric Vehicle Charging
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  EV charging stations are available on request. Additional fees may apply. Contact us to arrange access.
                </p>
                <a
                  href="mailto:mail@wowliving.ch?subject=EV Charging Request"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  Request EV Charging
                </a>
              </div>
            </div>
          </div>

          {/* Parking Rules */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Parking Rules
            </h2>
            <div className="rounded-2xl bg-card border border-border p-5">
              <ul className="space-y-3">
                {parkingRules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Need Help Card */}
          <NeedHelpCard className="mt-8" />

          {/* Related Categories */}
          <RelatedCategories currentSlug="parking" className="mt-8" />
        </div>
      </main>

      <Footer />
      <StickyBottomBar />
    </div>
  )
}

export const metadata = {
  title: 'Parking Space | WOW Guide',
  description: 'Parking access instructions and rules for your WOW Living apartment building.',
}
