import { z } from 'zod'
import type { ContentItem, ContentSection } from './data'
import type { GuideContent } from './admin-types'
import { collectBracketLinkHrefs } from './inline-markdown-links'
import { collectLinkHrefsFromRichTextJson, hasSubstantiveRichTextJson } from './tiptap/rich-text-json'
import { isSafeHttpUrl, isSafeNavigationTarget } from './url-safety'

export const visualBlockTypeSchema = z.enum([
  'text',
  'image',
  'video',
  'list',
  'link',
  'button',
  'container',
  'catalogBand',
])

export const visualCatalogBandRowSchema = z.object({
  title: z.string(),
  icon: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
})

/** Plain string, rich row (Tiptap JSON), or legacy titled row with optional link. */
export const visualListItemSchema = z.union([
  z.string(),
  z.object({
    title: z.string(),
    link: z.string().optional(),
    richText: z.unknown().optional(),
  }),
])

export type VisualListItem = z.infer<typeof visualListItemSchema>

export const visualBlockSchema: z.ZodType<VisualBlock> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: visualBlockTypeSchema,
    title: z.string().optional(),
    content: z.string().optional(),
    url: z.string().optional(),
    mediaUrl: z.string().optional(),
    buttonVariant: z.enum(['default', 'secondary', 'outline', 'destructive']).optional(),
    buttonColor: z.string().optional(),
    richText: z.unknown().optional(),
    items: z.array(visualListItemSchema).optional(),
    styles: z
      .object({
        textColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        fontSize: z.number().int().min(10).max(72).optional(),
        fontFamily: z.string().optional(),
        width: z.number().int().min(120).max(1400).optional(),
        height: z.number().int().min(60).max(1200).optional(),
        rowId: z.string().optional(),
        align: z.enum(['left', 'center', 'right']).optional(),
        verticalAlign: z.enum(['top', 'center', 'bottom']).optional(),
        marginTop: z.number().int().min(0).max(400).optional(),
        marginBottom: z.number().int().min(0).max(400).optional(),
      })
      .optional(),
    children: z.array(visualBlockSchema).optional(),
    catalogRows: z.array(visualCatalogBandRowSchema).optional(),
    sideImageUrl: z.string().optional(),
    sideImagePosition: z.enum(['left', 'right']).optional(),
    sideImageFit: z.enum(['auto', 'contain', 'cover']).optional(),
    mediaFit: z.enum(['auto', 'contain', 'cover']).optional(),
    imageLinkUrl: z.string().optional(),
  })
)

export const visualGuideDocumentSchema = z.object({
  contentVersion: z.literal(2),
  layout: z.enum(['single-column', 'two-column']).default('single-column'),
  blocks: z.array(visualBlockSchema),
  settings: z
    .object({
      devicePreview: z.enum(['desktop', 'tablet', 'mobile']).optional(),
      intro: z.string().optional(),
    })
    .optional(),
})

const MEDIA_IMAGE_EXTENSION_PATTERN = /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i

export function isLikelyMediaImageUrl(value: string | null | undefined): boolean {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized || normalized.startsWith('javascript:') || normalized.startsWith('data:')) return false

  let pathname = normalized
  try {
    if (/^[a-z][a-z\d+\-.]*:\/\//i.test(normalized)) {
      pathname = new URL(normalized).pathname
    }
  } catch {
    return false
  }

  return MEDIA_IMAGE_EXTENSION_PATTERN.test(pathname)
}

export type VisualBlock = {
  id: string
  type: z.infer<typeof visualBlockTypeSchema>
  title?: string
  content?: string
  url?: string
  mediaUrl?: string
  buttonVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
  buttonColor?: string
  richText?: unknown
  items?: VisualListItem[]
  styles?: {
    textColor?: string
    backgroundColor?: string
    fontSize?: number
    fontFamily?: string
    width?: number
    height?: number
    rowId?: string
    align?: 'left' | 'center' | 'right'
      verticalAlign?: 'top' | 'center' | 'bottom'
    marginTop?: number
    marginBottom?: number
  }
  children?: VisualBlock[]
  catalogRows?: Array<{ title: string; icon?: string; image?: string; description?: string }>
  /** In-block image beside main content (text / list blocks). */
  sideImageUrl?: string
  sideImagePosition?: 'left' | 'right'
  sideImageFit?: 'auto' | 'contain' | 'cover'
  mediaFit?: 'auto' | 'contain' | 'cover'
  imageLinkUrl?: string
}

