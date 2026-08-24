import { describe, expect, test } from 'vitest'
import type { GuideContent } from '../lib/admin-types'
import {
  decideOrphanPruneAction,
  GUIDE_MEDIA_ORPHAN_GRACE_MS,
  orphanGuideMediaIfUnreferenced,
  pruneExpiredGuideMediaOrphans,
  type GuideMediaAdmin,
  type GuideMediaOrphanRow,
} from '../lib/guide-media-orphans'
import type {
  GuideMediaCategoryRow,
  GuideMediaReferenceScanInput,
  GuideMediaSitePageRow,
} from '../lib/guide-media-references'
import type { VisualGuideDocument } from '../lib/visual-builder-schema'

const sharedUrl =
  'https://example.supabase.co/storage/v1/object/public/guide-media/user-1/shared-image.png'
const uniqueUrl =
  'https://example.supabase.co/storage/v1/object/public/guide-media/user-1/unique-image.png'

function visualDocWithMedia(url: string): VisualGuideDocument {
  return {
    contentVersion: 2,
    layout: 'single-column',
    blocks: [{ id: 'block-a', type: 'image', title: 'Image', mediaUrl: url }],
  }
}

function guideContentWithMedia(url: string): GuideContent {
  return {
    intro: '',
    sections: [],
    visualDocument: visualDocWithMedia(url),
  }
}

type MockAdminState = {
  orphans: Map<string, GuideMediaOrphanRow>
  removed: string[]
  categories: GuideMediaCategoryRow[]
  sitePages: GuideMediaSitePageRow[]
}

function createMockAdmin(state: MockAdminState): GuideMediaAdmin {
  return {
    from(table: string) {
      const builder: {
        _eq?: { col: string; value: string }
        _lt?: { col: string; value: string }
        _update?: Partial<GuideMediaOrphanRow>
        _delete?: boolean
        select: () => unknown
        eq: (col: string, value: string) => unknown
        lt: (col: string, value: string) => unknown
        maybeSingle: () => Promise<{ data: { path: string } | null; error: null }>
        insert: (row: GuideMediaOrphanRow) => Promise<{ error: null }>
        update: (patch: Partial<GuideMediaOrphanRow>) => unknown
        delete: () => unknown
        then: (
          resolve: (value: unknown) => void,
          reject?: (reason: unknown) => void
        ) => Promise<unknown>
      } = {
        select() {
          return builder
        },
        eq(col: string, value: string) {
          builder._eq = { col, value }
          return builder
        },
        lt(col: string, value: string) {
          builder._lt = { col, value }
          return builder
        },
        async maybeSingle() {
          if (table === 'guide_media_orphans' && builder._eq?.col === 'path') {
            const row = state.orphans.get(builder._eq.value)
            return { data: row ? { path: row.path } : null, error: null }
          }
          return { data: null, error: null }
        },
        async insert(row: GuideMediaOrphanRow) {
          state.orphans.set(row.path, {
            path: row.path,
            first_orphaned_at: row.first_orphaned_at,
            last_seen_url: row.last_seen_url ?? null,
            requested_by: row.requested_by ?? null,
            category_ref: row.category_ref ?? null,
          })
          return { error: null }
        },
        update(patch: Partial<GuideMediaOrphanRow>) {
          builder._update = patch
          return builder
        },
        delete() {
          builder._delete = true
          return builder
        },
        then(resolve, reject) {
          return Promise.resolve()
            .then(() => {
              if (builder._delete && builder._eq?.col === 'path') {
                state.orphans.delete(builder._eq.value)
                return { error: null }
              }
              if (builder._update && builder._eq?.col === 'path') {
                const prev = state.orphans.get(builder._eq.value)
                if (prev) state.orphans.set(builder._eq.value, { ...prev, ...builder._update })
                return { error: null }
              }
              if (table === 'guide_media_orphans') {
                let rows = [...state.orphans.values()]
                if (builder._lt?.col === 'first_orphaned_at') {
                  rows = rows.filter((row) => row.first_orphaned_at < builder._lt!.value)
                }
                return { data: rows, error: null }
              }
              if (table === 'building_guide_categories') {
                return { data: state.categories, error: null }
              }
              if (table === 'site_pages') {
                return { data: state.sitePages, error: null }
              }
              return { data: [], error: null }
            })
            .then(resolve, reject)
        },
      }
      return builder
    },
    storage: {
      from() {
        return {
          async remove(paths: string[]) {
            state.removed.push(...paths)
            return { error: null }
          },
        }
      },
    },
  } as unknown as GuideMediaAdmin
}

describe('decideOrphanPruneAction', () => {
  const now = new Date('2026-08-24T12:00:00.000Z')

  test('leaves orphans younger than 14 days untouched', () => {
    expect(
      decideOrphanPruneAction({
        firstOrphanedAt: new Date(now.getTime() - GUIDE_MEDIA_ORPHAN_GRACE_MS + 60_000).toISOString(),
        stillReferenced: false,
        now,
      })
    ).toBe('skip-young')
  })

  test('reclaims an expired orphan that is referenced again', () => {
    expect(
      decideOrphanPruneAction({
        firstOrphanedAt: new Date(now.getTime() - GUIDE_MEDIA_ORPHAN_GRACE_MS - 60_000).toISOString(),
        stillReferenced: true,
        now,
      })
    ).toBe('reclaim')
  })

  test('deletes storage for an expired unreferenced orphan', () => {
    expect(
      decideOrphanPruneAction({
        firstOrphanedAt: new Date(now.getTime() - GUIDE_MEDIA_ORPHAN_GRACE_MS - 60_000).toISOString(),
        stillReferenced: false,
        now,
      })
    ).toBe('delete-storage')
  })
})

