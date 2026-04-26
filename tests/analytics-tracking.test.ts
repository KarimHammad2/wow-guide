import { describe, expect, it } from 'vitest'
import {
  aggregateAnalyticsDashboard,
  type AnalyticsBuildingRecord,
  type AnalyticsVisitRecord,
} from '../lib/analytics-repository'

describe('analytics aggregation', () => {
  const now = new Date('2026-04-23T12:00:00Z')

  const buildings: AnalyticsBuildingRecord[] = [
    { id: 'alpha', name: 'Alpha Residence', app_path: '/alpha' },
    { id: 'beta', name: 'Beta Residence', app_path: '/beta' },
  ]

  const visits: AnalyticsVisitRecord[] = [
    {
      id: '1',
      building_id: 'alpha',
      visitor_id: 'visitor-a',
      pathname: '/alpha',
      page_title: 'Alpha Residence',
      page_type: 'building_home',
      category_slug: null,
      referrer: '',
      visited_at: '2026-04-23T08:00:00Z',
    },
    {
      id: '2',
      building_id: 'alpha',
      visitor_id: 'visitor-b',
      pathname: '/alpha/category/wifi',
      page_title: 'WiFi',
      page_type: 'category',
      category_slug: 'wifi',
      referrer: '',
      visited_at: '2026-04-23T09:00:00Z',
    },
    {
      id: '3',
      building_id: 'alpha',
      visitor_id: 'visitor-a',
      pathname: '/alpha/category/wifi',
      page_title: 'WiFi',
      page_type: 'category',
      category_slug: 'wifi',
      referrer: '',
      visited_at: '2026-04-22T10:00:00Z',
    },
    {
      id: '4',
      building_id: 'beta',
      visitor_id: 'visitor-c',
      pathname: '/beta',
      page_title: 'Beta Residence',
      page_type: 'building_home',
      category_slug: null,
      referrer: '',
      visited_at: '2026-04-22T11:00:00Z',
    },
    {
      id: '5',
      building_id: 'beta',
      visitor_id: 'visitor-d',
      pathname: '/beta',
      page_title: 'Beta Residence',
      page_type: 'building_home',
      category_slug: null,
      referrer: '',
      visited_at: '2026-04-10T11:00:00Z',
    },
  ]

  it('aggregates visits, unique visitors, trends, and top pages', () => {
    const data = aggregateAnalyticsDashboard(visits, buildings, 7, now)

    expect(data.summary.totalVisits).toBe(4)
    expect(data.summary.uniqueVisitors).toBe(3)
    expect(data.summary.trackedBuildings).toBe(2)
    expect(data.summary.trackedPages).toBe(3)

    expect(data.topBuildings[0]).toMatchObject({
      buildingId: 'alpha',
      buildingName: 'Alpha Residence',
      visits: 3,
      uniqueVisitors: 2,
    })

    expect(data.topPages[0]).toMatchObject({
      buildingId: 'alpha',
      pathname: '/alpha/category/wifi',
      pageTitle: 'WiFi',
      visits: 2,
      uniqueVisitors: 2,
    })

    const day23 = data.trend.find((point) => point.date === '2026-04-23')
    const day22 = data.trend.find((point) => point.date === '2026-04-22')

    expect(day23).toMatchObject({ visits: 2, uniqueVisitors: 2 })
    expect(day22).toMatchObject({ visits: 2, uniqueVisitors: 2 })
  })
})
