import type { Building } from '@/lib/data'

export function getBuildingGoogleMapsUrl(building: Building): string {
  const direct = building.googleMapsUrl?.trim()
  if (direct) return direct
  const query = `${building.address}, ${building.city}, ${building.country}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
