import type { JSONContent } from '@tiptap/core'

/** Minimal valid empty Tiptap document (single empty paragraph). */
export const EMPTY_RICH_TEXT_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}
