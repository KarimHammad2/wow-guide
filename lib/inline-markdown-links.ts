/** Match [label](url) for inline links inside a single line of text (list items, steps, etc.). */
const BRACKET_LINK_RE = /\[([^\]]*)\]\(([^)]*)\)/g

export type BracketLinkSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; label: string; href: string }

export function collectBracketLinkHrefs(text: string): string[] {
  if (!text) return []
  BRACKET_LINK_RE.lastIndex = 0
  const hrefs: string[] = []
  let m: RegExpExecArray | null
  while ((m = BRACKET_LINK_RE.exec(text)) !== null) {
    hrefs.push(m[2] ?? '')
  }
  return hrefs
}

export function parseBracketLinkSegments(text: string): BracketLinkSegment[] {
  if (!text) return []
  const segments: BracketLinkSegment[] = []
  BRACKET_LINK_RE.lastIndex = 0
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = BRACKET_LINK_RE.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ kind: 'text', text: text.slice(lastIndex, m.index) })
    }
    segments.push({ kind: 'link', label: m[1] ?? '', href: m[2] ?? '' })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', text: text.slice(lastIndex) })
  }
  if (segments.length === 0) {
    return [{ kind: 'text', text }]
  }
  return segments
}
