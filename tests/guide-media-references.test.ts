import { describe, expect, test } from 'vitest'
import type { GuideContent } from '../lib/admin-types'
import {
  collectGuideMediaPathsFromGuideContent,
  collectGuideMediaPathsFromVisualDocument,
  isGuideMediaPathReferenced,
  type GuideMediaReferenceScanInput,
} from '../lib/guide-media-references'
import type { VisualGuideDocument } from '../lib/visual-builder-schema'

const sharedUrl =
  'https://example.supabase.co/storage/v1/object/public/guide-media/user-1/shared-image.png'
const uniqueUrl =
  'https://example.supabase.co/storage/v1/object/public/guide-media/user-1/unique-image.png'

function visualDocWithMedia(url: string): VisualGuideDocument {
  return {
    contentVersion: 2,
    layout: 'single-column',
    blocks: [{ id: 'block-a', type: 'image', title: 'Image', mediaUrl: url }],
  }
}

function guideContentWithMedia(url: string): GuideContent {
  return {
    intro: '',
    sections: [],
    visualDocument: visualDocWithMedia(url),
  }
}

describe('collectGuideMediaPathsFromVisualDocument', () => {
  test('collects mediaUrl and sideImageUrl paths', () => {
    const doc: VisualGuideDocument = {
      contentVersion: 2,
      layout: 'single-column',
      blocks: [
        { id: 'image', type: 'image', title: 'Image', mediaUrl: sharedUrl },
        {
          id: 'text',
          type: 'text',
          title: 'Text',
          content: '',
          sideImageUrl: uniqueUrl,
        },
      ],
    }

    expect(collectGuideMediaPathsFromVisualDocument(doc)).toEqual(
      new Set(['user-1/shared-image.png', 'user-1/unique-image.png'])
    )
  })
})

describe('collectGuideMediaPathsFromGuideContent', () => {
  test('collects paths from sections', () => {
    const content: GuideContent = {
      intro: '',
      sections: [
        {
          id: 'section-1',
          blockId: 'section-1',
          type: 'text',
          title: 'Section',
          content: '',
          blockMediaUrl: sharedUrl,
        },
      ],
    }

    expect(collectGuideMediaPathsFromGuideContent(content)).toEqual(new Set(['user-1/shared-image.png']))
  })
})

describe('isGuideMediaPathReferenced', () => {
  const scan: GuideMediaReferenceScanInput = {
    categories: [
      {
        building_id: 'building-a',
        category_slug: 'cleaning',
        draft_content: visualDocWithMedia(sharedUrl),
        content: guideContentWithMedia(sharedUrl),
      },
      {
        building_id: 'building-b',
        category_slug: 'cleaning',
        draft_content: visualDocWithMedia(uniqueUrl),
        content: guideContentWithMedia(uniqueUrl),
      },
    ],
    sitePages: [],
  }

  test('returns true when the same path is referenced in another category', () => {
    expect(
      isGuideMediaPathReferenced('user-1/shared-image.png', scan, {
        buildingId: 'building-a',
        categorySlug: 'cleaning',
        currentDocument: { contentVersion: 2, layout: 'single-column', blocks: [] },
      })
    ).toBe(true)
  })

  test('returns false when no other page references the path', () => {
    const soloScan: GuideMediaReferenceScanInput = {
      categories: [
        {
          building_id: 'building-b',
          category_slug: 'cleaning',
          draft_content: visualDocWithMedia(uniqueUrl),
          content: { intro: '', sections: [] },
        },
      ],
      sitePages: [],
    }

    expect(
      isGuideMediaPathReferenced('user-1/unique-image.png', soloScan, {
        buildingId: 'building-b',
        categorySlug: 'cleaning',
        currentDocument: { contentVersion: 2, layout: 'single-column', blocks: [] },
      })
    ).toBe(false)
  })

  test('returns true when another block on the same page still references the path', () => {
    expect(
      isGuideMediaPathReferenced('user-1/shared-image.png', scan, {
        buildingId: 'building-a',
        categorySlug: 'cleaning',
        currentDocument: {
          contentVersion: 2,
          layout: 'single-column',
          blocks: [
            { id: 'block-a', type: 'image', title: 'Image', mediaUrl: sharedUrl },
            { id: 'block-b', type: 'image', title: 'Image 2' },
          ],
        },
      })
    ).toBe(true)
  })
})
