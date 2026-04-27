import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'
import type { Category, ContentSection } from '@/lib/data'
import type { BuildingGuideCategory, GuideContent } from '@/lib/admin-types'
import { cloneSections, defaultQuickAccessOrderForSlug, slugify } from '@/lib/guide-seed-defaults'
import {
  isVisualGuideDocument,
  sectionsFromVisualDocument,
  type VisualGuideDocument,
  visualFromGuideContent,
} from '@/lib/visual-builder-schema'
import { normalizeInternetCategoryGuestContent } from '@/lib/guide-internet-guest-normalize'
import { assertInheritanceSaveAllowed, mergeGuideWithInheritance } from '@/lib/content-inheritance'
import type { ContentInheritance } from '@/lib/admin-types'

function parseCategory(json: Json): Category {
  const raw = json as unknown as Category
  return {
    ...raw,
    isRequired: raw.isRequired ?? false,
  }
}

function extractContentInheritance(json: unknown): ContentInheritance | null | undefined {
  if (json == null || typeof json !== 'object' || !('contentInheritance' in json)) return undefined
  const c = (json as { contentInheritance?: unknown }).contentInheritance
  if (c === undefined) return undefined
  if (c === null) return null
  if (typeof c === 'object' && c !== null && 'sourceBuildingId' in c && 'sourceCategorySlug' in c) {
    return {
      sourceBuildingId: String((c as ContentInheritance).sourceBuildingId),
      sourceCategorySlug: String((c as ContentInheritance).sourceCategorySlug),
    }
  }
  return undefined
}

function parseContent(json: Json): GuideContent {
  const raw = json as unknown as GuideContent | VisualGuideDocument
  const inheritance = extractContentInheritance(json as unknown)
  if (isVisualGuideDocument(raw)) {
    return {
      intro: raw.settings?.intro ?? '',
      sections: sectionsFromVisualDocument(raw),
      visualDocument: raw,
      contentInheritance: inheritance,
    }
  }
  const content = raw as GuideContent
  const normalizedSections = Array.isArray(content.sections) ? content.sections : []
  return {
    intro: content.intro ?? '',
    alert: content.alert,
    sections: normalizedSections,
    visualDocument: content.visualDocument ?? visualFromGuideContent({ ...content, sections: normalizedSections }),
    contentInheritance: content.contentInheritance ?? inheritance,
  }
}

/** Parse stored guide JSON (legacy shape or visual document) for reuse outside building guides. */
export function parseGuideContentJson(json: Json): GuideContent {
  return parseContent(json)
}

/** True when Supabase reports `015_quick_access_order` migration not applied yet. */
function isMissingQuickAccessColumnError(message: string): boolean {
  return (
    message.includes('quick_access_order') &&
    (message.includes('does not exist') || message.includes('schema cache'))
  )
}

export async function insertDefaultGuideCategoriesForBuilding(
  buildingId: string,
  guides: Record<string, BuildingGuideCategory>
): Promise<void> {
  const admin = createSupabaseAdmin()
  const rows = Object.entries(guides).map(([categorySlug, entry]) => ({
    building_id: buildingId,
    category_slug: categorySlug,
    sort_order: entry.category.order,
    quick_access_order: defaultQuickAccessOrderForSlug(categorySlug),
    category: entry.category as unknown as Json,
    content: entry.content as unknown as Json,
  }))

  const { error } = await admin.from('building_guide_categories').insert(rows)
  if (error) throw new Error(error.message)
}

export async function getBuildingCategories(buildingId: string): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('building_guide_categories')
    .select('category, sort_order')
    .eq('building_id', buildingId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => parseCategory(row.category))
}

/** Guide sections flagged for the building home Quick Access row (`quick_access_order` set). */
export async function getBuildingQuickAccessCategories(buildingId: string): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('building_guide_categories')
    .select('category, quick_access_order, sort_order')
    .eq('building_id', buildingId)
    .not('quick_access_order', 'is', null)
    .order('quick_access_order', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    if (isMissingQuickAccessColumnError(error.message)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[wow_guide] Apply supabase/migrations/015_quick_access_order.sql (or `npx supabase db push`) so Quick Access loads from the database.'
        )
      }
      return []
    }
    throw new Error(error.message)
  }
  return (data ?? []).map((row) => parseCategory(row.category))
}

