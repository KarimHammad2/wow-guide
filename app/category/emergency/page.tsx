import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Phone, CheckCircle, XCircle, Droplet, Flame, Zap, Shield } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { AlertBox } from '@/components/guide/alert-box'
import { InstructionStepper } from '@/components/guide/instruction-stepper'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { Footer } from '@/components/guide/footer'
import { buildings } from '@/lib/data'
import { cn } from '@/lib/utils'

const currentBuilding = buildings[0]

const emergencyNumbers = [
  { number: '144', label: 'Ambulance', description: 'Medical emergencies' },
  { number: '117', label: 'Police', description: 'Crime, violence, accidents' },
  { number: '118', label: 'Fire Brigade', description: 'Fire, rescue' },
]

const whenToCall = [
  'Water leaks or flooding',
  'No heating in winter (apartment below 18°C)',
  'Locked out of your apartment',
  'Security concerns or suspicious activity',
  'Fire or smoke (after calling 118)',
  'Broken windows or door locks',
]

const whenNotToCall = [
  'General questions about your stay',
  'WiFi or TV issues',
  'Cleaning requests',
  'Feedback or complaints',
  'Reservation changes',
  'Non-urgent maintenance requests',
]

const urgentActions = [
  {
    id: 'water',
    title: 'Water Emergency',
    icon: Droplet,
    description: 'Locate the main water shut-off valve under the kitchen sink. Turn clockwise to close. Mop up excess water and ventilate the area.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'gas',
    title: 'Gas Smell',
    icon: Flame,
    description: 'DO NOT use electrical switches or create sparks. Open all windows immediately. Leave the building and call emergency services from outside.',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'power',
    title: 'Power Outage',
    icon: Zap,
    description: 'Check the fuse box in the hallway cabinet. Reset tripped breakers by flipping them back. If the entire building is dark, wait or call emergency line.',
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'security',
    title: 'Security Concern',
    icon: Shield,
    description: 'If you feel unsafe, lock your door and call our emergency line or police (117). Do not confront suspicious individuals.',
    color: 'bg-purple-100 text-purple-700',
  },
]

export default function EmergencyPage() {
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
          <header className="mb-6">
            <div className="w-14 h-14 rounded-2xl bg-destructive text-destructive-foreground flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Emergency
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              We&apos;re here to help 24/7. Use this page to understand when and how to reach us in case of emergencies.
            </p>
          </header>

          {/* Critical Alert */}
          <AlertBox
            type="danger"
            message="For life-threatening emergencies, call 144 (ambulance), 117 (police), or 118 (fire) IMMEDIATELY. Do not wait."
            className="mb-6"
          />

          {/* WOW Emergency Hotline */}
          <div className="rounded-2xl bg-destructive text-destructive-foreground p-6 mb-8">
            <div className="text-center">
              <p className="text-destructive-foreground/80 text-sm uppercase tracking-wider mb-2">
                24/7 Emergency Hotline
              </p>
              <p className="text-3xl md:text-4xl font-bold mb-2">
                {currentBuilding.emergencyPhone}
              </p>
              <p className="text-destructive-foreground/80 text-sm mb-5">
                Available around the clock, every day
              </p>
              <a
                href={`tel:${currentBuilding.emergencyPhone.replace(/\s/g, '')}`}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-destructive font-semibold text-lg hover:bg-white/90 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Now
              </a>
            </div>
          </div>

          {/* Swiss Emergency Numbers */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Swiss Emergency Numbers
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {emergencyNumbers.map((item) => (
                <a
                  key={item.number}
                  href={`tel:${item.number}`}
                  className="flex flex-col items-center p-4 rounded-2xl bg-card border border-border hover:border-destructive/30 hover:shadow-md transition-all"
                >
                  <span className="text-2xl font-bold text-destructive mb-1">
                    {item.number}
                  </span>
                  <span className="font-medium text-foreground text-sm">
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    {item.description}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* When to Call */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* When TO call */}
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-destructive" />
                When to Call Us
              </h3>
              <ul className="space-y-2">
                {whenToCall.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-destructive mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* When NOT to call */}
            <div className="rounded-2xl bg-card border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-muted-foreground" />
                When NOT to Call
              </h3>
              <ul className="space-y-2">
                {whenNotToCall.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-muted-foreground mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-primary mt-4">
                For non-urgent matters, email mail@wowliving.ch
              </p>
            </div>
          </div>

          {/* Urgent Actions */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Urgent Actions
            </h2>
            <div className="space-y-4">
              {urgentActions.map((action) => {
                const Icon = action.icon
                return (
                  <div
                    key={action.id}
                    className="rounded-2xl bg-card border border-border p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                          action.color
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Important Locations */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Important Locations in Your Apartment
            </h2>
            <div className="rounded-2xl bg-secondary p-5">
              <ul className="space-y-4">
                <li className="flex justify-between items-start">
                  <span className="text-muted-foreground">Main Water Shut-Off</span>
                  <span className="font-medium text-foreground text-right">Under kitchen sink</span>
                </li>
                <li className="flex justify-between items-start">
                  <span className="text-muted-foreground">Fuse Box</span>
                  <span className="font-medium text-foreground text-right">Hallway cabinet</span>
                </li>
                <li className="flex justify-between items-start">
                  <span className="text-muted-foreground">Fire Extinguisher</span>
                  <span className="font-medium text-foreground text-right">Building hallway, each floor</span>
                </li>
                <li className="flex justify-between items-start">
                  <span className="text-muted-foreground">Emergency Exit</span>
                  <span className="font-medium text-foreground text-right">Stairway, follow green signs</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Need Help Card */}
          <NeedHelpCard className="mt-8" />

          {/* Related Categories */}
          <RelatedCategories currentSlug="emergency" className="mt-8" />
        </div>
      </main>

      <Footer />
      <StickyBottomBar />
    </div>
  )
}

export const metadata = {
  title: 'Emergency | WOW Guide',
  description: '24/7 emergency contacts and urgent action guide for your WOW Living apartment.',
}
