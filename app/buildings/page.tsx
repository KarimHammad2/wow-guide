import { BuildingsClient } from '@/app/buildings/buildings-client'
import { listBuildings } from '@/lib/buildings-repository'
import type { Building } from '@/lib/data'

export const dynamic = 'force-dynamic'

interface BuildingsPageProps {
  searchParams: Promise<{ city?: string }>
}

export default async function BuildingsPage({ searchParams }: BuildingsPageProps) {
  let buildings: Building[] = []
  try {
    buildings = await listBuildings()
  } catch (error) {
    console.error('Failed to load buildings for /buildings:', error)
  }
  const params = await searchParams
  const initialCity = (params.city ?? '').trim()

  return <BuildingsClient buildings={buildings} initialCity={initialCity} />
}

export const metadata = {
  title: 'Select Building | WOW Guide',
  description: 'Choose your WOW Living building to access the specific apartment guide.',
}