export async function getBuildingCategoryContent(
  buildingId: string,
  categorySlug: string
): Promise<GuideContent | undefined> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('building_guide_categories')
    .select('content')
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return undefined
  const content = parseContent(data.content)
  if (categorySlug === 'internet') {
    return normalizeInternetCategoryGuestContent(content)
  }
  return content
}

export async function getBuildingGuideCategory(
  buildingId: string,
  categorySlug: string
): Promise<BuildingGuideCategory | undefined> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('building_guide_categories')
    .select('category, content')
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return undefined
  return {
    category: parseCategory(data.category),
    content: parseContent(data.content),
  }
}

async function assertBuildingExists(buildingId: string): Promise<void> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin.from('buildings').select('id').eq('id', buildingId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Building not found')
}

/** Service-role read (e.g. scripts); avoids Next.js cookie client. */
export async function getBuildingGuideCategoryAdmin(
  buildingId: string,
  categorySlug: string
): Promise<BuildingGuideCategory | undefined> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('building_guide_categories')
    .select('category, content')
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return undefined
  return {
    category: parseCategory(data.category),
    content: parseContent(data.content),
  }
}

/**
 * Merges live source + stored row. Used for the **visual editor** only so templates update without republishing.
 * **Guest** pages use the materialized `content` column (last publish) so deletions, order, and new blocks match what you published.
 */
export async function resolveInheritanceOnStored(
  _buildingId: string,
  _categorySlug: string,
  stored: GuideContent
): Promise<GuideContent> {
  if (!stored.contentInheritance) {
    return stored
  }
  const source = await getBuildingGuideCategoryAdmin(
    stored.contentInheritance.sourceBuildingId,
    stored.contentInheritance.sourceCategorySlug
  )
  const base = source?.content
  return mergeGuideWithInheritance(base, stored)
}

