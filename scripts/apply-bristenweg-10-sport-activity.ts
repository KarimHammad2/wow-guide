/**
 * Applies Bristenweg 10 Sport & Activity content (slug `sport-activity`).
 *
 * Run: npm run seed:bristenweg-sport
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createSupabaseAdmin } from '../lib/supabase/admin'
import {
  getBuildingGuideCategoryAdmin,
  updateBuildingGuideCategory,
} from '../lib/building-guides-repository'
import {
  BRISTENWEG_10_SPORT_ACTIVITY_CATEGORY_TITLE,
  BRISTENWEG_10_SPORT_ACTIVITY_INTRO,
  getBristenweg10SportActivitySections,
} from '../lib/content-seeds/bristenweg-10-sport-activity'

function loadLocalEnv(): void {
  for (const name of ['.env.local', '.env']) {
    const p = join(process.cwd(), name)
    if (!existsSync(p)) continue
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (key && process.env[key] === undefined) process.env[key] = val
    }
  }
}

async function resolveBuildingId(): Promise<string> {
  const fromEnv = process.env.BRISTENWEG_BUILDING_ID?.trim()
  if (fromEnv) return fromEnv

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('buildings')
    .select('id,name,app_path')
    .or('name.ilike.%Bristenweg%10%,app_path.eq./bristen10')

  if (error) throw new Error(error.message)
  if (!data?.length) {
    throw new Error(
      'No building matched (Bristenweg 10 or app_path /bristen10). Set BRISTENWEG_BUILDING_ID to your buildings.id.'
    )
  }
  if (data.length > 1) {
    console.warn('Multiple matches; using first:', data.map((r) => r.id).join(', '))
  }
  return data[0].id
}

async function main(): Promise<void> {
  loadLocalEnv()
  const buildingId = await resolveBuildingId()
  const existing = await getBuildingGuideCategoryAdmin(buildingId, 'sport-activity')
  if (!existing) throw new Error(`No sport-activity category for building_id=${buildingId}`)

  await updateBuildingGuideCategory(buildingId, 'sport-activity', {
    title: BRISTENWEG_10_SPORT_ACTIVITY_CATEGORY_TITLE,
    subtitle: existing.category.subtitle,
    icon: existing.category.icon,
    color: existing.category.color,
    order: existing.category.order,
    intro: BRISTENWEG_10_SPORT_ACTIVITY_INTRO,
    alert: existing.content.alert,
    sections: getBristenweg10SportActivitySections(),
  })

  console.log(`Updated sport-activity for building_id=${buildingId}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
