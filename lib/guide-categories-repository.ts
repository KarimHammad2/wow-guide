import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { Category } from '@/lib/data'
import type { GuideCategory, GuideCategoryBuildingRef } from '@/lib/admin-types'
import { DEFAULT_GUIDE_SECTIONS, slugify } from '@/lib/guide-seed-defaults'
import {
  createBuildingGuideCategory,
  deleteBuildingGuideCategory,
  getBuildingGuideCategory,
  updateBuildingGuideCategory,
} from '@/lib/building-guides-repository'

type GuideCategoryRow = Database['public']['Tables']['guide_categories']['Row']

function rowCategoryColor(row: GuideCategoryRow): Category['color'] {
  const c = row.category_color
  if (c === 'accent' || c === 'muted' || c === 'primary') return c
  return 'primary'
}

export function rowToGuideCategory(row: GuideCategoryRow): GuideCategory {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    iconName: row.icon_name,
    iconImageUrl: row.icon_image_url,
    categoryColor: rowCategoryColor(row),
  }
}

/** Value stored in `building_guide_categories.category.icon` — URL or Lucide icon name. */
export function catalogIconToCategoryIconField(
  row: Pick<GuideCategoryRow, 'icon_name' | 'icon_image_url'>
): string {
  const url = row.icon_image_url?.trim()
  if (url) return url
  return (row.icon_name ?? 'BookOpen').trim() || 'BookOpen'
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const admin = createSupabaseAdmin()
  let slug = baseSlug || 'category'
  let n = 2
  while (true) {
    const { data } = await admin.from('guide_categories').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${baseSlug || 'category'}-${n}`
    n += 1
  }
}

export async function listGuideCategories(): Promise<GuideCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('guide_categories')
    .select('*')
    .order('title', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => rowToGuideCategory(row as GuideCategoryRow))
}

/** Categories with buildings they are assigned to (admin catalog table). */
export async function listGuideCategoriesWithAssignments(): Promise<GuideCategory[]> {
  const supabase = await createClient()
  const categories = await listGuideCategories()

  const { data: links, error: le } = await supabase
    .from('building_category_assignments')
    .select('category_id, building_id')

  if (le) throw new Error(le.message)
  if (!links?.length) {
    return categories.map((c) => ({ ...c, assignedBuildings: [] }))
  }

  const { data: bRows, error: be } = await supabase.from('buildings').select('id, name, city')
  if (be) throw new Error(be.message)

  const buildingById = new Map(
    (bRows ?? []).map((b) => [
      b.id,
      { id: b.id, name: b.name, city: b.city ?? '' } satisfies GuideCategoryBuildingRef,
    ])
  )

  const byCategory = new Map<string, GuideCategoryBuildingRef[]>()
  for (const row of links) {
    const b = buildingById.get(row.building_id)
    if (!b) continue
    const list = byCategory.get(row.category_id) ?? []
    if (!list.some((x) => x.id === b.id)) {
      list.push(b)
    }
    byCategory.set(row.category_id, list)
  }

  for (const [, list] of byCategory) {
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  }

  return categories.map((c) => ({
    ...c,
    assignedBuildings: byCategory.get(c.id) ?? [],
  }))
}

export async function getGuideCategoryById(id: string): Promise<GuideCategory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('guide_categories').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return rowToGuideCategory(data as GuideCategoryRow)
}

export type BuildingCategoryAssignmentRow = GuideCategory & { sortOrder: number; isRequired: boolean }

export async function listAssignmentsForBuilding(buildingId: string): Promise<BuildingCategoryAssignmentRow[]> {
  const supabase = await createClient()
  const { data: assignments, error: ae } = await supabase
    .from('building_category_assignments')
    .select('category_id, sort_order, is_required')
    .eq('building_id', buildingId)
    .order('sort_order', { ascending: true })

  if (ae) throw new Error(ae.message)
  if (!assignments?.length) return []

  const ids = assignments.map((a) => a.category_id)
  const { data: cats, error: ce } = await supabase.from('guide_categories').select('*').in('id', ids)

  if (ce) throw new Error(ce.message)
  const byId = new Map((cats ?? []).map((c) => [c.id, c as GuideCategoryRow]))

  return assignments.map((a) => {
    const g = byId.get(a.category_id)
    if (!g) throw new Error('Missing guide_categories row for assignment')
    return {
      ...rowToGuideCategory(g),
      sortOrder: a.sort_order,
      isRequired: a.is_required ?? false,
    }
  })
}

export async function syncGuideAppearancesForCategory(categoryId: string): Promise<void> {
  const admin = createSupabaseAdmin()
  const { data: cat, error } = await admin.from('guide_categories').select('*').eq('id', categoryId).single()
  if (error || !cat) return

  const { data: assignments, error: ae } = await admin
    .from('building_category_assignments')
    .select('building_id')
    .eq('category_id', categoryId)

  if (ae) throw new Error(ae.message)

  const icon = catalogIconToCategoryIconField(cat as GuideCategoryRow)

  for (const row of assignments ?? []) {
    const existing = await getBuildingGuideCategory(row.building_id, cat.slug)
    if (!existing) continue
    await updateBuildingGuideCategory(row.building_id, cat.slug, {
      title: cat.title,
      subtitle: cat.short_description,
      icon,
      color: rowCategoryColor(cat as GuideCategoryRow),
      intro: existing.content.intro,
      alert: existing.content.alert,
      sections: existing.content.sections,
      order: existing.category.order,
    })
  }
}

export async function createGuideCategory(input: {
  title: string
  shortDescription?: string
  iconName: string | null
  iconImageUrl: string | null
  categoryColor?: Category['color']
}): Promise<GuideCategory> {
  const admin = createSupabaseAdmin()
  const base = slugify(input.title)
  const slug = await ensureUniqueSlug(base)
  const categoryColor = input.categoryColor ?? 'primary'
  const shortDescription = (input.shortDescription ?? '').trim()

  const { data, error } = await admin
    .from('guide_categories')
    .insert({
      slug,
      title: input.title.trim(),
      short_description: shortDescription,
      icon_name: input.iconName?.trim() || null,
      icon_image_url: input.iconImageUrl?.trim() || null,
      category_color: categoryColor,
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create category')
  return rowToGuideCategory(data as GuideCategoryRow)
}

export async function updateGuideCategory(
  id: string,
  input: {
    title: string
    shortDescription?: string
    iconName: string | null
    iconImageUrl: string | null
    categoryColor: Category['color']
  }
): Promise<GuideCategory> {
  const admin = createSupabaseAdmin()
  const shortDescription = (input.shortDescription ?? '').trim()
  const { data, error } = await admin
    .from('guide_categories')
    .update({
      title: input.title.trim(),
      short_description: shortDescription,
      icon_name: input.iconName?.trim() || null,
      icon_image_url: input.iconImageUrl?.trim() || null,
      category_color: input.categoryColor,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to update category')
  const row = data as GuideCategoryRow
  await syncGuideAppearancesForCategory(id)
  return rowToGuideCategory(row)
}

export async function deleteGuideCategory(id: string): Promise<void> {
  const admin = createSupabaseAdmin()
  const { data: cat, error: ce } = await admin.from('guide_categories').select('slug').eq('id', id).maybeSingle()
  if (ce) throw new Error(ce.message)
  if (!cat) return

  const { data: assignments, error: ae } = await admin
    .from('building_category_assignments')
    .select('building_id')
    .eq('category_id', id)

  if (ae) throw new Error(ae.message)

  for (const row of assignments ?? []) {
    const existing = await getBuildingGuideCategory(row.building_id, cat.slug)
    if (existing) {
      await deleteBuildingGuideCategory(row.building_id, cat.slug)
    }
  }

  const { error: de } = await admin.from('guide_categories').delete().eq('id', id)
  if (de) throw new Error(de.message)
}

export async function assignCategoryToBuilding(
  buildingId: string,
  categoryId: string,
  options?: { isRequired?: boolean }
): Promise<void> {
  const admin = createSupabaseAdmin()
  const { data: cat, error: ce } = await admin.from('guide_categories').select('*').eq('id', categoryId).single()
  if (ce || !cat) throw new Error('Category not found')

  const { data: dup } = await admin
    .from('building_category_assignments')
    .select('id')
    .eq('building_id', buildingId)
    .eq('category_id', categoryId)
    .maybeSingle()

  if (dup) return

  const existingGuide = await getBuildingGuideCategory(buildingId, cat.slug)
  if (existingGuide) {
    throw new Error('A guide section with this category slug already exists for this building.')
  }

  const { data: maxRow } = await admin
    .from('building_category_assignments')
    .select('sort_order')
    .eq('building_id', buildingId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (maxRow?.sort_order ?? 0) + 1

  await createBuildingGuideCategory(buildingId, {
    slug: cat.slug,
    title: cat.title,
    subtitle: cat.short_description,
    icon: catalogIconToCategoryIconField(cat as GuideCategoryRow),
    color: rowCategoryColor(cat as GuideCategoryRow),
    isRequired: options?.isRequired ?? false,
    intro: '',
    sections: [],
  })

  const { error: ie } = await admin.from('building_category_assignments').insert({
    building_id: buildingId,
    category_id: categoryId,
    sort_order: sortOrder,
    is_required: options?.isRequired ?? false,
  })

  if (ie) {
    await deleteBuildingGuideCategory(buildingId, cat.slug).catch(() => {})
    throw new Error(ie.message)
  }
}

export async function unassignCategoryFromBuilding(buildingId: string, categoryId: string): Promise<void> {
  const admin = createSupabaseAdmin()
  const { data: cat, error: ce } = await admin.from('guide_categories').select('slug').eq('id', categoryId).single()
  if (ce || !cat) throw new Error('Category not found')

  const existing = await getBuildingGuideCategory(buildingId, cat.slug)
  if (existing) {
    await deleteBuildingGuideCategory(buildingId, cat.slug)
  }

  const { error: de } = await admin
    .from('building_category_assignments')
    .delete()
    .eq('building_id', buildingId)
    .eq('category_id', categoryId)

  if (de) throw new Error(de.message)
}

/**
 * Ensures the standard default catalog categories exist and are assigned to a building.
 * Used during building creation so Categories admin can immediately show assignments.
 */
export async function ensureDefaultCategoriesAssignedToBuilding(buildingId: string): Promise<void> {
  const admin = createSupabaseAdmin()
  const defaultSlugs = DEFAULT_GUIDE_SECTIONS.map((section) => section.slug)

  const { data: existingCategories, error: existingError } = await admin
    .from('guide_categories')
    .select('id, slug')
    .in('slug', defaultSlugs)
  if (existingError) throw new Error(existingError.message)

  const categoryIdBySlug = new Map((existingCategories ?? []).map((row) => [row.slug, row.id]))

  for (const section of DEFAULT_GUIDE_SECTIONS) {
    if (categoryIdBySlug.has(section.slug)) continue
    const { data: created, error: createError } = await admin
      .from('guide_categories')
      .insert({
        slug: section.slug,
        title: section.title,
        short_description: section.subtitle,
        icon_name: section.icon,
        icon_image_url: null,
        category_color: section.color,
      })
      .select('id, slug')
      .single()

    if (createError) throw new Error(createError.message)
    categoryIdBySlug.set(created.slug, created.id)
  }

  const assignmentRows = DEFAULT_GUIDE_SECTIONS.map((section, index) => {
    const categoryId = categoryIdBySlug.get(section.slug)
    if (!categoryId) throw new Error(`Missing default category id for slug: ${section.slug}`)
    return {
      building_id: buildingId,
      category_id: categoryId,
      sort_order: index + 1,
      is_required: true,
    }
  })

  const { error: assignmentError } = await admin.from('building_category_assignments').upsert(assignmentRows, {
    onConflict: 'building_id,category_id',
  })
  if (assignmentError) throw new Error(assignmentError.message)
}