export async function createBuildingGuideCategory(
  buildingId: string,
  input: {
    slug: string
    title: string
    subtitle: string
    icon: string
    color: Category['color']
    isRequired?: boolean
    quickAccessOrder?: number | null
    intro: string
    alert?: GuideContent['alert']
    sections: ContentSection[]
  }
): Promise<BuildingGuideCategory> {
  await assertBuildingExists(buildingId)
  const admin = createSupabaseAdmin()
  const categorySlug = slugify(input.slug)

  const { data: dup } = await admin
    .from('building_guide_categories')
    .select('category_slug')
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
    .maybeSingle()

  if (dup) {
    throw new Error('Section slug already exists for this building')
  }

  const { data: maxRow } = await admin
    .from('building_guide_categories')
    .select('sort_order')
    .eq('building_id', buildingId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const order = (maxRow?.sort_order ?? 0) + 1
  const created: BuildingGuideCategory = {
    category: {
      id: `${buildingId}-${categorySlug}`,
      slug: categorySlug,
      title: input.title,
      subtitle: input.subtitle,
      icon: input.icon,
      color: input.color,
      order,
      isRequired: input.isRequired ?? false,
    },
    content: {
      intro: input.intro,
      alert: input.alert,
      sections: cloneSections(input.sections),
    },
  }

  const { error } = await admin.from('building_guide_categories').insert({
    building_id: buildingId,
    category_slug: categorySlug,
    sort_order: order,
    quick_access_order: input.quickAccessOrder ?? null,
    category: created.category as unknown as Json,
    content: created.content as unknown as Json,
  })

  if (error) throw new Error(error.message)
  return created
}

export async function updateBuildingGuideCategory(
  buildingId: string,
  categorySlug: string,
  input: {
    title: string
    subtitle: string
    icon: string
    color: Category['color']
    order?: number
    quickAccessOrder?: number | null
    intro: string
    alert?: GuideContent['alert']
    sections: ContentSection[]
    contentInheritance?: ContentInheritance | null
  }
): Promise<BuildingGuideCategory> {
  await assertBuildingExists(buildingId)
  const existing = await getBuildingGuideCategoryAdmin(buildingId, categorySlug)
  if (!existing) {
    throw new Error('Guide section not found')
  }

  const nextInheritance =
    input.contentInheritance !== undefined
      ? input.contentInheritance
      : (existing.content.contentInheritance as ContentInheritance | null | undefined)

  if (nextInheritance) {
    const check = await assertInheritanceSaveAllowed(
      buildingId,
      categorySlug,
      nextInheritance,
      async (b, s) => (await getBuildingGuideCategoryAdmin(b, s))?.content
    )
    if (!check.ok) {
      throw new Error(check.message)
    }
  }

  const updated: BuildingGuideCategory = {
    category: {
      ...existing.category,
      title: input.title,
      subtitle: input.subtitle,
      icon: input.icon,
      color: input.color,
      order: input.order ?? existing.category.order,
    },
    content: {
      ...existing.content,
      intro: input.intro,
      alert: input.alert,
      sections: cloneSections(input.sections),
      contentInheritance: nextInheritance,
    },
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('building_guide_categories')
    .update({
      sort_order: updated.category.order,
      ...(input.quickAccessOrder !== undefined ? { quick_access_order: input.quickAccessOrder } : {}),
      category: updated.category as unknown as Json,
      content: updated.content as unknown as Json,
      /** Published JSON is source of truth for guests; drop stale visual drafts so the editor reloads from content. */
      draft_content: null,
      is_published: true,
      updated_at: new Date().toISOString(),
    })
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)

  if (error) throw new Error(error.message)
  return updated
}

export async function deleteBuildingGuideCategory(buildingId: string, categorySlug: string): Promise<void> {
  await assertBuildingExists(buildingId)
  const existing = await getBuildingGuideCategory(buildingId, categorySlug)
  if (!existing) {
    throw new Error('Guide section not found')
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('building_guide_categories')
    .delete()
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)

  if (error) throw new Error(error.message)
}

/** Admin sections API: list category + content per row */
export async function listBuildingGuideSections(buildingId: string) {
  const supabase = await createClient()
  const withQuick = await supabase
    .from('building_guide_categories')
    .select('category, content, sort_order, quick_access_order')
    .eq('building_id', buildingId)
    .order('sort_order', { ascending: true })

  if (withQuick.error && isMissingQuickAccessColumnError(withQuick.error.message)) {
    const fallback = await supabase
      .from('building_guide_categories')
      .select('category, content, sort_order')
      .eq('building_id', buildingId)
      .order('sort_order', { ascending: true })
    if (fallback.error) throw new Error(fallback.error.message)
    return (fallback.data ?? []).map((row) => ({
      category: parseCategory(row.category),
      content: parseContent(row.content),
      quickAccessOrder: null as number | null,
    }))
  }

  if (withQuick.error) throw new Error(withQuick.error.message)
  return (withQuick.data ?? []).map((row) => {
    const category = parseCategory(row.category)
    const content = parseContent(row.content)
    return {
      category,
      content,
      quickAccessOrder: row.quick_access_order,
    }
  })
}

export interface EditorCategoryContentRecord {
  buildingId: string
  categorySlug: string
  ownerUserId: string | null
  isPublished: boolean
  /** Merged (live source + local draft or published) for the editor. */
  content: GuideContent
  /** Unmerged published JSON from the database (keeps `contentInheritance` + local snapshot). */
  contentStored: GuideContent
  draftContent: VisualGuideDocument | null
  /** Inheritance is set and the source row exists. */
  sourceInheritanceAvailable: boolean
}

export async function getEditorCategoryContent(
  buildingId: string,
  categorySlug: string
): Promise<EditorCategoryContentRecord | undefined> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('building_guide_categories')
    .select('building_id, category_slug, owner_user_id, is_published, content, draft_content')
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return undefined
  const contentStored = parseContent(data.content)
  const draftContent =
    data.draft_content && isVisualGuideDocument(data.draft_content as unknown)
      ? (data.draft_content as unknown as VisualGuideDocument)
      : null
  const localForMerge: GuideContent = draftContent
    ? {
        ...contentStored,
        intro: draftContent.settings?.intro ?? contentStored.intro,
        sections: sectionsFromVisualDocument(draftContent),
        visualDocument: draftContent,
      }
    : contentStored
  const source = contentStored.contentInheritance
    ? await getBuildingGuideCategoryAdmin(
        contentStored.contentInheritance.sourceBuildingId,
        contentStored.contentInheritance.sourceCategorySlug
      )
    : undefined
  const sourceInheritanceAvailable = Boolean(contentStored.contentInheritance && source)
  const content = mergeGuideWithInheritance(source?.content, localForMerge)
  return {
    buildingId: data.building_id,
    categorySlug: data.category_slug,
    ownerUserId: data.owner_user_id,
    isPublished: data.is_published,
    content,
    contentStored,
    draftContent,
    sourceInheritanceAvailable,
  }
}

