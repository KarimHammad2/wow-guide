import { isVisualGuideDocument, sectionsFromVisualDocument } from '@/lib/visual-builder-schema'
import { normalizeSections } from '@/lib/admin-content-sections-validation'
import type { ContentSection } from '@/lib/data'

/** Prefer visual document for validation when present and valid. */
export function sitePagePayloadSectionsForValidation(input: {
  sections?: ContentSection[]
  visualDocument?: unknown
}): ContentSection[] {
  if (input.visualDocument !== undefined && isVisualGuideDocument(input.visualDocument)) {
    const derived = sectionsFromVisualDocument(input.visualDocument)
    return normalizeSections(derived as Parameters<typeof normalizeSections>[0])
  }
  return normalizeSections((input.sections ?? []) as Parameters<typeof normalizeSections>[0])
}
