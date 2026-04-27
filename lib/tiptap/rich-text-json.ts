/**
 * Read-only utilities for Tiptap JSON (ProseMirror) stored on text blocks.
 */

function walkProseNode(node: unknown, visit: (n: Record<string, unknown>) => void): void {
  if (node === null || node === undefined) return
  if (typeof node !== 'object') return
  const n = node as Record<string, unknown>
  visit(n)
  if (Array.isArray(n.content)) {
    for (const c of n.content) walkProseNode(c, visit)
  }
}

/** Return href values for every link mark in the document. */
export function collectLinkHrefsFromRichTextJson(doc: unknown): string[] {
  const hrefs: string[] = []
  walkProseNode(doc, (n) => {
    const marks = n.marks
    if (!Array.isArray(marks)) return
    for (const m of marks) {
      if (m && typeof m === 'object' && (m as { type?: string }).type === 'link') {
        const href = (m as { attrs?: { href?: string } }).attrs?.href
        if (typeof href === 'string' && href.trim()) hrefs.push(href.trim())
      }
    }
  })
  return hrefs
}

/**
 * True if the document is worth rendering as rich HTML (non-empty text, a link mark, or a table).
 * Empty doc: `{ type: "doc", content: [{ type: "paragraph" }] }` => false
 */
export function hasSubstantiveRichTextJson(doc: unknown): boolean {
  if (doc === null || doc === undefined) return false
  if (typeof doc !== 'object') return false
  let substantive = false
  walkProseNode(doc, (n) => {
    const nodeType = n.type
    if (
      nodeType === 'table' ||
      nodeType === 'tableRow' ||
      nodeType === 'tableCell' ||
      nodeType === 'tableHeader'
    ) {
      substantive = true
    }
    if (nodeType === 'bulletList' || nodeType === 'orderedList' || nodeType === 'listItem') {
      substantive = true
    }
    if (nodeType === 'inlineIcon') substantive = true
    if (typeof n.text === 'string' && n.text.length > 0) substantive = true
    const marks = n.marks
    if (Array.isArray(marks)) {
      for (const m of marks) {
        if (m && typeof m === 'object' && (m as { type?: string }).type === 'link') {
          substantive = true
        }
      }
    }
  })
  return substantive
}
