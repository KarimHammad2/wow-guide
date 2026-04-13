import { z } from 'zod'
import type { ContentSection } from './data'
import type { GuideContent } from './admin-types'
import { isSafeHttpUrl, isSafeNavigationTarget } from './url-safety'

export const visualBlockTypeSchema = z.enum([
  'text',
  'image',
  'video',
  'list',
  'link',
  'button',
  'container',
])

export const visualBlockSchema: z.ZodType<VisualBlock> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: visualBlockTypeSchema,
    title: z.string().optional(),
    content: z.string().optional(),
    url: z.string().optional(),
    items: z.array(z.string()).optional(),
    styles: z
      .object({
        textColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        fontSize: z.number().int().min(10).max(72).optional(),
        fontFamily: z.string().optional(),
        width: z.number().int().min(120).max(1400).optional(),
        height: z.number().int().min(60).max(1200).optional(),
        rowId: z.string().optional(),
      })
      .optional(),
    children: z.array(visualBlockSchema).optional(),
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

export type VisualBlock = {
  id: string
  type: z.infer<typeof visualBlockTypeSchema>
  title?: string
  content?: string
  url?: string
  items?: string[]
  styles?: {
    textColor?: string
    backgroundColor?: string
    fontSize?: number
    fontFamily?: string
    width?: number
    height?: number
    rowId?: string
  }
  children?: VisualBlock[]
}

export type VisualGuideDocument = z.infer<typeof visualGuideDocumentSchema>

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
  return 'text'
}

export function visualFromGuideContent(content: GuideContent): VisualGuideDocument {
  const blocks: VisualBlock[] = (content.sections ?? []).map((section) => ({
    id: section.blockId ?? section.id,
    type: coerceSectionType(section),
    title: section.title,
    content: section.content,
    url:
      section.type === 'video'
        ? section.videoUrl
        : section.type === 'button'
          ? section.buttonUrl
          : section.type === 'text'
            ? section.textLinkUrl
          : section.type === 'links'
            ? section.items?.[0]?.link
            : section.mediaUrl,
    items:
      section.type === 'checklist' || section.type === 'steps' || section.type === 'list'
        ? (section.items ?? []).map((item) => item.title)
        : undefined,
    styles: {
      textColor: section.textColor,
      backgroundColor: section.backgroundColor,
      fontSize: section.fontSize,
      fontFamily: section.fontFamily,
      width: section.blockWidth,
      height: section.blockHeight,
      rowId: section.rowId,
    },
  }))
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
      return {
        id,
        blockId: id,
        type: 'image',
        title: block.title,
        content: block.content,
        mediaUrl: block.url,
        textColor: block.styles?.textColor,
        backgroundColor: block.styles?.backgroundColor,
        fontSize: block.styles?.fontSize,
        fontFamily: block.styles?.fontFamily,
        blockWidth: block.styles?.width,
        blockHeight: block.styles?.height,
        rowId: block.styles?.rowId,
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
        textColor: block.styles?.textColor,
        backgroundColor: block.styles?.backgroundColor,
        fontSize: block.styles?.fontSize,
        fontFamily: block.styles?.fontFamily,
        blockWidth: block.styles?.width,
        blockHeight: block.styles?.height,
        rowId: block.styles?.rowId,
      }
    }
    if (block.type === 'list') {
      return {
        id,
        blockId: id,
        type: 'list',
        title: block.title ?? 'List',
        items: (block.items ?? []).map((item, itemIndex) => ({
          id: `${id}-${itemIndex + 1}`,
          title: item,
        })),
        textColor: block.styles?.textColor,
        backgroundColor: block.styles?.backgroundColor,
        fontSize: block.styles?.fontSize,
        fontFamily: block.styles?.fontFamily,
        blockWidth: block.styles?.width,
        blockHeight: block.styles?.height,
        rowId: block.styles?.rowId,
      }
    }
    return {
      id,
      blockId: id,
      type: 'text',
      title: block.title ?? 'Text',
      content: block.content ?? '',
      textLinkUrl: block.url,
      textColor: block.styles?.textColor,
      backgroundColor: block.styles?.backgroundColor,
      fontSize: block.styles?.fontSize,
      fontFamily: block.styles?.fontFamily,
      blockWidth: block.styles?.width,
      blockHeight: block.styles?.height,
      rowId: block.styles?.rowId,
    }
  })
}

export function isVisualGuideDocument(value: unknown): value is VisualGuideDocument {
  return visualGuideDocumentSchema.safeParse(value).success
}

export function validateVisualDocumentUrls(document: VisualGuideDocument): string | null {
  const blocks = flattenBlocks(document.blocks)
  for (const block of blocks) {
    if (!block.url) continue
    if (block.type === 'video') {
      if (!isSafeHttpUrl(block.url)) return `Invalid video URL for block "${block.id}".`
      continue
    }
    if (!isSafeNavigationTarget(block.url)) return `Invalid URL for block "${block.id}".`
  }
  return null
}
