import type { ContentSection } from './data'

export interface SectionRowGroup {
  rowId: string | null
  sections: ContentSection[]
  startIndex: number
  endIndex: number
}

export function groupSectionsByRow(sections: ContentSection[]): SectionRowGroup[] {
  const groups: SectionRowGroup[] = []

  sections.forEach((section, index) => {
    const rowId = section.rowId ?? null
    const last = groups[groups.length - 1]

    if (last && last.rowId && rowId && last.rowId === rowId) {
      last.sections.push(section)
      last.endIndex = index
      return
    }

    groups.push({
      rowId,
      sections: [section],
      startIndex: index,
      endIndex: index,
    })
  })

  return groups
}

export function getRowTemplate(sections: ContentSection[]): string | null {
  if (sections.length < 2) return null

  // Use fr weights proportional to inspector "Width" so changing a value always changes the
  // column's *share* of the row. Plain minmax(0, Npx) only caps the maximum track size; when
  // the row is narrower than the sum of those caps, tracks shrink toward content and two blocks
  // can stay ~50/50 no matter how large you type N (common list + image side-by-side case).
  return sections
    .map((section) => {
      const width = section.blockWidth
      return width != null && width > 0 ? `minmax(0, ${width}fr)` : 'minmax(0, 1fr)'
    })
    .join(' ')
}
