import Image from 'next/image'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { GUEST_BUILDING_COOKIE } from '@/lib/guest-building-cookie'
import { getBuildingById } from '@/lib/admin-store'

export const metadata: Metadata = {
  title: 'living with a wow | WOW Living',
  description: 'WOW Living — your apartment guide.',
}

interface HomePageProps {
  searchParams: Promise<{ splash?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const forceSplash =
    params.splash === '1' || params.splash === 'true' || params.splash === 'yes'

  const cookieStore = await cookies()
  const slug = cookieStore.get(GUEST_BUILDING_COOKIE)?.value

  if (!forceSplash && slug) {
    const building = getBuildingById(slug)
    if (building) {
      redirect(`/building/${slug}`)
    }
    cookieStore.delete(GUEST_BUILDING_COOKIE)
  }

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
    </div>
  )
}