export type VisualGuideDocument = z.infer<typeof visualGuideDocumentSchema>

export type VisualListEditorRow = { id: string; title: string; richText?: unknown }

/** Plain title string for legacy rows (markdown in title or row-level link). Not used when richText is set. */
export function visualListItemToStoredTitleString(item: VisualListItem | Pick<ContentItem, 'title' | 'link' | 'richText'>): string {
  if (typeof item === 'string') return item
  if ('richText' in item && item.richText && hasSubstantiveRichTextJson(item.richText)) {
    return typeof item.title === 'string' ? item.title : ''
  }
  const title = item.title
  const link = item.link?.trim()
  if (link && !/\]\([^)]+\)/.test(title)) {
    return `[${title}](${link})`
  }
  return title
}

/** Map a saved list row to a visual list entry (string or { title, richText }). */
export function contentItemToVisualListItem(item: Pick<ContentItem, 'title' | 'link' | 'richText'>): VisualListItem {
  if (item.richText && hasSubstantiveRichTextJson(item.richText)) {
    return { title: item.title, richText: item.richText }
  }
  return visualListItemToStoredTitleString(item)
}

export function visualListItemsToEditorRows(blockId: string, items: VisualListItem[] | undefined): VisualListEditorRow[] {
  return (items ?? []).map((item, index) => {
    const id = `${blockId}-item-${index}`
    if (
      typeof item === 'object' &&
      item !== null &&
      'richText' in item &&
      item.richText !== undefined &&
      item.richText !== null
    ) {
      return { id, title: typeof item.title === 'string' ? item.title : '', richText: item.richText }
    }
    return { id, title: visualListItemToStoredTitleString(item) }
  })
}

/** Whether a list row should be written to persisted guide sections (empty editor drafts are skipped). */
export function visualListItemHasPersistableContent(item: VisualListItem): boolean {
  if (typeof item === 'string') return item.trim().length > 0
  const title = typeof item.title === 'string' ? item.title.trim() : ''
  if (title.length > 0) return true
  if ('richText' in item && item.richText && hasSubstantiveRichTextJson(item.richText)) return true
  const link = 'link' in item && typeof item.link === 'string' ? item.link.trim() : ''
  return link.length > 0
}

export function visualListItemsFromEditorRows(rows: VisualListEditorRow[]): VisualListItem[] {
  return rows.map((row) => {
    const title = row.title.trim()
    if (row.richText && hasSubstantiveRichTextJson(row.richText)) {
      return { title, richText: row.richText }
    }
    if (row.richText !== undefined && row.richText !== null) {
      return { title, richText: row.richText }
    }
    if (title) return title
    return { title: '' }
  })
}

function flattenBlocks(blocks: VisualBlock[]): VisualBlock[] {
  const output: VisualBlock[] = []
  for (const block of blocks) {
    output.push(block)
    if (block.children?.length) {
      output.push(...flattenBlocks(block.children))
    }
  }
  return output
}

function coerceSectionType(section: ContentSection): VisualBlock['type'] {
  if (section.type === 'image' || section.type === 'media') return 'image'
  if (section.type === 'video') return 'video'
  if (section.type === 'links') return 'link'
  if (section.type === 'checklist' || section.type === 'steps' || section.type === 'list') return 'list'
  if (section.type === 'button') return 'button'
  if (section.type === 'catalogBand') return 'catalogBand'
  return 'text'
}

