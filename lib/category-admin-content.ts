import type { Json } from './database.types'
import type { Category, ContentSection } from './data'
import type { ContentInheritance, GuideContent } from './admin-types'
import { visualFromGuideContent } from './visual-builder-schema'

function cloneSections(sections: ContentSection[]): ContentSection[] {
  return JSON.parse(JSON.stringify(sections)) as ContentSection[]
}

export function mergeGuideContentForCategoryAdminUpdate(
  existing: GuideContent,
  input: {
    intro: string
    alert?: GuideContent['alert']
    sections: ContentSection[]
    contentInheritance?: ContentInheritance | null
  }
): GuideContent {
  const nextSections = cloneSections(input.sections)
  const nextInheritance =
    input.contentInheritance !== undefined ? input.contentInheritance : existing.contentInheritance
  const sectionsChanged = JSON.stringify(existing.sections ?? []) !== JSON.stringify(nextSections)

  const next: GuideContent = {
    ...existing,
    intro: input.intro,
    alert: input.alert,
    sections: nextSections,
    contentInheritance: nextInheritance,
  }

  if (sectionsChanged) {
    next.visualDocument = visualFromGuideContent(next)
  }

  return next
}

export function buildCategoryAdminDbUpdate(input: {
  category: Category
  content: GuideContent
  quickAccessOrder?: number | null
}): {
  sort_order: number
  category: Json
  content: Json
  updated_at: string
  quick_access_order?: number | null
} {
  return {
    sort_order: input.category.order,
    ...(input.quickAccessOrder !== undefined ? { quick_access_order: input.quickAccessOrder } : {}),
    category: input.category as unknown as Json,
    content: input.content as unknown as Json,
    updated_at: new Date().toISOString(),
  }
}
