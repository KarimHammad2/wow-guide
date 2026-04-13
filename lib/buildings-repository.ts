import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { Building } from '@/lib/data'
import { DEFAULT_SUPPORT_EMAIL, DEFAULT_SUPPORT_PHONE } from '@/lib/emergency-defaults'
import { createDefaultGuidesForBuilding, slugify } from '@/lib/guide-seed-defaults'
import { insertDefaultGuideCategoriesForBuilding } from '@/lib/building-guides-repository'
import { ensureDefaultCategoriesAssignedToBuilding } from '@/lib/guide-categories-repository'

type BuildingRow = Database['public']['Tables']['buildings']['Row']

export function rowToBuilding(row: BuildingRow): Building {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    appPath: row.app_path,
    country: row.country,
    imageUrl: row.image_url,
    emergencyPhone: row.emergency_phone,
    supportEmail: row.support_email,
    welcomeMessage: row.welcome_message,
    googleMapsUrl: row.google_maps_url,
    quietHours: row.quiet_hours,
    goodToKnow: row.good_to_know,
  }
}

function buildingToInsert(
  building: Building
): Database['public']['Tables']['buildings']['Insert'] {
  return {
    id: building.id,
    name: building.name,
    address: building.address,
    city: building.city,
    app_path: building.appPath,
    country: building.country,
    image_url: building.imageUrl,
    emergency_phone: building.emergencyPhone,
    support_email: building.supportEmail,
    welcome_message: building.welcomeMessage,
    google_maps_url: building.googleMapsUrl,
    quiet_hours: building.quietHours,
    good_to_know: building.goodToKnow,
  }
}

export async function listBuildings(): Promise<Building[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('buildings').select('*').order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => rowToBuilding(row as BuildingRow))
}

export async function getBuildingById(id: string): Promise<Building | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('buildings').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (data) return rowToBuilding(data as BuildingRow)

  const appPath = id.startsWith('/') ? id : `/${id}`
  const { data: byPath, error: byPathError } = await supabase
    .from('buildings')
    .select('*')
    .eq('app_path', appPath)
    .maybeSingle()
  if (byPathError) throw new Error(byPathError.message)
  if (!byPath) return null
  return rowToBuilding(byPath as BuildingRow)
}

/** All building ids (for slug collision checks). Exported so API can parallelize with other reads. */
export async function getExistingBuildingIdSet(): Promise<Set<string>> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin.from('buildings').select('id')
  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((r) => r.id))
}

function resolveAppPath(input: Omit<Building, 'id'>, id: string): string {
  const p = input.appPath.trim()
  if (/^\/[a-z0-9-]+$/i.test(p)) return p
  const legacy = p.match(/^\/building\/([a-z0-9-]+)$/i)
  if (legacy) return `/${legacy[1]}`
  return `/${id}`
}

export async function createBuilding(
  input: Omit<Building, 'id'>,
  options?: {
    support?: { phone: string; email: string }
    /** When provided (e.g. from a parallel batch), skips an extra round trip to list ids. */
    existingIds?: Set<string>
  }
): Promise<Building> {
  const admin = createSupabaseAdmin()
  const existing = options?.existingIds ?? (await getExistingBuildingIdSet())
  const baseSlug = slugify(input.name)
  let id = baseSlug
  let suffix = 2
  while (existing.has(id)) {
    id = `${baseSlug}-${suffix}`
    suffix += 1
  }

  const support = options?.support ?? {
    phone: DEFAULT_SUPPORT_PHONE,
    email: DEFAULT_SUPPORT_EMAIL,
  }

  const building: Building = {
    ...input,
    id,
    appPath: resolveAppPath(input, id),
    country: 'Switzerland',
    emergencyPhone: support.phone,
    supportEmail: support.email,
  }

  const { data, error } = await admin
    .from('buildings')
    .insert(buildingToInsert(building))
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Insert building failed')
  }

  const guides = createDefaultGuidesForBuilding(id)
  await insertDefaultGuideCategoriesForBuilding(id, guides)
  await ensureDefaultCategoriesAssignedToBuilding(id)

  return rowToBuilding(data as BuildingRow)
}

export async function updateBuilding(input: Building): Promise<Building> {
  const admin = createSupabaseAdmin()
  const row = {
    ...buildingToInsert(input),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await admin
    .from('buildings')
    .update(row)
    .eq('id', input.id)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Update building failed')
  }
  return rowToBuilding(data as BuildingRow)
}

export async function deleteBuilding(id: string): Promise<void> {
  const admin = createSupabaseAdmin()
  // Defensive cleanup: DB cascades should handle this, but explicit deletes keep behavior safe.
  const { error: assignmentError } = await admin.from('building_category_assignments').delete().eq('building_id', id)
  if (assignmentError) throw new Error(assignmentError.message)

  const { error: guideError } = await admin.from('building_guide_categories').delete().eq('building_id', id)
  if (guideError) throw new Error(guideError.message)

  const { error: buildingError } = await admin.from('buildings').delete().eq('id', id)
  if (buildingError) throw new Error(buildingError.message)
}