export function visualFromGuideContent(content: GuideContent): VisualGuideDocument {
  const blocks: VisualBlock[] = (content.sections ?? []).map((section) => {
    if (section.type === 'catalogBand') {
      return {
        id: section.blockId ?? section.id,
        type: 'catalogBand' as const,
        title: section.title,
        catalogRows: (section.items ?? []).map((item) => ({
          title: item.title,
          icon: item.icon,
          image: item.image,
          description: item.description,
        })),
        styles: {
          textColor: section.textColor,
          backgroundColor: section.backgroundColor,
          fontSize: section.fontSize,
          fontFamily: section.fontFamily,
          width: section.blockWidth,
          height: section.blockHeight,
          rowId: section.rowId,
          align: section.blockAlign,
          verticalAlign: section.blockVerticalAlign,
          marginTop: section.blockMarginTop,
          marginBottom: section.blockMarginBottom,
        },
      }
    }

    const isTextOrListBody =
      section.type === 'text' ||
      section.type === 'list' ||
      section.type === 'steps' ||
      section.type === 'checklist'

    return {
      id: section.blockId ?? section.id,
      type: coerceSectionType(section),
      title: section.title,
      content: section.content,
      richText: section.type === 'text' ? section.richText : undefined,
      url:
        section.type === 'video'
          ? section.videoUrl
          : section.type === 'button'
            ? section.buttonUrl
            : section.type === 'text'
              ? section.textLinkUrl
            : section.type === 'links'
              ? section.items?.[0]?.link
              : section.imageLinkUrl,
      mediaUrl:
        section.type === 'image' || section.type === 'media'
          ? section.mediaUrl ?? section.items?.[0]?.image
          : undefined,
      buttonVariant: section.type === 'button' ? section.buttonVariant : undefined,
      buttonColor: section.type === 'button' ? section.buttonColor : undefined,
      items:
        section.type === 'checklist' || section.type === 'steps' || section.type === 'list'
          ? (section.items ?? []).map((item) => contentItemToVisualListItem(item))
          : undefined,
      styles: {
        textColor: section.textColor,
        backgroundColor: section.backgroundColor,
        fontSize: section.fontSize,
        fontFamily: section.fontFamily,
        width: section.blockWidth,
        height: section.blockHeight,
        rowId: section.rowId,
        align: section.blockAlign,
        verticalAlign: section.blockVerticalAlign,
        marginTop: section.blockMarginTop,
        marginBottom: section.blockMarginBottom,
      },
      ...(isTextOrListBody
        ? {
            sideImageUrl: section.blockMediaUrl,
            sideImagePosition: section.blockMediaPosition,
            sideImageFit: section.blockMediaFit,
          }
        : {}),
      mediaFit: section.mediaFit,
      imageLinkUrl: section.imageLinkUrl,
    }
  })
  return {
    contentVersion: 2,
    layout: 'single-column',
    blocks,
    settings: {
      intro: content.intro,
    },
  }
}

