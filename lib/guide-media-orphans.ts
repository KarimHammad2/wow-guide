import type { Json } from './database.types'
import { GUIDE_MEDIA_BUCKET } from './editor-media'
import {
  isGuideMediaPathReferenced,
  type GuideMediaCategoryRow,
  type GuideMediaReferenceExclude,
  type GuideMediaReferenceScanInput,
  type GuideMediaSitePageRow,
} from './guide-media-references'
import type { createSupabaseAdmin } from './supabase/admin'

export const GUIDE_MEDIA_ORPHAN_GRACE_DAYS = 14
export const GUIDE_MEDIA_ORPHAN_GRACE_MS = GUIDE_MEDIA_ORPHAN_GRACE_DAYS * 24 * 60 * 60 * 1000

export type GuideMediaOrphanCategoryRef = {
  buildingId?: string
  categorySlug?: string
  sitePageSlug?: string
}

export type GuideMediaOrphanRow = {
  path: string
  first_orphaned_at: string
  last_seen_url: string | null
  requested_by: string | null
  category_ref: Json | null
}

export type GuideMediaAdmin = ReturnType<typeof createSupabaseAdmin>

export function orphanGraceCutoffIso(now = new Date(), graceMs = GUIDE_MEDIA_ORPHAN_GRACE_MS): string {
  return new Date(now.getTime() - graceMs).toISOString()
}

export function isOrphanPastGracePeriod(
  firstOrphanedAt: string,
  now = new Date(),
  graceMs = GUIDE_MEDIA_ORPHAN_GRACE_MS
): boolean {
  const ts = Date.parse(firstOrphanedAt)
  if (!Number.isFinite(ts)) return false
  return now.getTime() - ts >= graceMs
}

export type OrphanPruneAction = 'skip-young' | 'reclaim' | 'delete-storage'

export function decideOrphanPruneAction(opts: {
  firstOrphanedAt: string
  stillReferenced: boolean
  now?: Date
  graceMs?: number
}): OrphanPruneAction {
  if (!isOrphanPastGracePeriod(opts.firstOrphanedAt, opts.now, opts.graceMs)) return 'skip-young'
  if (opts.stillReferenced) return 'reclaim'
  return 'delete-storage'
}

export async function loadGuideMediaReferenceScan(
  admin: GuideMediaAdmin
): Promise<{ scan: GuideMediaReferenceScanInput } | { error: string; source: 'categories' | 'site-pages' }> {
  const [{ data: categories, error: categoriesError }, { data: sitePages, error: sitePagesError }] =
    await Promise.all([
      admin.from('building_guide_categories').select('building_id, category_slug, draft_content, content'),
      admin.from('site_pages').select('slug, content'),
    ])
  if (categoriesError) return { error: categoriesError.message, source: 'categories' }
  if (sitePagesError) return { error: sitePagesError.message, source: 'site-pages' }
  return {
    scan: {
      categories: (categories ?? []) as GuideMediaCategoryRow[],
      sitePages: (sitePages ?? []) as GuideMediaSitePageRow[],
    },
  }
}

export function isMissingOrphansTableError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('guide_media_orphans') &&
    (lower.includes('does not exist') ||
      lower.includes('schema cache') ||
      lower.includes('could not find the table'))
  )
}

export async function markGuideMediaPathOrphaned(
  admin: GuideMediaAdmin,
  input: {
    path: string
    url?: string
    requestedBy?: string
    categoryRef?: GuideMediaOrphanCategoryRef
  }
): Promise<{ error: string | null }> {
  const { data: existing, error: readError } = await admin
    .from('guide_media_orphans')
    .select('path')
    .eq('path', input.path)
    .maybeSingle()
  if (readError) return { error: readError.message }

  const categoryRef = (input.categoryRef ?? null) as Json | null
  if (existing) {
    const { error } = await admin
      .from('guide_media_orphans')
      .update({
        last_seen_url: input.url ?? null,
        requested_by: input.requestedBy ?? null,
        category_ref: categoryRef,
      })
      .eq('path', input.path)
    return { error: error?.message ?? null }
  }

  const { error } = await admin.from('guide_media_orphans').insert({
    path: input.path,
    first_orphaned_at: new Date().toISOString(),
    last_seen_url: input.url ?? null,
    requested_by: input.requestedBy ?? null,
    category_ref: categoryRef,
  })
  return { error: error?.message ?? null }
}

