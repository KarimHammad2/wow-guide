import type { GuideContent } from './admin-types'
import {
  BRISTENWEG_10_INTERNET_CATEGORY_TITLE,
  BRISTENWEG_10_INTERNET_IMAGE_PATHS,
  BRISTENWEG_10_INTERNET_INTRO,
} from './content-seeds/bristenweg-10-internet'
import type { ContentItem, ContentSection } from './data'

const DEFAULT_QR = BRISTENWEG_10_INTERNET_IMAGE_PATHS.qrPanels
const QR_ROW_DESCRIPTION =
  'WOW Guide and Internet login QR codes on purple panels near the kitchen.'

function isWifiIntroText(section: ContentSection): boolean {
  if (section.type !== 'text') return false
  const plain = section.content?.trim() ?? ''
  return plain.includes('Speed is our friend')
}

function mediaUrlFromImageSection(section: ContentSection | undefined): string | undefined {
  if (!section) return undefined
  if (section.type === 'image' || section.type === 'media') {
    const url = section.mediaUrl?.trim()
    if (url) return url
    const fromItem = section.items?.[0]?.image?.trim()
    if (fromItem) return fromItem
  }
  return undefined
}

function enrichCatalogBandItems(items: ContentItem[] | undefined): ContentItem[] | undefined {
  if (!items?.length) return items
  let changed = false
  const next = items.map((item) => {
    if (item.image?.trim()) return item
    if (!item.title?.includes('Speed is our friend')) return item
    changed = true
    return {
      ...item,
      image: DEFAULT_QR,
      description: item.description?.trim() || QR_ROW_DESCRIPTION,
    }
  })
  return changed ? next : items
}

function enrichCatalogBandSection(section: ContentSection): ContentSection {
  if (section.type !== 'catalogBand') return section
  const enriched = enrichCatalogBandItems(section.items)
  if (enriched === section.items) return section
  return { ...section, items: enriched }
}

/** Move the first catalog band block to the top so the guest page hides the duplicate category header. */
function promoteCatalogBandFirst(sections: ContentSection[]): ContentSection[] {
  const idx = sections.findIndex((s) => s.type === 'catalogBand')
  if (idx <= 0) return sections
  const copy = [...sections]
  const [band] = copy.splice(idx, 1)
  copy.unshift(band)
  return copy
}

/** Legacy layout: category title + plain `text` intro; rebuild the intended catalog hero. */
function coalesceTextIntroToCatalogBand(sections: ContentSection[]): ContentSection[] | null {
  if (sections.some((s) => s.type === 'catalogBand')) return null
  const first = sections[0]
  if (!first || !isWifiIntroText(first)) return null

  const rowImage = mediaUrlFromImageSection(sections[1])
  const dropSecond = Boolean(rowImage && sections[1] && (sections[1].type === 'image' || sections[1].type === 'media'))

  const heroId = first.blockId ?? first.id ?? 'internet-catalog-hero'
  const catalog: ContentSection = {
    id: heroId,
    blockId: heroId,
    type: 'catalogBand',
    title: BRISTENWEG_10_INTERNET_CATEGORY_TITLE,
    backgroundColor: '#9b5d72',
    textColor: '#ffffff',
    items: [
      {
        id: `${heroId}-wifi-row`,
        icon: 'Wifi',
        title: first.content?.trim() || BRISTENWEG_10_INTERNET_INTRO,
        image: rowImage ?? DEFAULT_QR,
        description: QR_ROW_DESCRIPTION,
      },
    ],
  }

  const tail = dropSecond ? sections.slice(2) : sections.slice(1)
  return [catalog, ...tail]
}

/**
 * Guest-facing fixes for the `internet` category: published JSON sometimes omits the leading
 * `catalogBand`, drops row images, or reorders blocks after editing — which brings back the
 * default page header and hides the QR column.
 */
export function normalizeInternetCategoryGuestContent(content: GuideContent): GuideContent {
  let sections = [...(content.sections ?? [])]
  if (sections.length === 0) return content

  sections = sections.map((s) => enrichCatalogBandSection(s))

  const coalesced = coalesceTextIntroToCatalogBand(sections)
  if (coalesced) {
    sections = coalesced.map((s) => enrichCatalogBandSection(s))
  }

  sections = promoteCatalogBandFirst(sections)

  return { ...content, sections }
}
