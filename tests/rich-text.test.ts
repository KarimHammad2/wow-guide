import { describe, expect, test } from 'vitest'
import { collectLinkHrefsFromRichTextJson, hasSubstantiveRichTextJson } from '../lib/tiptap/rich-text-json'
import { richTextJsonToSafeHtml } from '../lib/tiptap/rich-text-html'
import { sectionsFromVisualDocument, validateVisualDocumentUrls, visualFromGuideContent } from '../lib/visual-builder-schema'
import { EMPTY_RICH_TEXT_DOC } from '../lib/tiptap/empty-doc'
import type { JSONContent } from '@tiptap/core'

const cellAttrs = { colspan: 1, rowspan: 1, colwidth: null }

const sampleWithTable: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              attrs: cellAttrs,
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Col A' }] }],
            },
            {
              type: 'tableHeader',
              attrs: cellAttrs,
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Col B' }] }],
            },
          ],
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              attrs: cellAttrs,
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '1' }] }],
            },
            {
              type: 'tableCell',
              attrs: cellAttrs,
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'bold', marks: [{ type: 'bold' }] }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

/** Table with empty body cells — still substantive for rendering. */
const sampleEmptyTable: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', attrs: cellAttrs, content: [{ type: 'paragraph' }] },
          ],
        },
      ],
    },
  ],
}

const sampleWithLink: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Go to ' },
        {
          type: 'text',
          text: 'site',
          marks: [{ type: 'link', attrs: { href: 'https://example.com', rel: 'noopener noreferrer', target: '_blank' } }],
        },
      ],
    },
  ],
}

const sampleWithInlineIcon: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'inlineIcon',
          attrs: {
            kind: 'lucide',
            name: 'Wifi',
            symbol: '📶',
            label: 'WiFi',
          },
        },
        { type: 'text', text: ' Fast internet' },
      ],
    },
  ],
}

const sampleBulletListOnly: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph' }] },
        { type: 'listItem', content: [{ type: 'paragraph' }] },
      ],
    },
  ],
}

const sampleWithBulletList: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'g' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'dgdg' }] }] },
      ],
    },
  ],
}

describe('rich text json helpers', () => {
  test('collects link hrefs', () => {
    expect(collectLinkHrefsFromRichTextJson(sampleWithLink)).toEqual(['https://example.com'])
  })

  test('hasSubstantiveRichTextJson', () => {
    expect(hasSubstantiveRichTextJson(EMPTY_RICH_TEXT_DOC)).toBe(false)
    expect(hasSubstantiveRichTextJson(sampleWithLink)).toBe(true)
    expect(hasSubstantiveRichTextJson(sampleWithTable)).toBe(true)
    expect(hasSubstantiveRichTextJson(sampleEmptyTable)).toBe(true)
    expect(hasSubstantiveRichTextJson(sampleWithInlineIcon)).toBe(true)
    expect(hasSubstantiveRichTextJson(sampleBulletListOnly)).toBe(true)
    expect(hasSubstantiveRichTextJson(sampleWithBulletList)).toBe(true)
  })
})

describe('richTextJsonToSafeHtml', () => {
  test('renders a safe anchor for links', () => {
    const html = richTextJsonToSafeHtml(sampleWithLink)
    expect(html).toBeTruthy()
    expect(html).toMatch(/<a /)
    expect(html).toMatch(/https:\/\/example\.com/)
    expect(html).toMatch(/target="_blank"/)
  })

  test('returns null for empty doc', () => {
    expect(richTextJsonToSafeHtml(EMPTY_RICH_TEXT_DOC)).toBeNull()
  })

  test('renders sanitized table and bold cell', () => {
    const html = richTextJsonToSafeHtml(sampleWithTable)
    expect(html).toBeTruthy()
    expect(html).toMatch(/<table/i)
    expect(html).toMatch(/<tr/i)
    expect(html).toMatch(/Col A/)
    expect(html).toMatch(/<strong>bold<\/strong>|<b>bold<\/b>/)
    expect(html).not.toMatch(/<script/i)
  })

  test('renders empty table skeleton', () => {
    const html = richTextJsonToSafeHtml(sampleEmptyTable)
    expect(html).toBeTruthy()
    expect(html).toMatch(/<table/i)
  })

  test('renders inline icons as safe spans', () => {
    const html = richTextJsonToSafeHtml(sampleWithInlineIcon)
    expect(html).toBeTruthy()
    expect(html).toMatch(/<span/i)
    expect(html).toMatch(/inline-icon/)
    expect(html).toMatch(/📶/)
  })

  test('renders ul/li for bullet lists', () => {
    const html = richTextJsonToSafeHtml(sampleWithBulletList)
    expect(html).toBeTruthy()
    expect(html).toMatch(/<ul/i)
    expect(html).toMatch(/<li/i)
    expect(html).toMatch(/g/)
    expect(html).toMatch(/dgdg/)
  })
})

describe('visual document richText', () => {
  test('round-trips richText on text blocks', () => {
    const sections = sectionsFromVisualDocument({
      contentVersion: 2,
      layout: 'single-column',
      blocks: [
        {
          id: 't1',
          type: 'text',
          title: 'T',
          content: 'plain',
          richText: sampleWithLink,
        },
      ],
    })
    expect(sections[0]?.type).toBe('text')
    expect(sections[0]?.richText).toEqual(sampleWithLink)

    const back = visualFromGuideContent({ intro: '', sections: sections as never })
    expect(back.blocks[0]?.richText).toEqual(sampleWithLink)
  })

  test('validateVisualDocumentUrls rejects bad link in richText', () => {
    const bad: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    }
    const err = validateVisualDocumentUrls({
      contentVersion: 2,
      layout: 'single-column',
      blocks: [{ id: 'a', type: 'text', content: '', richText: bad }],
    })
    expect(err).toMatch(/Invalid link URL/)
  })

  test('round-trips richText with table on text blocks', () => {
    const sections = sectionsFromVisualDocument({
      contentVersion: 2,
      layout: 'single-column',
      blocks: [{ id: 't1', type: 'text', title: 'T', content: '', richText: sampleWithTable }],
    })
    expect(sections[0]?.richText).toEqual(sampleWithTable)
    const back = visualFromGuideContent({ intro: '', sections: sections as never })
    expect(back.blocks[0]?.richText).toEqual(sampleWithTable)
  })

  test('round-trips richText with inline icons on text blocks', () => {
    const sections = sectionsFromVisualDocument({
      contentVersion: 2,
      layout: 'single-column',
      blocks: [{ id: 't2', type: 'text', title: 'T', content: '', richText: sampleWithInlineIcon }],
    })
    expect(sections[0]?.richText).toEqual(sampleWithInlineIcon)
    const back = visualFromGuideContent({ intro: '', sections: sections as never })
    expect(back.blocks[0]?.richText).toEqual(sampleWithInlineIcon)
  })
})
