/**
 * Scans guide content for guide-media URLs whose objects no longer exist in Supabase storage.
 *
 * Dry run (default):
 *   npx tsx --tsconfig tsconfig.json scripts/clean-stale-media-urls.ts
 *
 * Apply fixes:
 *   npx tsx --tsconfig tsconfig.json scripts/clean-stale-media-urls.ts --apply
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'
import type { ContentSection } from '@/lib/data'
import type { GuideContent } from '@/lib/admin-types'
import { GUIDE_MEDIA_BUCKET, resolveGuideMediaPath } from '@/lib/editor-media'
import { walkVisualBlocks } from '@/lib/guide-media-references'
import { isVisualGuideDocument, type VisualGuideDocument } from '@/lib/visual-builder-schema'

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

type Change = {
  source: string
  blockId?: string
  sectionId?: string
  field: string
  oldUrl: string
}

function isStaleGuideMediaUrl(url: string, validPaths: Set<string>): boolean {
  const path = resolveGuideMediaPath(url)
  if (!path) return false
  return !validPaths.has(path)
}

function cleanVisualDocument(
  doc: VisualGuideDocument,
  validPaths: Set<string>,
  source: string
): { doc: VisualGuideDocument; changes: Change[] } {
  const next = structuredClone(doc)
  const changes: Change[] = []

  walkVisualBlocks(next.blocks ?? [], (block) => {
    if (block.mediaUrl?.trim() && isStaleGuideMediaUrl(block.mediaUrl, validPaths)) {
      changes.push({ source, blockId: block.id, field: 'mediaUrl', oldUrl: block.mediaUrl.trim() })
      block.mediaUrl = undefined
    }
    if (block.sideImageUrl?.trim() && isStaleGuideMediaUrl(block.sideImageUrl, validPaths)) {
      changes.push({ source, blockId: block.id, field: 'sideImageUrl', oldUrl: block.sideImageUrl.trim() })
      block.sideImageUrl = undefined
    }
  })

  return { doc: next, changes }
}

function cleanSections(
  sections: ContentSection[],
  validPaths: Set<string>,
  source: string
): { sections: ContentSection[]; changes: Change[] } {
  const next = structuredClone(sections)
  const changes: Change[] = []

  for (const section of next) {
    const sectionId = section.blockId ?? section.id
    if (section.mediaUrl?.trim() && isStaleGuideMediaUrl(section.mediaUrl, validPaths)) {
      changes.push({ source, sectionId, field: 'mediaUrl', oldUrl: section.mediaUrl.trim() })
      section.mediaUrl = undefined
    }
    if (section.blockMediaUrl?.trim() && isStaleGuideMediaUrl(section.blockMediaUrl, validPaths)) {
      changes.push({ source, sectionId, field: 'blockMediaUrl', oldUrl: section.blockMediaUrl.trim() })
      section.blockMediaUrl = undefined
    }
    for (const item of section.items ?? []) {
      if (item.image?.trim() && isStaleGuideMediaUrl(item.image, validPaths)) {
        changes.push({ source, sectionId, field: 'items.image', oldUrl: item.image.trim() })
        item.image = undefined
      }
    }
  }

  return { sections: next, changes }
}

function cleanGuideContent(
  content: GuideContent,
  validPaths: Set<string>,
  source: string
): { content: GuideContent; changes: Change[] } {
  const next: GuideContent = structuredClone(content)
  const changes: Change[] = []

  if (next.visualDocument && isVisualGuideDocument(next.visualDocument)) {
    const cleaned = cleanVisualDocument(next.visualDocument, validPaths, `${source}.visualDocument`)
    next.visualDocument = cleaned.doc
    changes.push(...cleaned.changes)
  }

  if (Array.isArray(next.sections)) {
    const cleaned = cleanSections(next.sections, validPaths, `${source}.sections`)
    next.sections = cleaned.sections
    changes.push(...cleaned.changes)
  }

  return { content: next, changes }
}

async function listAllGuideMediaPaths(
  admin: ReturnType<typeof createClient<Database>>
): Promise<Set<string>> {
  const paths = new Set<string>()

  async function listPrefix(prefix: string) {
    let offset = 0
    while (true) {
      const { data, error } = await admin.storage.from(GUIDE_MEDIA_BUCKET).list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      })
      if (error) throw new Error(error.message)
      if (!data?.length) break

      for (const item of data) {
        const itemPath = prefix ? `${prefix}/${item.name}` : item.name
        if (item.id === null) {
          await listPrefix(itemPath)
        } else {
          paths.add(itemPath)
        }
      }

      if (data.length < 1000) break
      offset += data.length
    }
  }

  await listPrefix('')
  return paths
}

async function main() {
  const apply = process.argv.includes('--apply')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const admin = createClient<Database>(url, key)
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`)
  console.log('Listing guide-media objects...')
  const validPaths = await listAllGuideMediaPaths(admin)
  console.log(`Found ${validPaths.size} objects in ${GUIDE_MEDIA_BUCKET}`)

  const allChanges: Change[] = []
  const categoryUpdates: Array<{
    building_id: string
    category_slug: string
    draft_content: Json | null
    content: Json
  }> = []
  const sitePageUpdates: Array<{ slug: string; content: Json }> = []

  const { data: categories, error: categoriesError } = await admin
    .from('building_guide_categories')
    .select('building_id, category_slug, draft_content, content')
  if (categoriesError) throw new Error(categoriesError.message)

  for (const row of categories ?? []) {
    let draftContent = row.draft_content
    let content = row.content as unknown as GuideContent
    const rowChanges: Change[] = []
    const sourceBase = `${row.building_id}/${row.category_slug}`

    if (draftContent && isVisualGuideDocument(draftContent as unknown)) {
      const cleaned = cleanVisualDocument(draftContent as unknown as VisualGuideDocument, validPaths, `${sourceBase}.draft_content`)
      draftContent = cleaned.doc as unknown as Json
      rowChanges.push(...cleaned.changes)
    }

    if (content && typeof content === 'object') {
      const cleaned = cleanGuideContent(content, validPaths, `${sourceBase}.content`)
      content = cleaned.content
      rowChanges.push(...cleaned.changes)
    }

    if (rowChanges.length > 0) {
      allChanges.push(...rowChanges)
      categoryUpdates.push({
        building_id: row.building_id,
        category_slug: row.category_slug,
        draft_content: draftContent,
        content: content as unknown as Json,
      })
    }
  }

  const { data: sitePages, error: sitePagesError } = await admin.from('site_pages').select('slug, content')
  if (sitePagesError) throw new Error(sitePagesError.message)

  for (const row of sitePages ?? []) {
    const content = row.content as unknown as GuideContent
    if (!content || typeof content !== 'object') continue
    const cleaned = cleanGuideContent(content, validPaths, `site_page:${row.slug}`)
    if (cleaned.changes.length > 0) {
      allChanges.push(...cleaned.changes)
      sitePageUpdates.push({ slug: row.slug, content: cleaned.content as unknown as Json })
    }
  }

  if (allChanges.length === 0) {
    console.log('No stale guide-media URLs found.')
    return
  }

  console.log(`Found ${allChanges.length} stale URL(s):`)
  for (const change of allChanges) {
    const id = change.blockId ?? change.sectionId ?? '—'
    console.log(`- ${change.source} [${id}] ${change.field}: ${change.oldUrl}`)
  }

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to persist changes.')
    return
  }

  for (const update of categoryUpdates) {
    const { error } = await admin
      .from('building_guide_categories')
      .update({
        draft_content: update.draft_content,
        content: update.content,
        updated_at: new Date().toISOString(),
      })
      .eq('building_id', update.building_id)
      .eq('category_slug', update.category_slug)
    if (error) throw new Error(`Failed to update ${update.building_id}/${update.category_slug}: ${error.message}`)
    console.log(`Updated building_guide_categories ${update.building_id}/${update.category_slug}`)
  }

  for (const update of sitePageUpdates) {
    const { error } = await admin
      .from('site_pages')
      .update({ content: update.content, updated_at: new Date().toISOString() })
      .eq('slug', update.slug)
    if (error) throw new Error(`Failed to update site_page ${update.slug}: ${error.message}`)
    console.log(`Updated site_pages ${update.slug}`)
  }

  console.log('Done.')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