export async function saveEditorCategoryDraft(
  buildingId: string,
  categorySlug: string,
  userId: string,
  document: VisualGuideDocument
): Promise<EditorCategoryContentRecord> {
  const admin = createSupabaseAdmin()
  const { data: existing, error: existingError } = await admin
    .from('building_guide_categories')
    .select('owner_user_id')
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)
  if (!existing) throw new Error('Category content not found.')
  if (existing.owner_user_id && existing.owner_user_id !== userId) {
    throw new Error('Forbidden')
  }

  const { error } = await admin
    .from('building_guide_categories')
    .update({
      draft_content: document as unknown as Json,
      owner_user_id: existing.owner_user_id ?? userId,
      updated_by: userId,
      updated_at: new Date().toISOString(),
      is_published: false,
    })
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
  if (error) throw new Error(error.message)

  const updated = await getEditorCategoryContent(buildingId, categorySlug)
  if (!updated) throw new Error('Category content not found.')
  return updated
}

export async function publishEditorCategoryDraft(
  buildingId: string,
  categorySlug: string,
  userId: string
): Promise<EditorCategoryContentRecord> {
  const admin = createSupabaseAdmin()
  const { data: row, error: rowError } = await admin
    .from('building_guide_categories')
    .select('owner_user_id, draft_content, content')
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
    .maybeSingle()
  if (rowError) throw new Error(rowError.message)
  if (!row) throw new Error('Category content not found.')
  if (row.owner_user_id && row.owner_user_id !== userId) {
    throw new Error('Forbidden')
  }

  let publishedContent = parseContent(row.content)
  if (row.draft_content && isVisualGuideDocument(row.draft_content as unknown)) {
    const doc = row.draft_content as unknown as VisualGuideDocument
    publishedContent = {
      ...publishedContent,
      intro: doc.settings?.intro ?? publishedContent.intro,
      sections: sectionsFromVisualDocument(doc),
      visualDocument: doc,
    }
  }

  const { error } = await admin
    .from('building_guide_categories')
    .update({
      content: publishedContent as unknown as Json,
      is_published: true,
      owner_user_id: row.owner_user_id ?? userId,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
  if (error) throw new Error(error.message)

  const updated = await getEditorCategoryContent(buildingId, categorySlug)
  if (!updated) throw new Error('Category content not found.')
  return updated
}

export async function setCategoryContentInheritance(
  buildingId: string,
  categorySlug: string,
  inheritance: ContentInheritance | null,
  userId: string
): Promise<EditorCategoryContentRecord> {
  const admin = createSupabaseAdmin()
  const { data: row, error: rowError } = await admin
    .from('building_guide_categories')
    .select('owner_user_id, content')
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
    .maybeSingle()
  if (rowError) throw new Error(rowError.message)
  if (!row) throw new Error('Category content not found.')
  if (row.owner_user_id && row.owner_user_id !== userId) {
    throw new Error('Forbidden')
  }

  const check = await assertInheritanceSaveAllowed(
    buildingId,
    categorySlug,
    inheritance,
    async (b, s) => (await getBuildingGuideCategoryAdmin(b, s))?.content
  )
  if (!check.ok) {
    throw new Error(check.message)
  }

  const current = parseContent(row.content)
  const nextContent: GuideContent = { ...current, contentInheritance: inheritance }
  const { error } = await admin
    .from('building_guide_categories')
    .update({
      content: nextContent as unknown as Json,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('building_id', buildingId)
    .eq('category_slug', categorySlug)
  if (error) throw new Error(error.message)

  const out = await getEditorCategoryContent(buildingId, categorySlug)
  if (!out) throw new Error('Category content not found.')
  return out
}
