import { describe, expect, test } from 'vitest'
import {
  sectionsFromVisualDocument,
  validateVisualDocumentUrls,
  visualFromGuideContent,
} from '../lib/visual-builder-schema'
import { getRowTemplate, groupSectionsByRow } from '../lib/visual-row-groups'

describe('visual-builder-schema', () => {
  test('round-trips catalogBand blocks with rows and styles', () => {
    const doc = visualFromGuideContent({
      intro: '',
      sections: [
        {
          id: 'cb1',
          blockId: 'cb1',
          type: 'catalogBand',
          title: 'INTERNET & ENTERTAINMENT',
          backgroundColor: '#9b5d72',
          textColor: '#ffffff',
          items: [
            {
              id: 'r1',
              icon: 'Wifi',
              title: 'Internet copy.',
              image: '/guides/bristenweg-10/internet-qr-panels.png',
              description: 'Alt text',
            },
            { id: 'r2', icon: 'Tv', title: 'TV copy.' },
          ],
        },
      ],
    })
    expect(doc.blocks[0]?.type).toBe('catalogBand')
    expect(doc.blocks[0]?.catalogRows).toHaveLength(2)
    const back = sectionsFromVisualDocument(doc)
    expect(back[0]?.type).toBe('catalogBand')
    expect(back[0]?.title).toBe('INTERNET & ENTERTAINMENT')
    expect(back[0]?.backgroundColor).toBe('#9b5d72')
    expect(back[0]?.items?.[0]?.icon).toBe('Wifi')
    expect(back[0]?.items?.[0]?.image).toBe('/guides/bristenweg-10/internet-qr-panels.png')
    expect(back[0]?.items?.[0]?.description).toBe('Alt text')
  })

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

  test('maps list block items with legacy row link into inline title string', () => {
    const sections = sectionsFromVisualDocument({
      contentVersion: 2,
      layout: 'single-column',
      blocks: [
        {
          id: 'list-1',
          type: 'list',
          title: 'Resources',
          items: ['Plain', { title: 'Linked', link: '/docs' }],
        },
      ],
    })
    expect(sections[0]?.items?.[0]?.title).toBe('Plain')
    expect(sections[0]?.items?.[0]?.link).toBeUndefined()
    expect(sections[0]?.items?.[1]?.title).toBe('[Linked](/docs)')
    expect(sections[0]?.items?.[1]?.link).toBeUndefined()
  })

  test('preserves list item URLs as inline markdown through visual conversion', () => {
    const doc = visualFromGuideContent({
      intro: '',
      sections: [
        {
          id: 's1',
          type: 'list',
          title: 'Links',
          items: [
            { id: 'a', title: 'A' },
            { id: 'b', title: 'B', link: 'https://example.com' },
          ],
        },
      ],
    })
    expect(doc.blocks[0]?.items?.[1]).toBe('[B](https://example.com)')
    const back = sectionsFromVisualDocument(doc)
    expect(back[0]?.items?.[1]?.title).toBe('[B](https://example.com)')
  })

  test('round-trips list items with richText JSON', () => {
    const richDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            {
              type: 'text',
              text: 'world',
              marks: [{ type: 'link', attrs: { href: 'https://example.com/page' } }],
            },
          ],
        },
      ],
    }
    const doc = visualFromGuideContent({
      intro: '',
      sections: [
        {
          id: 's1',
          type: 'list',
          title: 'Rich',
          items: [{ id: 'a', title: 'Hello world', richText: richDoc }],
        },
      ],
    })
    expect(doc.blocks[0]?.items?.[0]).toEqual({ title: 'Hello world', richText: richDoc })
    const back = sectionsFromVisualDocument(doc)
    expect(back[0]?.items?.[0]?.title).toBe('Hello world')
    expect(back[0]?.items?.[0]?.richText).toEqual(richDoc)
  })

  test('derives visual document from guide content', () => {
    const document = visualFromGuideContent({
      intro: 'Intro',
      sections: [
        {
          id: 'x',
          type: 'video',
          title: 'Watch',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          rowId: 'row-1',
          blockWidth: 420,
        },
      ],
    })
    expect(document.contentVersion).toBe(2)
    expect(document.blocks[0]?.type).toBe('video')
    expect(document.blocks[0]?.styles?.rowId).toBe('row-1')
    expect(document.blocks[0]?.styles?.width).toBe(420)
  })

  test('round-trips block margins through visual conversion', () => {
    const document = visualFromGuideContent({
      intro: '',
      sections: [
        {
          id: 'm',
          type: 'text',
          title: 'M',
          content: 'Body',
          blockMarginTop: 24,
          blockMarginBottom: 48,
          blockVerticalAlign: 'center',
        },
      ],
    })
    expect(document.blocks[0]?.styles?.marginTop).toBe(24)
    expect(document.blocks[0]?.styles?.marginBottom).toBe(48)
    expect(document.blocks[0]?.styles?.verticalAlign).toBe('center')
    const back = sectionsFromVisualDocument(document)
    expect(back[0]?.blockMarginTop).toBe(24)
    expect(back[0]?.blockMarginBottom).toBe(48)
    expect(back[0]?.blockVerticalAlign).toBe('center')
  })

  test('round-trips image and side-image fit metadata', () => {
    const document = visualFromGuideContent({
      intro: '',
      sections: [
        {
          id: 'img',
          type: 'image',
          title: 'Photo',
          mediaUrl: '/media/a.jpg',
          mediaFit: 'contain',
        },
        {
          id: 'txt',
          type: 'text',
          title: 'Text',
          content: 'Body',
          blockMediaUrl: '/media/side.jpg',
          blockMediaPosition: 'right',
          blockMediaFit: 'cover',
        },
      ],
    })

    expect(document.blocks[0]?.mediaFit).toBe('contain')
    expect(document.blocks[1]?.sideImageFit).toBe('cover')

    const back = sectionsFromVisualDocument(document)
    expect(back[0]?.mediaFit).toBe('contain')
    expect(back[1]?.blockMediaFit).toBe('cover')
  })

  test('round-trips blockAlign through visual conversion', () => {
    const document = visualFromGuideContent({
      intro: '',
      sections: [
        {
          id: 't',
          type: 'text',
          title: 'T',
          content: 'Hi',
          blockWidth: 400,
          blockAlign: 'center',
        },
      ],
    })
    expect(document.blocks[0]?.styles?.align).toBe('center')
    const back = sectionsFromVisualDocument(document)
    expect(back[0]?.blockAlign).toBe('center')
    const again = visualFromGuideContent({ intro: '', sections: back as never })
    expect(again.blocks[0]?.styles?.align).toBe('center')
  })

  test('round-trips row metadata through visual conversion', () => {
    const document = visualFromGuideContent({
      intro: 'Intro',
      sections: [
        { id: 'left', type: 'text', title: 'Left', content: 'Text', rowId: 'row-1', blockWidth: 320 },
        { id: 'right', type: 'image', title: 'Right', mediaUrl: '/image.jpg', rowId: 'row-1', blockWidth: 680 },
      ],
    })

    const sections = sectionsFromVisualDocument(document)

    expect(sections[0]?.rowId).toBe('row-1')
    expect(sections[0]?.blockWidth).toBe(320)
    expect(sections[1]?.rowId).toBe('row-1')
    expect(sections[1]?.blockWidth).toBe(680)
  })

  test('groups adjacent row blocks and keeps width-aware templates', () => {
    const groups = groupSectionsByRow([
      { id: 'a', type: 'text', rowId: 'row-1', blockWidth: 300 },
      { id: 'b', type: 'image', rowId: 'row-1', blockWidth: 700 },
      { id: 'c', type: 'button' },
      { id: 'd', type: 'video', rowId: 'row-1', blockWidth: 400 },
    ])

    expect(groups).toHaveLength(3)
    expect(groups[0]?.sections).toHaveLength(2)
    expect(groups[0]?.startIndex).toBe(0)
    expect(groups[0]?.endIndex).toBe(1)
    expect(getRowTemplate(groups[0]?.sections ?? [])).toBe('minmax(0, 300fr) minmax(0, 700fr)')
  })

  test('row template honours widths when three or more blocks share a row', () => {
    const template = getRowTemplate([
      { id: 'a', type: 'text', rowId: 'row-1', blockWidth: 200 },
      { id: 'b', type: 'text', rowId: 'row-1', blockWidth: 300 },
      { id: 'c', type: 'image', rowId: 'row-1', blockWidth: 400 },
    ])
    expect(template).toBe('minmax(0, 200fr) minmax(0, 300fr) minmax(0, 400fr)')
  })

  test('rejects unsafe urls', () => {
    const error = validateVisualDocumentUrls({
      contentVersion: 2,
      layout: 'single-column',
      blocks: [{ id: 'a', type: 'button', url: 'javascript:alert(1)' }],
    })
    expect(error).toBeTruthy()
  })

  test('rejects unsafe inline list links', () => {
    const error = validateVisualDocumentUrls({
      contentVersion: 2,
      layout: 'single-column',
      blocks: [
        {
          id: 'lst',
          type: 'list',
          title: 'Bad',
          items: ['click [x](javascript:alert(1)) please'],
        },
      ],
    })
    expect(error).toBeTruthy()
  })
})
