import Link from 'next/link'
import { ArrowLeft, Wifi, Tv, Speaker, Headphones } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { WifiCard } from '@/components/guide/wifi-card'
import { InfoCard } from '@/components/guide/info-card'
import { FAQAccordion } from '@/components/guide/faq-accordion'
import { ManualCard } from '@/components/guide/manual-card'
import { NeedHelpCard } from '@/components/guide/need-help-card'
import { RelatedCategories } from '@/components/guide/related-categories'
import { StickyBottomBar } from '@/components/guide/sticky-bottom-bar'
import { Footer } from '@/components/guide/footer'
import { buildings } from '@/lib/data'

const currentBuilding = buildings[0]

const troubleshootingItems = [
  {
    id: 'wifi-slow',
    title: 'WiFi is slow or not connecting',
    description: 'Try these steps: 1) Restart the router by unplugging it for 30 seconds. 2) Move closer to the router. 3) Disconnect other devices. 4) If issues persist after 10 minutes, contact support.',
  },
  {
    id: 'tv-no-signal',
    title: 'TV has no picture or signal',
    description: 'Ensure the TV is set to the correct HDMI input (usually HDMI 1). Check that all cables are securely connected. Try pressing the source/input button on the remote.',
  },
  {
    id: 'speaker-connect',
    title: 'Cannot connect to Bluetooth speaker',
    description: 'Make sure the speaker is turned on and in pairing mode (look for a flashing blue light). On your phone, remove any old pairings for "WOW-Speaker" and try pairing again.',
  },
  {
    id: 'streaming-login',
    title: 'How do I watch Netflix/Disney+?',
    description: 'The TV is a smart TV with streaming apps pre-installed. You can log in with your own Netflix, Disney+, or other streaming accounts. Remember to log out before you leave!',
  },
  {
    id: 'router-location',
    title: 'Where is the WiFi router?',
    description: 'The router is located in the living room, usually near the TV console or on a shelf. It is a white or black box with indicator lights.',
  },
]

const manuals = [
  {
    title: 'Samsung Smart TV Guide',
    description: 'Complete TV manual and features',
    fileType: 'pdf' as const,
    fileUrl: '#',
  },
  {
    title: 'Router Setup Guide',
    description: 'Troubleshooting and advanced settings',
    fileType: 'pdf' as const,
    fileUrl: '#',
  },
  {
    title: 'Bluetooth Speaker Pairing',
    description: 'Quick video tutorial',
    fileType: 'video' as const,
    fileUrl: '#',
  },
]

export default function InternetTVPage() {
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
              <Wifi className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Internet & TV
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Stay connected during your stay. Your apartment comes equipped with high-speed WiFi, a smart TV, and Bluetooth speakers.
            </p>
          </header>

          {/* WiFi Card - Hero */}
          <WifiCard
            networkName="WOW-Guest-K12"
            password="WelcomeHome2024"
            className="mb-8"
          />

          {/* Equipment Overview */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Available Equipment
            </h2>
            <div className="grid gap-4">
              {/* Smart TV */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Tv className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Smart TV</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    55&quot; Samsung Smart TV with Netflix, YouTube, Disney+, and more. Log in with your own accounts to access your content.
                  </p>
                  <p className="text-xs text-primary mt-2 font-medium">
                    Remember to log out before check-out
                  </p>
                </div>
              </div>

              {/* Bluetooth Speaker */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <Speaker className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Bluetooth Speaker</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Portable Bluetooth speaker for music. Connect via Bluetooth - look for &quot;WOW-Speaker&quot; in your device settings.
                  </p>
                </div>
              </div>

              {/* Streaming */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Chromecast</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cast content from your phone directly to the TV. Make sure your phone is connected to the apartment WiFi.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Connection Speed Info */}
          <InfoCard
            title="Internet Speed"
            content="Your connection provides up to 100 Mbps download and 20 Mbps upload - perfect for streaming in 4K, video calls, and working from home."
            variant="highlighted"
            className="mb-8"
          />

          {/* Manuals & Guides */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Manuals & Guides
            </h2>
            <div className="space-y-3">
              {manuals.map((manual, index) => (
                <ManualCard
                  key={index}
                  title={manual.title}
                  description={manual.description}
                  fileType={manual.fileType}
                  fileUrl={manual.fileUrl}
                />
              ))}
            </div>
          </section>

          {/* Troubleshooting */}
          <FAQAccordion
            title="Troubleshooting"
            items={troubleshootingItems}
            className="mb-8"
          />

          {/* Need Help Card */}
          <NeedHelpCard className="mt-8" />

          {/* Related Categories */}
          <RelatedCategories currentSlug="internet-tv" className="mt-8" />
        </div>
      </main>

      <Footer />
      <StickyBottomBar />
    </div>
  )
}

export const metadata = {
  title: 'Internet & TV | WOW Guide',
  description: 'WiFi password, TV guide, and entertainment options in your WOW Living apartment.',
}
