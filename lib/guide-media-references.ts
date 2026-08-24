import type { GuideContent } from './admin-types'
import type { ContentSection } from './data'
import { resolveGuideMediaPath } from './editor-media'
import { isVisualGuideDocument, type VisualBlock, type VisualGuideDocument } from './visual-builder-schema'

export function walkVisualBlocks(blocks: VisualBlock[], visit: (block: VisualBlock) => void) {
  for (const block of blocks) {
    visit(block)
    if (block.children?.length) walkVisualBlocks(block.children, visit)
  }
}

function addResolvedPath(paths: Set<string>, url: string | undefined) {
  const trimmed = url?.trim()
  if (!trimmed) return
  const path = resolveGuideMediaPath(trimmed)
  if (path) paths.add(path)
}

export function collectGuideMediaPathsFromVisualDocument(doc: VisualGuideDocument): Set<string> {
  const paths = new Set<string>()
  walkVisualBlocks(doc.blocks ?? [], (block) => {
    addResolvedPath(paths, block.mediaUrl)
    addResolvedPath(paths, block.sideImageUrl)
  })
  return paths
}

export function collectGuideMediaPathsFromSections(sections: ContentSection[]): Set<string> {
  const paths = new Set<string>()
  for (const section of sections) {
    addResolvedPath(paths, section.mediaUrl)
    addResolvedPath(paths, section.blockMediaUrl)
    for (const item of section.items ?? []) {
      addResolvedPath(paths, item.image)
    }
  }
  return paths
}

export function collectGuideMediaPathsFromGuideContent(content: GuideContent): Set<string> {
  const paths = new Set<string>()
  if (content.visualDocument && isVisualGuideDocument(content.visualDocument)) {
    for (const path of collectGuideMediaPathsFromVisualDocument(content.visualDocument)) {
      paths.add(path)
    }
  }
  if (Array.isArray(content.sections)) {
    for (const path of collectGuideMediaPathsFromSections(content.sections)) {
      paths.add(path)
    }
  }
  return paths
}

export type GuideMediaCategoryRow = {
  building_id: string
  category_slug: string
  draft_content: unknown
  content: unknown
}

export type GuideMediaSitePageRow = {
  slug: string
  content: unknown
}

export type GuideMediaReferenceScanInput = {
  categories: GuideMediaCategoryRow[]
  sitePages: GuideMediaSitePageRow[]
}

export type GuideMediaReferenceExclude = {
  buildingId?: string
  categorySlug?: string
  sitePageSlug?: string
  /** When excluding a category/site page draft, use this in-memory document instead of DB draft_content. */
  currentDocument?: VisualGuideDocument | null
}

export function isGuideMediaPathReferenced(
  targetPath: string,
  scan: GuideMediaReferenceScanInput,
  exclude?: GuideMediaReferenceExclude
): boolean {
  for (const row of scan.categories) {
    const isExcludedCategory =
      Boolean(exclude?.buildingId) &&
      Boolean(exclude?.categorySlug) &&
      row.building_id === exclude?.buildingId &&
      row.category_slug === exclude?.categorySlug

    if (isExcludedCategory && exclude?.currentDocument && isVisualGuideDocument(exclude.currentDocument)) {
      if (collectGuideMediaPathsFromVisualDocument(exclude.currentDocument).has(targetPath)) {
        return true
      }
    } else if (row.draft_content && isVisualGuideDocument(row.draft_content)) {
      if (collectGuideMediaPathsFromVisualDocument(row.draft_content as VisualGuideDocument).has(targetPath)) {
        return true
      }
    }

    if (row.content && typeof row.content === 'object') {
      if (collectGuideMediaPathsFromGuideContent(row.content as GuideContent).has(targetPath)) {
        return true
      }
    }
  }

  for (const row of scan.sitePages) {
    const isExcludedSitePage = Boolean(exclude?.sitePageSlug) && row.slug === exclude?.sitePageSlug

    if (isExcludedSitePage && exclude?.currentDocument && isVisualGuideDocument(exclude.currentDocument)) {
      if (collectGuideMediaPathsFromVisualDocument(exclude.currentDocument).has(targetPath)) {
        return true
      }
      continue
    }

    if (row.content && typeof row.content === 'object') {
      if (collectGuideMediaPathsFromGuideContent(row.content as GuideContent).has(targetPath)) {
        return true
      }
    }
  }

  return false
}
