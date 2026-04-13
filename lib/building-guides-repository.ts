import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'
import type { Category, ContentSection } from '@/lib/data'
import type { BuildingGuideCategory, GuideContent } from '@/lib/admin-types'
import { cloneSections, slugify } from '@/lib/guide-seed-defaults'
import {
  isVisualGuideDocument,
  sectionsFromVisualDocument,
  type VisualGuideDocument,
  visualFromGuideContent,
} from '@/lib/visual-builder-schema'

function parseCategory(json: Json): Category {
  const raw = json as unknown as Category
  return {
    ...raw,
    isRequired: raw.isRequired ?? false,
  }
}

function parseContent(json: Json): GuideContent {
  const raw = json as unknown as GuideContent | VisualGuideDocument
  if (isVisualGuideDocument(raw)) {
    return {
      intro: raw.settings?.intro ?? '',
      sections: sectionsFromVisualDocument(raw),
      visualDocument: raw,
    }
  }
  const content = raw as GuideContent
  const normalizedSections = Array.isArray(content.sections) ? content.sections : []
  return {
    intro: content.intro ?? '',
    alert: content.alert,
    sections: normalizedSections,
    visualDocument: content.visualDocument ?? visualFromGuideContent({ ...content, sections: normalizedSections }),
  }
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
  return parseContent(data.content)
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
  const supabase = await createClient()
  const { data, error } = await supabase.from('buildings').select('id').eq('id', buildingId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Building not found')
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
    intro: string
    alert?: GuideContent['alert']
    sections: ContentSection[]
  }
): Promise<BuildingGuideCategory> {
  await assertBuildingExists(buildingId)
  const existing = await getBuildingGuideCategory(buildingId, categorySlug)
  if (!existing) {
    throw new Error('Guide section not found')
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
      intro: input.intro,
      alert: input.alert,
      sections: cloneSections(input.sections),
    },
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('building_guide_categories')
    .update({
      sort_order: updated.category.order,
      category: updated.category as unknown as Json,
      content: updated.content as unknown as Json,
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
  const { data, error } = await supabase
    .from('building_guide_categories')
    .select('category, content, sort_order')
    .eq('building_id', buildingId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    category: parseCategory(row.category),
    content: parseContent(row.content),
  }))
}

export interface EditorCategoryContentRecord {
  buildingId: string
  categorySlug: string
  ownerUserId: string | null
  isPublished: boolean
  content: GuideContent
  draftContent: VisualGuideDocument | null
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
  const publishedContent = parseContent(data.content)
  const draftContent =
    data.draft_content && isVisualGuideDocument(data.draft_content as unknown)
      ? (data.draft_content as unknown as VisualGuideDocument)
      : null
  return {
    buildingId: data.building_id,
    categorySlug: data.category_slug,
    ownerUserId: data.owner_user_id,
    isPublished: data.is_published,
    content: publishedContent,
    draftContent,
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