describe('orphanGuideMediaIfUnreferenced', () => {
  const scan: GuideMediaReferenceScanInput = {
    categories: [
      {
        building_id: 'building-b',
        category_slug: 'cleaning',
        draft_content: visualDocWithMedia(uniqueUrl),
        content: { intro: '', sections: [] },
      },
    ],
    sitePages: [],
  }

  test('writes an orphan row and does not remove storage when the path is unused', async () => {
    const state: MockAdminState = {
      orphans: new Map(),
      removed: [],
      categories: scan.categories,
      sitePages: [],
    }
    const admin = createMockAdmin(state)

    const result = await orphanGuideMediaIfUnreferenced(admin, {
      path: 'user-1/unique-image.png',
      url: uniqueUrl,
      requestedBy: 'user-1',
      scan,
      exclude: {
        buildingId: 'building-b',
        categorySlug: 'cleaning',
        currentDocument: { contentVersion: 2, layout: 'single-column', blocks: [] },
      },
    })

    expect(result).toEqual({ deleted: true, stillReferenced: false })
    expect(state.orphans.has('user-1/unique-image.png')).toBe(true)
    expect(state.removed).toEqual([])
  })

  test('does not write an orphan when another page still references the path', async () => {
    const referencedScan: GuideMediaReferenceScanInput = {
      categories: [
        {
          building_id: 'building-a',
          category_slug: 'cleaning',
          draft_content: visualDocWithMedia(sharedUrl),
          content: guideContentWithMedia(sharedUrl),
        },
        {
          building_id: 'building-b',
          category_slug: 'cleaning',
          draft_content: visualDocWithMedia(sharedUrl),
          content: guideContentWithMedia(sharedUrl),
        },
      ],
      sitePages: [],
    }
    const state: MockAdminState = {
      orphans: new Map(),
      removed: [],
      categories: referencedScan.categories,
      sitePages: [],
    }
    const admin = createMockAdmin(state)

    const result = await orphanGuideMediaIfUnreferenced(admin, {
      path: 'user-1/shared-image.png',
      url: sharedUrl,
      scan: referencedScan,
      exclude: {
        buildingId: 'building-a',
        categorySlug: 'cleaning',
        currentDocument: { contentVersion: 2, layout: 'single-column', blocks: [] },
      },
    })

    expect(result).toEqual({ deleted: false, stillReferenced: true })
    expect(state.orphans.size).toBe(0)
    expect(state.removed).toEqual([])
  })
})

describe('pruneExpiredGuideMediaOrphans', () => {
  const now = new Date('2026-08-24T12:00:00.000Z')

  test('removes expired unreferenced orphans from storage', async () => {
    const oldAt = new Date(now.getTime() - GUIDE_MEDIA_ORPHAN_GRACE_MS - 60_000).toISOString()
    const state: MockAdminState = {
      orphans: new Map([
        [
          'user-1/unique-image.png',
          {
            path: 'user-1/unique-image.png',
            first_orphaned_at: oldAt,
            last_seen_url: uniqueUrl,
            requested_by: null,
            category_ref: null,
          },
        ],
      ]),
      removed: [],
      categories: [],
      sitePages: [],
    }

    const result = await pruneExpiredGuideMediaOrphans(createMockAdmin(state), { now })
    expect(result).toMatchObject({ scanned: 1, deleted: 1, reclaimed: 0, errors: [] })
    expect(state.removed).toEqual(['user-1/unique-image.png'])
    expect(state.orphans.has('user-1/unique-image.png')).toBe(false)
  })

  test('reclaims an expired orphan that is referenced again without deleting storage', async () => {
    const oldAt = new Date(now.getTime() - GUIDE_MEDIA_ORPHAN_GRACE_MS - 60_000).toISOString()
    const state: MockAdminState = {
      orphans: new Map([
        [
          'user-1/shared-image.png',
          {
            path: 'user-1/shared-image.png',
            first_orphaned_at: oldAt,
            last_seen_url: sharedUrl,
            requested_by: null,
            category_ref: null,
          },
        ],
      ]),
      removed: [],
      categories: [
        {
          building_id: 'building-a',
          category_slug: 'check-in',
          draft_content: visualDocWithMedia(sharedUrl),
          content: guideContentWithMedia(sharedUrl),
        },
      ],
      sitePages: [],
    }

    const result = await pruneExpiredGuideMediaOrphans(createMockAdmin(state), { now })
    expect(result).toMatchObject({ scanned: 1, deleted: 0, reclaimed: 1, errors: [] })
    expect(state.removed).toEqual([])
    expect(state.orphans.has('user-1/shared-image.png')).toBe(false)
  })

  test('does not scan orphans younger than the grace period', async () => {
    const youngAt = new Date(now.getTime() - 60_000).toISOString()
    const state: MockAdminState = {
      orphans: new Map([
        [
          'user-1/unique-image.png',
          {
            path: 'user-1/unique-image.png',
            first_orphaned_at: youngAt,
            last_seen_url: uniqueUrl,
            requested_by: null,
            category_ref: null,
          },
        ],
      ]),
      removed: [],
      categories: [],
      sitePages: [],
    }

    const result = await pruneExpiredGuideMediaOrphans(createMockAdmin(state), { now })
    expect(result).toMatchObject({ scanned: 0, deleted: 0, reclaimed: 0, errors: [] })
    expect(state.removed).toEqual([])
    expect(state.orphans.has('user-1/unique-image.png')).toBe(true)
  })
})
