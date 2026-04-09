import { BuildingsClient } from '@/app/buildings/buildings-client'
import { listBuildings } from '@/lib/buildings-repository'

export const dynamic = 'force-dynamic'

interface BuildingsPageProps {
  searchParams: Promise<{ city?: string }>
}

export default async function BuildingsPage({ searchParams }: BuildingsPageProps) {
  const buildings = await listBuildings()
  const params = await searchParams
  const initialCity = (params.city ?? '').trim()

  return <BuildingsClient buildings={buildings} initialCity={initialCity} />
}

export const metadata = {
  title: 'Select Building | WOW Guide',
  description: 'Choose your WOW Living building to access the specific apartment guide.',
}
