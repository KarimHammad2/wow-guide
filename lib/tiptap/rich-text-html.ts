import { generateHTML } from '@tiptap/html'
import DOMPurify from 'isomorphic-dompurify'
import type { JSONContent } from '@tiptap/core'
import { getRichTextExtensions } from './rich-text-extensions'
import { hasSubstantiveRichTextJson } from './rich-text-json'

const purify = DOMPurify

const SAFE_HTML = {
  ALLOWED_TAGS: [
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
  ],
  ALLOWED_ATTR: [
    'href',
    'rel',
    'target',
    'class',
    'colspan',
    'rowspan',
    'scope',
    'title',
    'aria-label',
    'role',
    'data-inline-icon',
    'data-icon-kind',
    'data-icon-name',
    'data-icon-symbol',
  ],
  ALLOW_DATA_ATTR: false,
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
  const clean = purify.sanitize(html, SAFE_HTML) as string
  return clean.trim() ? clean : null
}
