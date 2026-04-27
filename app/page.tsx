import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { WowWordmark } from '@/components/site/wow-wordmark'

export const metadata: Metadata = {
  title: 'living with a wow | WOW Living',
  description: 'WOW Living — your apartment guide.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 md:gap-12 px-6 bg-background">
      <WowWordmark
        priority
        className="h-24 w-auto max-w-[min(22rem,92vw)] object-center sm:h-28 md:h-32"
      />
      <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-wide text-foreground text-center lowercase max-w-[min(100%,42rem)] leading-tight">
        living with a wow
      </h1>
      <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/15">
        <Link href="/buildings">Choose your building</Link>
      </Button>
    </div>
  )
}
