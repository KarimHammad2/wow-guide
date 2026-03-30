import { BuildingsClient } from '@/app/buildings/buildings-client'
import { getBuildings } from '@/lib/admin-store'
interface BuildingsPageProps {
  searchParams: Promise<{ city?: string }>
}

export default async function BuildingsPage({ searchParams }: BuildingsPageProps) {
  const buildings = getBuildings()
  const params = await searchParams
  const initialCity = (params.city ?? '').trim()

  return <BuildingsClient buildings={buildings} initialCity={initialCity} />
}

export const metadata = {
  title: 'Select Building | WOW Guide',
  description: 'Choose your WOW Living building to access the specific apartment guide.',
}
