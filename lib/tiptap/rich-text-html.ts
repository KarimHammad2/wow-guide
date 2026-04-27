import { generateHTML } from '@tiptap/html'
import sanitizeHtml from 'sanitize-html'
import type { JSONContent } from '@tiptap/core'
import { getRichTextExtensions } from './rich-text-extensions'
import { hasSubstantiveRichTextJson } from './rich-text-json'

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  's',
  'strike',
  'a',
  'span',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
] as const

const BASE_ATTR = [
  'class',
  'title',
  'aria-label',
  'role',
  'data-inline-icon',
  'data-icon-kind',
  'data-icon-name',
  'data-icon-symbol',
] as const

const LINK_ATTR = [...BASE_ATTR, 'href', 'rel', 'target'] as const
const TABLE_CELL_ATTR = [...BASE_ATTR, 'colspan', 'rowspan', 'scope'] as const

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...ALLOWED_TAGS],
  allowedAttributes: {
    a: [...LINK_ATTR],
    p: [...BASE_ATTR],
    br: [],
    strong: [...BASE_ATTR],
    b: [...BASE_ATTR],
    em: [...BASE_ATTR],
    i: [...BASE_ATTR],
    s: [...BASE_ATTR],
    strike: [...BASE_ATTR],
    span: [...BASE_ATTR],
    ul: [...BASE_ATTR],
    ol: [...BASE_ATTR],
    li: [...BASE_ATTR],
    blockquote: [...BASE_ATTR],
    code: [...BASE_ATTR],
    pre: [...BASE_ATTR],
    table: [...BASE_ATTR],
    thead: [...BASE_ATTR],
    tbody: [...BASE_ATTR],
    tr: [...BASE_ATTR],
    th: [...TABLE_CELL_ATTR],
    td: [...TABLE_CELL_ATTR],
  },
  allowVulnerableTags: false,
}

/**
 * Renders Tiptap JSON to sanitized HTML, or `null` if the doc is empty / invalid.
 * Safe for embedding in server-rendered pages.
 */
export function richTextJsonToSafeHtml(json: unknown): string | null {
  if (json === null || json === undefined) return null
  if (typeof json !== 'object') return null
  if (!hasSubstantiveRichTextJson(json)) return null
  let html: string
  try {
    html = generateHTML(json as JSONContent, getRichTextExtensions())
  } catch {
    return null
  }
  if (!html?.trim()) return null
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS).trim()
  return clean || null
}
