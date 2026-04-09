/**
 * Optional one-time import of mock buildings from `lib/data.ts` into Supabase.
 *
 * Prerequisites: apply migration `005_buildings.sql`, set in environment:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * From repo root (PowerShell):
 *   npx tsx scripts/seed-buildings-from-mock.ts
 *
 * If `.env.local` exists, simple KEY=value lines are loaded automatically.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import { buildings as seedBuildings } from '@/lib/data'
import { createDefaultGuidesForBuilding } from '@/lib/guide-seed-defaults'

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  const raw = readFileSync(p, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  const admin = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  for (const b of seedBuildings) {
    const { error: be } = await admin.from('buildings').upsert(
      {
        id: b.id,
        name: b.name,
        address: b.address,
        city: b.city,
        app_path: b.appPath,
        country: b.country,
        image_url: b.imageUrl,
        emergency_phone: b.emergencyPhone,
        support_email: b.supportEmail,
        welcome_message: b.welcomeMessage,
        google_maps_url: b.googleMapsUrl,
        quiet_hours: b.quietHours,
        good_to_know: b.goodToKnow,
      },
      { onConflict: 'id' }
    )
    if (be) throw new Error(`Building ${b.id}: ${be.message}`)

    await admin.from('building_guide_categories').delete().eq('building_id', b.id)

    const guides = createDefaultGuidesForBuilding(b.id)
    const rows = Object.entries(guides).map(([categorySlug, entry]) => ({
      building_id: b.id,
      category_slug: categorySlug,
      sort_order: entry.category.order,
      category: entry.category as unknown as Json,
      content: entry.content as unknown as Json,
    }))

    const { error: ge } = await admin.from('building_guide_categories').insert(rows)
    if (ge) throw new Error(`Guides ${b.id}: ${ge.message}`)
    console.log('Seeded', b.id)
  }

  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
