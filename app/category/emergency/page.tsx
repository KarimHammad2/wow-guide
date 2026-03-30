import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Phone, CheckCircle, XCircle, Droplet, Flame, Zap, Shield } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { AlertBox } from '@/components/guide/alert-box'
import { ContactCard } from '@/components/guide/contact-card'
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

      <main className="pt-24 pb-24 md:pb-10 space-y-5">
        {/* Back navigation */}
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
          <div className="guide-grid">
            {/* Main column */}
            <div className="space-y-6">
              {/* Page Header */}
              <header className="guide-section p-5 md:p-7">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-destructive text-destructive-foreground flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
                      Emergency
                    </h1>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                      We&apos;re here to help 24/7. Use this page to understand when and how to reach us in case of emergencies.
                    </p>
                  </div>
                </div>
              </header>

              {/* Critical Alert */}
              <AlertBox
                type="danger"
                message="For life-threatening emergencies, call 144 (ambulance), 117 (police), or 118 (fire) IMMEDIATELY. Do not wait."
              />

              {/* When to Call */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* When TO call */}
                <div className="guide-section p-5">
                  <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-destructive" />
                    When to Call Us
                  </h2>
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
                <div className="guide-section p-5">
                  <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                    When NOT to Call
                  </h2>
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
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Urgent Actions
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {urgentActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <div
                        key={action.id}
                        className="guide-section p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                              action.color
                            )}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground mb-1">
                              {action.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <RelatedCategories currentSlug="emergency" />
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              <ContactCard
                variant="emergency"
                title="24/7 Emergency Hotline"
                phone={currentBuilding.emergencyPhone}
                className="sticky top-24"
              />

              <section className="guide-section p-5">
                <h2 className="font-semibold text-foreground mb-3">
                  Swiss Emergency Numbers
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {emergencyNumbers.map((item) => (
                    <a
                      key={item.number}
                      href={`tel:${item.number}`}
                      className="group flex flex-col items-center p-3 rounded-2xl bg-card border border-border hover:border-destructive/30 hover:shadow-md transition-all"
                    >
                      <span className="text-xl font-bold text-destructive mb-1">
                        {item.number}
                      </span>
                      <span className="font-medium text-foreground text-xs">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground text-center mt-1 leading-snug">
                        {item.description}
                      </span>
                    </a>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-destructive/5 border border-destructive/15 p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If there&apos;s <span className="font-medium text-foreground">smoke or fire</span>, call <span className="font-semibold text-destructive">118</span> first, then call our hotline.
                  </p>
                </div>
              </section>

              <a
                href={`tel:${currentBuilding.emergencyPhone.replace(/\s/g, '')}`}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call WOW Now
              </a>
            </aside>
          </div>
        </section>
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
