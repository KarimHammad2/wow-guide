import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'living with a wow | WOW Living',
  description: 'WOW Living — your apartment guide.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 md:gap-12 px-6 bg-background">
      <div className="relative h-24 w-64 sm:h-28 sm:w-72 md:h-32 md:w-80 shrink-0">
        <Image
          src="/logo.png"
          alt="WOW Living"
          fill
          className="object-contain"
          sizes="(min-width: 768px) 320px, 256px"
          priority
        />
      </div>
      <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-wide text-foreground text-center lowercase max-w-[min(100%,42rem)] leading-tight">
        living with a wow
      </h1>
      <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/15">
        <Link href="/buildings">Choose your building</Link>
      </Button>
    </div>
  )
}
