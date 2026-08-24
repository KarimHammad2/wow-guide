import { describe, expect, test } from 'vitest'
import {
  buildCategoryAdminDbUpdate,
  mergeGuideContentForCategoryAdminUpdate,
} from '../lib/category-admin-content'
import type { Category } from '../lib/data'
import type { GuideContent } from '../lib/admin-types'
import type { VisualGuideDocument } from '../lib/visual-builder-schema'

const mediaUrl =
  'https://example.supabase.co/storage/v1/object/public/guide-media/user-1/check-in.png'

const visualDocument: VisualGuideDocument = {
  contentVersion: 2,
  layout: 'single-column',
  blocks: [{ id: 'hero-image', type: 'image', title: 'Entrance', mediaUrl }],
}

const existingContent: GuideContent = {
  intro: 'Welcome',
  sections: [
    {
      id: 'hero-image',
      blockId: 'hero-image',
      type: 'image',
      title: 'Entrance',
      mediaUrl,
    },
  ],
  visualDocument,
}

const category: Category = {
  id: 'am-wasser-161-check-in',
  slug: 'check-in',
  title: 'Check-in',
  subtitle: 'Arrival',
  icon: 'KeyRound',
  color: 'primary',
  order: 1,
}

describe('mergeGuideContentForCategoryAdminUpdate', () => {
  test('preserves visualDocument media on a metadata-only save', () => {
    const merged = mergeGuideContentForCategoryAdminUpdate(existingContent, {
      intro: 'Welcome back',
      sections: existingContent.sections,
    })

    expect(merged.intro).toBe('Welcome back')
    expect(merged.visualDocument).toEqual(visualDocument)
    expect(merged.visualDocument?.blocks[0]?.mediaUrl).toBe(mediaUrl)
  })

  test('rebuilds visualDocument when admin sections actually change', () => {
    const merged = mergeGuideContentForCategoryAdminUpdate(existingContent, {
      intro: existingContent.intro,
      sections: [
        {
          id: 'new-text',
          blockId: 'new-text',
          type: 'text',
          title: 'Updated',
          content: 'New copy',
        },
      ],
    })

    expect(merged.visualDocument?.blocks).toHaveLength(1)
    expect(merged.visualDocument?.blocks[0]?.id).toBe('new-text')
    expect(merged.visualDocument?.blocks[0]?.mediaUrl).toBeUndefined()
  })
})

describe('buildCategoryAdminDbUpdate', () => {
  test('does not null draft_content or force is_published', () => {
    const payload = buildCategoryAdminDbUpdate({
      category,
      content: existingContent,
    })

    expect(payload).not.toHaveProperty('draft_content')
    expect(payload).not.toHaveProperty('is_published')
    expect(payload.content).toEqual(existingContent)
  })
})
