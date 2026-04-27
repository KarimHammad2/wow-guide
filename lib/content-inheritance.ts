import { z } from 'zod'
import type { ContentInheritance, GuideContent } from './admin-types'
import {
  sectionsFromVisualDocument,
  type VisualBlock,
  type VisualGuideDocument,
  visualFromGuideContent,
} from './visual-builder-schema'

export type { ContentInheritance } from './admin-types'

export const contentInheritancePayloadSchema = z
  .object({
    sourceBuildingId: z.string().trim().min(1).max(120),
    sourceCategorySlug: z.string().trim().min(1).max(120),
  })
  .nullable()

function mergeBlockPair(baseBlock: VisualBlock, overlayBlock: VisualBlock): VisualBlock {
  const hasChildren = Boolean(
    (baseBlock.children && baseBlock.children.length > 0) ||
      (overlayBlock.children && overlayBlock.children.length > 0) ||
      baseBlock.type === 'container' ||
      overlayBlock.type === 'container'
  )
  if (hasChildren) {
    return {
      ...overlayBlock,
      children: mergeBlockLists(baseBlock.children ?? [], overlayBlock.children ?? []),
    }
  }
  return overlayBlock
}

/** Preserves base order, overlay wins on id match, appends overlay-only blocks. Merges `children` recursively. */
export function mergeBlockLists(baseBlocks: VisualBlock[], overlayBlocks: VisualBlock[]): VisualBlock[] {
  const baseIdSet = new Set(baseBlocks.map((b) => b.id))
  const overlayById = new Map(overlayBlocks.map((b) => [b.id, b]))
  const out: VisualBlock[] = []
  for (const baseBlock of baseBlocks) {
    const overlay = overlayById.get(baseBlock.id)
    if (overlay) {
      out.push(mergeBlockPair(baseBlock, overlay))
    } else {
      out.push(baseBlock)
    }
  }
  for (const overlay of overlayBlocks) {
    if (!baseIdSet.has(overlay.id)) {
      out.push(overlay)
    }
  }
  return out
}

function mergeSettings(
  base: VisualGuideDocument['settings'],
  overlay: VisualGuideDocument['settings']
): VisualGuideDocument['settings'] {
  const introOverlay = overlay?.intro
  const introOverride =
    introOverlay != null && String(introOverlay).trim().length > 0
      ? introOverlay
      : base?.intro != null && String(base.intro).trim().length > 0
        ? base.intro
        : undefined
  return {
    ...base,
    ...overlay,
    devicePreview: overlay?.devicePreview ?? base?.devicePreview,
    intro: introOverride,
  }
}

export function mergeVisualDocuments(base: VisualGuideDocument, overlay: VisualGuideDocument): VisualGuideDocument {
  return {
    contentVersion: 2,
    layout: overlay.layout ?? base.layout,
    blocks: mergeBlockLists(base.blocks ?? [], overlay.blocks ?? []),
    settings: mergeSettings(base.settings, overlay.settings),
  }
}

function guideToVisualLocal(content: GuideContent): VisualGuideDocument {
  return content.visualDocument ?? visualFromGuideContent(content)
}

/** Merge source base (live) with this row’s **unresolved** local content; preserves `contentInheritance` and `alert` from local. */
export function mergeGuideWithInheritance(
  base: GuideContent | null | undefined,
  local: GuideContent
): GuideContent {
  const inheritance = local.contentInheritance
  if (!inheritance || !base) {
    return { ...local, contentInheritance: inheritance }
  }

  const baseVisual = guideToVisualLocal(base)
  const localVisual = guideToVisualLocal(local)
  const merged = mergeVisualDocuments(baseVisual, localVisual)
  return {
    ...local,
    intro: merged.settings?.intro?.trim() ? merged.settings.intro : (local.intro ?? base.intro ?? ''),
    alert: local.alert ?? base.alert,
    sections: sectionsFromVisualDocument(merged),
    visualDocument: merged,
    contentInheritance: inheritance,
  }
}

const MAX_INHERITANCE_WALK = 64

/**
 * Rejects self-reference, missing source, or any cycle: adding (current -> source) is invalid
 * if `source` is already downstream of `current` (i.e. following source’s chain would reach `current`).
 */
export async function assertInheritanceSaveAllowed(
  buildingId: string,
  categorySlug: string,
  inheritance: ContentInheritance | null | undefined,
  getCategoryAdmin: (bid: string, slug: string) => Promise<GuideContent | undefined>
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (inheritance == null) {
    return { ok: true }
  }
  const { sourceBuildingId, sourceCategorySlug } = inheritance
  if (!sourceBuildingId?.trim() || !sourceCategorySlug?.trim()) {
    return { ok: false, message: 'Invalid inheritance: missing source building or category.' }
  }
  if (sourceBuildingId === buildingId && sourceCategorySlug === categorySlug) {
    return { ok: false, message: 'A category cannot inherit from itself.' }
  }

  let b = sourceBuildingId
  let s = sourceCategorySlug
  for (let i = 0; i < MAX_INHERITANCE_WALK; i++) {
    if (b === buildingId && s === categorySlug) {
      return { ok: false, message: 'Inheritance would create a cycle.' }
    }
    const content = await getCategoryAdmin(b, s)
    if (!content) {
      return { ok: false, message: 'Source category was not found.' }
    }
    const next = content.contentInheritance
    if (!next) {
      return { ok: true }
    }
    b = next.sourceBuildingId
    s = next.sourceCategorySlug
  }
  return { ok: false, message: 'Inheritance chain is too long or would create a cycle.' }
}
