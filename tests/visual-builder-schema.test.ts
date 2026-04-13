import { describe, expect, test } from 'vitest'
import {
  sectionsFromVisualDocument,
  validateVisualDocumentUrls,
  visualFromGuideContent,
} from '../lib/visual-builder-schema'

describe('visual-builder-schema', () => {
  test('maps visual document blocks to legacy sections', () => {
    const sections = sectionsFromVisualDocument({
      contentVersion: 2,
      layout: 'single-column',
      blocks: [
        { id: 'a', type: 'text', title: 'Intro', content: 'Hello world' },
        { id: 'b', type: 'button', title: 'CTA', content: 'Open', url: '/docs' },
        { id: 'c', type: 'list', title: 'Checklist', items: ['One', 'Two'] },
      ],
    })
    expect(sections).toHaveLength(3)
    expect(sections[1]?.type).toBe('button')
    expect(sections[2]?.items?.[0]?.title).toBe('One')
  })

  test('derives visual document from guide content', () => {
    const document = visualFromGuideContent({
      intro: 'Intro',
      sections: [
        { id: 'x', type: 'video', title: 'Watch', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      ],
    })
    expect(document.contentVersion).toBe(2)
    expect(document.blocks[0]?.type).toBe('video')
  })

  test('rejects unsafe urls', () => {
    const error = validateVisualDocumentUrls({
      contentVersion: 2,
      layout: 'single-column',
      blocks: [{ id: 'a', type: 'button', url: 'javascript:alert(1)' }],
    })
    expect(error).toBeTruthy()
  })
})