export function sectionsFromVisualDocument(document: VisualGuideDocument): ContentSection[] {
  const blocks = flattenBlocks(document.blocks ?? [])
  return blocks.map((block, index) => {
    const id = block.id || `block-${index + 1}`
    if (block.type === 'image') {
      const legacyMediaUrl = block.mediaUrl ?? (isLikelyMediaImageUrl(block.url) ? block.url : undefined)
      return {
        id,
        blockId: id,
        type: 'image',
        title: block.title,
        content: block.content,
        mediaUrl: legacyMediaUrl,
        imageLinkUrl: block.imageLinkUrl,
        textColor: block.styles?.textColor,
        backgroundColor: block.styles?.backgroundColor,
        fontSize: block.styles?.fontSize,
        fontFamily: block.styles?.fontFamily,
        blockWidth: block.styles?.width,
        blockHeight: block.styles?.height,
        rowId: block.styles?.rowId,
        blockAlign: block.styles?.align,
        blockVerticalAlign: block.styles?.verticalAlign,
        blockMarginTop: block.styles?.marginTop,
        blockMarginBottom: block.styles?.marginBottom,
        mediaFit: block.mediaFit,
      }
    }
    if (block.type === 'video') {
      return {
        id,
        blockId: id,
        type: 'video',
        title: block.title,
        content: block.content,
        videoUrl: block.url,
        textColor: block.styles?.textColor,
        backgroundColor: block.styles?.backgroundColor,
        fontSize: block.styles?.fontSize,
        fontFamily: block.styles?.fontFamily,
        blockWidth: block.styles?.width,
        blockHeight: block.styles?.height,
        rowId: block.styles?.rowId,
        blockAlign: block.styles?.align,
        blockVerticalAlign: block.styles?.verticalAlign,
        blockMarginTop: block.styles?.marginTop,
        blockMarginBottom: block.styles?.marginBottom,
        mediaFit: block.mediaFit,
      }
    }
    if (block.type === 'link') {
      return {
        id,
        blockId: id,
        type: 'links',
        title: block.title ?? 'Useful links',
        items: [{ id: `${id}-1`, title: block.content ?? block.title ?? 'Open link', link: block.url }],
        textColor: block.styles?.textColor,
        backgroundColor: block.styles?.backgroundColor,
        fontSize: block.styles?.fontSize,
        fontFamily: block.styles?.fontFamily,
        blockWidth: block.styles?.width,
        blockHeight: block.styles?.height,
        rowId: block.styles?.rowId,
        blockAlign: block.styles?.align,
        blockVerticalAlign: block.styles?.verticalAlign,
        blockMarginTop: block.styles?.marginTop,
        blockMarginBottom: block.styles?.marginBottom,
      }
    }
    if (block.type === 'button') {
      return {
        id,
        blockId: id,
        type: 'button',
        title: block.title ?? 'Call to action',
        content: block.content ?? 'Open',
        buttonUrl: block.url,
        buttonVariant: block.buttonVariant,
        buttonColor: block.buttonColor,
        textColor: block.styles?.textColor,
        backgroundColor: block.styles?.backgroundColor,
        fontSize: block.styles?.fontSize,
        fontFamily: block.styles?.fontFamily,
        blockWidth: block.styles?.width,
        blockHeight: block.styles?.height,
        rowId: block.styles?.rowId,
        blockAlign: block.styles?.align,
        blockVerticalAlign: block.styles?.verticalAlign,
        blockMarginTop: block.styles?.marginTop,
        blockMarginBottom: block.styles?.marginBottom,
      }
    }
    if (block.type === 'catalogBand') {
      return {
        id,
        blockId: id,
        type: 'catalogBand',
        title: block.title,
        items: (block.catalogRows ?? []).map((row, itemIndex) => ({
          id: `${id}-row-${itemIndex + 1}`,
          title: row.title,
          icon: row.icon,
          image: row.image,
          description: row.description,
        })),
        textColor: block.styles?.textColor,
        backgroundColor: block.styles?.backgroundColor,
        fontSize: block.styles?.fontSize,
        fontFamily: block.styles?.fontFamily,
        blockWidth: block.styles?.width,
        blockHeight: block.styles?.height,
        rowId: block.styles?.rowId,
        blockAlign: block.styles?.align,
        blockMarginTop: block.styles?.marginTop,
        blockMarginBottom: block.styles?.marginBottom,
      }
    }
    if (block.type === 'list') {
      return {
        id,
        blockId: id,
        type: 'list',
        title: block.title ?? 'List',
        items: (block.items ?? [])
          .filter((item) => visualListItemHasPersistableContent(item as VisualListItem))
          .map((item, itemIndex) => {
            const rowId = `${id}-${itemIndex + 1}`
            if (
              typeof item === 'object' &&
              item !== null &&
              'richText' in item &&
              item.richText &&
              hasSubstantiveRichTextJson(item.richText)
            ) {
              return {
                id: rowId,
                title: item.title ?? '',
                richText: item.richText,
              }
            }
            return {
              id: rowId,
              title: visualListItemToStoredTitleString(item as VisualListItem),
            }
          }),
        textColor: block.styles?.textColor,
        backgroundColor: block.styles?.backgroundColor,
        fontSize: block.styles?.fontSize,
        fontFamily: block.styles?.fontFamily,
        blockWidth: block.styles?.width,
        blockHeight: block.styles?.height,
        rowId: block.styles?.rowId,
        blockAlign: block.styles?.align,
        blockVerticalAlign: block.styles?.verticalAlign,
        blockMarginTop: block.styles?.marginTop,
        blockMarginBottom: block.styles?.marginBottom,
        blockMediaUrl: block.sideImageUrl,
        blockMediaPosition: block.sideImagePosition,
        blockMediaFit: block.sideImageFit,
        mediaFit: block.mediaFit,
      }
    }
    return {
      id,
      blockId: id,
      type: 'text',
      title: block.title ?? 'Text',
      content: block.content ?? '',
      textLinkUrl: block.url,
      richText: block.richText,
      textColor: block.styles?.textColor,
      backgroundColor: block.styles?.backgroundColor,
      fontSize: block.styles?.fontSize,
      fontFamily: block.styles?.fontFamily,
      blockWidth: block.styles?.width,
      blockHeight: block.styles?.height,
      rowId: block.styles?.rowId,
      blockAlign: block.styles?.align,
      blockVerticalAlign: block.styles?.verticalAlign,
      blockMarginTop: block.styles?.marginTop,
      blockMarginBottom: block.styles?.marginBottom,
      blockMediaUrl: block.sideImageUrl,
      blockMediaPosition: block.sideImagePosition,
      blockMediaFit: block.sideImageFit,
      mediaFit: block.mediaFit,
      imageLinkUrl: block.imageLinkUrl,
    }
  })
}

