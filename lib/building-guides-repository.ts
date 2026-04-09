import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'
import type { Category, ContentSection } from '@/lib/data'
import type { BuildingGuideCategory, GuideContent } from '@/lib/admin-types'
import { cloneSections, slugify } from '@/lib/guide-seed-defaults'

function parseCategory(json: Json): Category {
  return json as unknown as Category
}

function parseContent(json: Json): GuideContent {
  return json as unknown as GuideContent
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
