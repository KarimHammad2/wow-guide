import { describe, expect, it } from 'vitest'
import { normalizeInternetCategoryGuestContent } from '../lib/guide-internet-guest-normalize'
import {
  BRISTENWEG_10_INTERNET_IMAGE_PATHS,
  BRISTENWEG_10_INTERNET_INTRO,
} from '../lib/content-seeds/bristenweg-10-internet'
import type { ContentSection } from '../lib/data'
import type { GuideContent } from '../lib/admin-types'

function sectionsOf(...sections: ContentSection[]): GuideContent {
  return { intro: '', sections }
}

describe('normalizeInternetCategoryGuestContent', () => {
  it('coalesces a leading text intro into a catalog band hero', () => {
    const out = normalizeInternetCategoryGuestContent(
      sectionsOf({
        id: 't1',
        blockId: 't1',
        type: 'text',
        title: '',
        content: BRISTENWEG_10_INTERNET_INTRO,
      })
    )
    expect(out.sections[0]?.type).toBe('catalogBand')
    expect(out.sections[0]?.title).toBe('INTERNET & ENTERTAINMENT')
    expect(out.sections[0]?.items?.[0]?.image).toBe(BRISTENWEG_10_INTERNET_IMAGE_PATHS.qrPanels)
  })

  it('uses the following image section as the row image when present', () => {
    const out = normalizeInternetCategoryGuestContent(
      sectionsOf(
        {
          id: 't1',
          blockId: 't1',
          type: 'text',
          content: BRISTENWEG_10_INTERNET_INTRO,
        },
        {
          id: 'img1',
          blockId: 'img1',
          type: 'image',
          title: 'Panel',
          mediaUrl: '/guides/bristenweg-10/custom.png',
        }
      )
    )
    expect(out.sections[0]?.items?.[0]?.image).toBe('/guides/bristenweg-10/custom.png')
    expect(out.sections).toHaveLength(1)
  })

  it('promotes an off-index catalog band to the front', () => {
    const band: ContentSection = {
      id: 'band',
      blockId: 'band',
      type: 'catalogBand',
      title: 'INTERNET & ENTERTAINMENT',
      backgroundColor: '#9b5d72',
      textColor: '#ffffff',
      items: [
        {
          id: 'r1',
          icon: 'Wifi',
          title: BRISTENWEG_10_INTERNET_INTRO,
          image: '',
          description: '',
        },
      ],
    }
    const out = normalizeInternetCategoryGuestContent(
      sectionsOf(
        {
          id: 'noise',
          blockId: 'noise',
          type: 'text',
          title: 'Note',
          content: 'Something else',
        },
        band
      )
    )
    expect(out.sections[0]?.type).toBe('catalogBand')
    expect(out.sections[0]?.items?.[0]?.image).toBe(BRISTENWEG_10_INTERNET_IMAGE_PATHS.qrPanels)
    expect(out.sections[1]?.id).toBe('noise')
  })

  it('does not coalesce when a catalog band already exists', () => {
    const existing: ContentSection = {
      id: 'band',
      blockId: 'band',
      type: 'catalogBand',
      title: 'INTERNET & ENTERTAINMENT',
      items: [
        {
          id: 'r1',
          icon: 'Wifi',
          title: BRISTENWEG_10_INTERNET_INTRO,
          image: BRISTENWEG_10_INTERNET_IMAGE_PATHS.qrPanels,
        },
      ],
    }
    const out = normalizeInternetCategoryGuestContent(
      sectionsOf(existing, {
        id: 't1',
        type: 'text',
        content: BRISTENWEG_10_INTERNET_INTRO,
      } as ContentSection)
    )
    expect(out.sections[0]?.id).toBe('band')
    expect(out.sections).toHaveLength(2)
  })
})
