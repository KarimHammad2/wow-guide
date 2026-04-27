import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'
import type { GuideContent } from '@/lib/admin-types'
import { cloneSections } from '@/lib/guide-seed-defaults'
import { parseGuideContentJson } from '@/lib/building-guides-repository'
import { isVisualGuideDocument } from '@/lib/visual-builder-schema'
import type { ContentSection } from '@/lib/data'

export interface SitePageRecord {
  slug: string
  title: string
  content: GuideContent
  created_at: string
  updated_at: string
}

export interface SitePageListItem {
  slug: string
  title: string
  updated_at: string
}

function rowToRecord(row: { slug: string; title: string; content: Json; created_at: string; updated_at: string }): SitePageRecord {
  return {
    slug: row.slug,
    title: row.title,
    content: parseGuideContentJson(row.content),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getSitePageBySlug(slug: string): Promise<SitePageRecord | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('site_pages').select('*').eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return rowToRecord(data as SitePageRecord & { content: Json })
}

export async function listSitePagesAdmin(): Promise<SitePageListItem[]> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('site_pages')
    .select('slug, title, updated_at')
    .order('title', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as SitePageListItem[]
}

export async function getSitePageAdmin(slug: string): Promise<SitePageRecord | null> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin.from('site_pages').select('*').eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return rowToRecord(data as SitePageRecord & { content: Json })
}

function guideContentToStoredJson(input: {
  intro: string
  alert?: GuideContent['alert'] | null
  sections: ContentSection[]
  visualDocument?: unknown | null
}): Json {
  const o: Record<string, unknown> = {
    intro: input.intro,
    sections: cloneSections(input.sections),
  }
  if (input.alert) {
    o.alert = input.alert
  }
  if (input.visualDocument !== undefined && input.visualDocument !== null && isVisualGuideDocument(input.visualDocument)) {
    o.visualDocument = input.visualDocument
  }
  return o as Json
}

export async function insertSitePage(input: {
  slug: string
  title: string
  intro?: string
  alert?: GuideContent['alert']
  sections?: ContentSection[]
  visualDocument?: unknown | null
}): Promise<SitePageRecord> {
  const admin = createSupabaseAdmin()
  const content = guideContentToStoredJson({
    intro: input.intro ?? '',
    alert: input.alert,
    sections: input.sections ?? [],
    visualDocument: input.visualDocument,
  })
  const { data, error } = await admin
    .from('site_pages')
    .insert({ slug: input.slug, title: input.title, content })
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Insert site page failed')
  return rowToRecord(data as SitePageRecord & { content: Json })
}

export async function updateSitePage(
  slug: string,
  input: {
    newSlug?: string
    title?: string
    intro?: string
    alert?: GuideContent['alert'] | null
    sections?: ContentSection[]
    visualDocument?: unknown | null
  }
): Promise<SitePageRecord> {
  const admin = createSupabaseAdmin()
  const existing = await getSitePageAdmin(slug)
  if (!existing) {
    throw new Error('Site page not found')
  }
  const nextSlug = input.newSlug !== undefined ? input.newSlug : slug
  const nextIntro = input.intro !== undefined ? input.intro : existing.content.intro
  const nextAlert = input.alert !== undefined ? input.alert : existing.content.alert
  const nextSections = input.sections !== undefined ? input.sections : existing.content.sections
  const nextVisual =
    input.visualDocument !== undefined ? input.visualDocument : existing.content.visualDocument
  const content = guideContentToStoredJson({
    intro: nextIntro,
    alert: nextAlert,
    sections: nextSections,
    visualDocument: nextVisual,
  })
  const patch: { slug?: string; title?: string; content: Json } = { content }
  if (input.title !== undefined) patch.title = input.title
  if (nextSlug !== slug) patch.slug = nextSlug
  const { data, error } = await admin.from('site_pages').update(patch).eq('slug', slug).select('*').single()
  if (error || !data) throw new Error(error?.message ?? 'Update site page failed')
  return rowToRecord(data as SitePageRecord & { content: Json })
}

export async function deleteSitePage(slug: string): Promise<void> {
  const admin = createSupabaseAdmin()
  const { error } = await admin.from('site_pages').delete().eq('slug', slug)
  if (error) throw new Error(error.message)
}
