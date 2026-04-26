import { describe, expect, test } from 'vitest'
import { collectBracketLinkHrefs, parseBracketLinkSegments } from '../lib/inline-markdown-links'

describe('inline-markdown-links', () => {
  test('collects hrefs from bracket link syntax', () => {
    expect(collectBracketLinkHrefs('See [a](https://a.com) and [b](/b)')).toEqual(['https://a.com', '/b'])
    expect(collectBracketLinkHrefs('no links')).toEqual([])
  })

  test('parses mixed text and links', () => {
    expect(parseBracketLinkSegments('A [b](https://b) C')).toEqual([
      { kind: 'text', text: 'A ' },
      { kind: 'link', label: 'b', href: 'https://b' },
      { kind: 'text', text: ' C' },
    ])
  })

  test('plain text is a single segment', () => {
    expect(parseBracketLinkSegments('hello')).toEqual([{ kind: 'text', text: 'hello' }])
  })
})
