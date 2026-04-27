import { z } from 'zod'
import { collectLinkHrefsFromRichTextJson } from '@/lib/tiptap/rich-text-json'
import { isSafeHttpUrl, isSafeNavigationTarget } from '@/lib/url-safety'
import type { ContentSection } from '@/lib/data'

export const contentItemSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
    link: z.string().optional(),
    items: z.array(contentItemSchema).optional(),
  })
)

export const contentSectionSchema = z.object({
  id: z.string().min(1),
  blockId: z.string().optional(),
  type: z.enum([
    'text',
    'steps',
    'alert',
    'card',
    'accordion',
    'schedule',
    'contact',
    'manual',
    'image',
    'tabs',
    'hero',
    'checklist',
    'media',
    'video',
    'links',
    'gallery',
    'list',
    'button',
  ]),
  title: z.string().optional(),
  content: z.string().optional(),
  items: z.array(contentItemSchema).optional(),
  variant: z.enum(['info', 'warning', 'success', 'danger']).optional(),
  mediaUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  buttonUrl: z.string().optional(),
  textLinkUrl: z.string().optional(),
  richText: z.unknown().optional(),
  caption: z.string().optional(),
  layout: z.enum(['default', 'split', 'full-bleed']).optional(),
  styleVariant: z.enum(['default', 'highlighted', 'minimal']).optional(),
  textColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  fontSize: z.number().int().min(10).max(72).optional(),
  fontFamily: z.string().optional(),
  blockWidth: z.number().int().min(120).max(1400).optional(),
  blockHeight: z.number().int().min(60).max(1200).optional(),
  blockAlign: z.enum(['left', 'center', 'right']).optional(),
  blockVerticalAlign: z.enum(['top', 'center', 'bottom']).optional(),
  blockMarginTop: z.number().int().min(0).max(400).optional(),
  blockMarginBottom: z.number().int().min(0).max(400).optional(),
  rowId: z.string().optional(),
})

export function firstUnsafeSectionUrl(sections: z.infer<typeof contentSectionSchema>[]): string | null {
  const stack = [...sections]
  while (stack.length > 0) {
    const section = stack.pop()
    if (!section) continue

    if (section.videoUrl && !isSafeHttpUrl(section.videoUrl)) {
      return `Invalid videoUrl for section "${section.id}".`
    }
    if (section.mediaUrl && !isSafeNavigationTarget(section.mediaUrl)) {
      return `Invalid mediaUrl for section "${section.id}".`
    }
    if (section.buttonUrl && !isSafeNavigationTarget(section.buttonUrl)) {
      return `Invalid buttonUrl for section "${section.id}".`
    }
    if (section.textLinkUrl && !isSafeNavigationTarget(section.textLinkUrl)) {
      return `Invalid textLinkUrl for section "${section.id}".`
    }
    if (section.type === 'text' && section.richText) {
      for (const href of collectLinkHrefsFromRichTextJson(section.richText)) {
        if (!isSafeNavigationTarget(href)) {
          return `Invalid link URL in text section "${section.id}".`
        }
      }
    }

    for (const item of section.items ?? []) {
      if (item.link && !isSafeNavigationTarget(item.link)) {
        return `Invalid link for item "${item.id}" in section "${section.id}".`
      }
      if (item.image && !isSafeNavigationTarget(item.image)) {
        return `Invalid image URL for item "${item.id}" in section "${section.id}".`
      }
      if (item.items?.length) {
        stack.push({
          id: section.id,
          type: section.type,
          title: section.title,
          content: section.content,
          items: item.items,
          variant: section.variant,
          mediaUrl: section.mediaUrl,
          videoUrl: section.videoUrl,
          caption: section.caption,
          layout: section.layout,
          styleVariant: section.styleVariant,
        })
      }
    }
  }

  return null
}

export function normalizeSections(sections: z.infer<typeof contentSectionSchema>[]): ContentSection[] {
  return sections.map((section, index) => ({
    ...section,
    blockId: section.blockId ?? section.id,
    title: section.title ?? `${section.type} block ${index + 1}`,
  })) as ContentSection[]
}

export const sitePageContentPayloadSchema = z.object({
  intro: z.string().optional(),
  alert: z
    .object({
      type: z.enum(['info', 'warning', 'success', 'danger']),
      message: z.string().min(1),
    })
    .optional(),
  sections: z.array(contentSectionSchema).default([]),
  /** When set, sections are derived server-side for URL validation; stored for editor round-trip. */
  visualDocument: z.unknown().optional(),
})

/** Partial content for PATCH-style updates (omit keys you do not want to change). */
export const sitePageContentUpdateSchema = z.object({
  intro: z.string().optional(),
  alert: z
    .object({
      type: z.enum(['info', 'warning', 'success', 'danger']),
      message: z.string().min(1),
    })
    .optional()
    .nullable(),
  sections: z.array(contentSectionSchema).optional(),
  visualDocument: z.unknown().optional(),
})