export function isVisualGuideDocument(value: unknown): value is VisualGuideDocument {
  return visualGuideDocumentSchema.safeParse(value).success
}

export function validateVisualDocumentUrls(document: VisualGuideDocument): string | null {
  const blocks = flattenBlocks(document.blocks)
  for (const block of blocks) {
    if (block.type === 'text' && block.richText) {
      for (const href of collectLinkHrefsFromRichTextJson(block.richText)) {
        if (!isSafeNavigationTarget(href)) {
          return `Invalid link URL in text block "${block.id}".`
        }
      }
    }
    if (block.type === 'text' && block.sideImageUrl?.trim()) {
      if (!isSafeNavigationTarget(block.sideImageUrl.trim())) {
        return `Invalid side image URL in text block "${block.id}".`
      }
    }
    if (block.type === 'list' && block.items?.length) {
      for (const item of block.items) {
        if (typeof item === 'object' && item !== null && 'richText' in item && item.richText) {
          for (const href of collectLinkHrefsFromRichTextJson(item.richText)) {
            if (!isSafeNavigationTarget(href)) {
              return `Invalid list item link URL in block "${block.id}".`
            }
          }
        }
        const text = visualListItemToStoredTitleString(item as VisualListItem)
        for (const href of collectBracketLinkHrefs(text)) {
          if (!isSafeNavigationTarget(href)) {
            return `Invalid list item link URL in block "${block.id}".`
          }
        }
      }
    }
    if (block.type === 'list' && block.sideImageUrl?.trim()) {
      if (!isSafeNavigationTarget(block.sideImageUrl.trim())) {
        return `Invalid side image URL in list block "${block.id}".`
      }
    }
    if (block.type === 'catalogBand' && block.catalogRows?.length) {
      for (const row of block.catalogRows) {
        const img = row.image?.trim()
        if (img && !isSafeNavigationTarget(img)) {
          return `Invalid image URL in catalog band block "${block.id}".`
        }
      }
    }
    if (block.type === 'image') {
      if (block.mediaUrl?.trim() && !isSafeNavigationTarget(block.mediaUrl.trim())) {
        return `Invalid image URL for block "${block.id}".`
      }
      if (block.imageLinkUrl?.trim() && !isSafeNavigationTarget(block.imageLinkUrl.trim())) {
        return `Invalid image link URL for block "${block.id}".`
      }
      if (!block.mediaUrl?.trim() && block.url?.trim() && !isLikelyMediaImageUrl(block.url)) {
        return `Invalid legacy image URL for block "${block.id}".`
      }
      continue
    }
    if (!block.url) continue
    if (block.type === 'video') {
      if (!isSafeHttpUrl(block.url)) return `Invalid video URL for block "${block.id}".`
      continue
    }
    if (!isSafeNavigationTarget(block.url)) return `Invalid URL for block "${block.id}".`
  }
  return null
}
