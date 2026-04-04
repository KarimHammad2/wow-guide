'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, WashingMachine, Clock, Users, Smartphone, AlertCircle } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { InstructionStepper } from '@/components/guide/instruction-stepper'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { buildings } from '@/lib/data'
import { cn } from '@/lib/utils'

const currentBuilding = buildings[0]

const laundryOptions = [
  {
    id: 'first-come',
    title: 'First Come, First Serve',
    icon: Users,
    description: 'The laundry room is available on a first-come, first-serve basis. Check availability before heading down. Typical wait times are short during weekday mornings.',
    isActive: true,
  },
  {
    id: 'calendar',
    title: 'Calendar Booking',
    icon: Clock,
    description: 'Book your laundry slot using the calendar posted in the building hallway (ground floor, next to mailboxes). Each slot is 2 hours. Write your apartment number to reserve.',
    isActive: false,
  },
  {
    id: 'app',
    title: 'App Booking',
    icon: Smartphone,
    description: 'Download the "WashConnect" app to book and pay for laundry slots directly from your phone. Building code: K12-WASH. Payment via credit card.',
    isActive: false,
  },
]

const machineSteps = [
  {
    id: '1',
    title: 'Sort your laundry',
    description: 'Separate whites, colors, and delicates into different loads.',
  },
  {
    id: '2',
    title: 'Check pockets',
    description: 'Remove all items from pockets to prevent damage.',
  },
  {
    id: '3',
    title: 'Load the machine',
    description: 'Fill to about 80% capacity. Do not overload.',
  },
  {
    id: '4',
    title: 'Add detergent',
    description: 'Use the dispenser drawer. Do not exceed the marked line.',
  },
  {
    id: '5',
    title: 'Select your program',
    description: 'Choose the appropriate wash cycle for your garments.',
  },
  {
    id: '6',
    title: 'Start and set a timer',
    description: 'Note when your cycle ends and return promptly to remove your laundry.',
  },
]

const etiquetteRules = [
  'Remove your laundry promptly when the cycle ends',
  'Clean the lint filter after using the dryer',
  'Wipe down machines after use if needed',
  'Leave the door ajar after use to prevent odors',
  'Report any issues immediately to building management',
  'Do not leave laundry unattended overnight',
]

export default function LaundryPage() {
  const [activeOption, setActiveOption] = useState('first-come')

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
            <div className="w-14 h-14 rounded-2xl bg-secondary text-foreground flex items-center justify-center mb-4">
              <WashingMachine className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Laundry
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Laundry facilities are available in the building basement. Please follow the rules and be considerate of other residents.
            </p>
          </header>

          {/* Location Info */}
          <div className="rounded-2xl bg-primary text-primary-foreground p-5 mb-8">
            <h3 className="font-semibold text-lg mb-2">Laundry Room Location</h3>
            <p className="text-primary-foreground/90 mb-3">
              Basement Level -1, accessible via elevator or stairs. Use your building key to access.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 rounded-full bg-primary-foreground/20 text-sm">
                2 Washing Machines
              </span>
              <span className="px-3 py-1.5 rounded-full bg-primary-foreground/20 text-sm">
                2 Dryers
              </span>
              <span className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                Free to Use
              </span>
            </div>
          </div>

          {/* Laundry Access Options */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Access Options
            </h2>
            <div className="space-y-3">
              {laundryOptions.map((option) => {
                const Icon = option.icon
                const isSelected = activeOption === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => setActiveOption(option.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-2xl border transition-all',
                      isSelected
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card border-border hover:border-primary/10'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">
                            {option.title}
                          </h3>
                          {option.isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                              This Building
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Machine Instructions */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Machine Instructions
            </h2>
            <InstructionStepper steps={machineSteps} />
          </section>

          {/* Laundry Etiquette */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Laundry Etiquette
            </h2>
            <div className="rounded-2xl bg-card border border-border p-5">
              <ul className="space-y-3">
                {etiquetteRules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Detergent Note */}
          <div className="rounded-2xl bg-accent/30 border border-accent/50 p-5 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground mb-1">
                  Bring Your Own Detergent
                </h3>
                <p className="text-sm text-muted-foreground">
                  Detergent is not provided. You can purchase laundry supplies at Migros or Coop supermarkets nearby.
                </p>
              </div>
            </div>
          </div>

          {/* Need Help Card */}
          <NeedHelpCard className="mt-8" />

          {/* Related Categories */}
          <RelatedCategories currentSlug="laundry" className="mt-8" />
        </div>
      </main>

      <StickyBottomBar />
    </div>
  )
}