export async function clearGuideMediaOrphan(
  admin: GuideMediaAdmin,
  path: string
): Promise<{ error: string | null }> {
  const { error } = await admin.from('guide_media_orphans').delete().eq('path', path)
  return { error: error?.message ?? null }
}

export async function orphanGuideMediaIfUnreferenced(
  admin: GuideMediaAdmin,
  input: {
    path: string
    url?: string
    requestedBy?: string
    exclude?: GuideMediaReferenceExclude
    categoryRef?: GuideMediaOrphanCategoryRef
    scan: GuideMediaReferenceScanInput
  }
): Promise<{ deleted: boolean; stillReferenced: boolean; error?: string }> {
  const stillReferenced = isGuideMediaPathReferenced(input.path, input.scan, input.exclude)
  if (stillReferenced) {
    return { deleted: false, stillReferenced: true }
  }
  const marked = await markGuideMediaPathOrphaned(admin, {
    path: input.path,
    url: input.url,
    requestedBy: input.requestedBy,
    categoryRef: input.categoryRef,
  })
  if (marked.error) return { deleted: false, stillReferenced: false, error: marked.error }
  return { deleted: true, stillReferenced: false }
}

export type PruneGuideMediaResult = {
  scanned: number
  reclaimed: number
  deleted: number
  errors: string[]
}

export async function pruneExpiredGuideMediaOrphans(
  admin: GuideMediaAdmin,
  options?: { now?: Date; graceMs?: number }
): Promise<PruneGuideMediaResult> {
  const now = options?.now ?? new Date()
  const graceMs = options?.graceMs ?? GUIDE_MEDIA_ORPHAN_GRACE_MS
  const cutoff = orphanGraceCutoffIso(now, graceMs)

  const { data: orphans, error: listError } = await admin
    .from('guide_media_orphans')
    .select('path, first_orphaned_at, last_seen_url, requested_by, category_ref')
    .lt('first_orphaned_at', cutoff)

  if (listError) {
    return { scanned: 0, reclaimed: 0, deleted: 0, errors: [listError.message] }
  }

  const loaded = await loadGuideMediaReferenceScan(admin)
  if ('error' in loaded) {
    return { scanned: orphans?.length ?? 0, reclaimed: 0, deleted: 0, errors: [loaded.error] }
  }

  const result: PruneGuideMediaResult = {
    scanned: orphans?.length ?? 0,
    reclaimed: 0,
    deleted: 0,
    errors: [],
  }

  for (const orphan of (orphans ?? []) as GuideMediaOrphanRow[]) {
    const stillReferenced = isGuideMediaPathReferenced(orphan.path, loaded.scan)
    const action = decideOrphanPruneAction({
      firstOrphanedAt: orphan.first_orphaned_at,
      stillReferenced,
      now,
      graceMs,
    })
    if (action === 'skip-young') continue
    if (action === 'reclaim') {
      const cleared = await clearGuideMediaOrphan(admin, orphan.path)
      if (cleared.error) result.errors.push(`${orphan.path}: ${cleared.error}`)
      else result.reclaimed += 1
      continue
    }

    const { error: removeError } = await admin.storage.from(GUIDE_MEDIA_BUCKET).remove([orphan.path])
    if (removeError) {
      result.errors.push(`${orphan.path}: ${removeError.message}`)
      continue
    }
    const cleared = await clearGuideMediaOrphan(admin, orphan.path)
    if (cleared.error) result.errors.push(`${orphan.path}: ${cleared.error}`)
    else result.deleted += 1
  }

  return result
}
