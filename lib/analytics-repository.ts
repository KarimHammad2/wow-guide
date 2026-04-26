import { createSupabaseAdmin } from './supabase/admin'
import type { Database } from './database.types'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_RANGE_DAYS = 30

export type AnalyticsRangeDays = 7 | 30 | 90

export interface AnalyticsVisitRecord {
  id?: string
  building_id: string
  visitor_id: string
  pathname: string
  page_title: string
  page_type: string
  category_slug: string | null
  referrer: string
  visited_at: string
}

export interface AnalyticsBuildingRecord {
  id: string
  name: string
  app_path: string
}

export interface AnalyticsTrendPoint {
  date: string
  label: string
  visits: number
  uniqueVisitors: number
}

export interface AnalyticsTopBuilding {
  buildingId: string
  buildingName: string
  appPath: string
  visits: number
  uniqueVisitors: number
}

export interface AnalyticsTopPage {
  buildingId: string
  buildingName: string
  pathname: string
  pageTitle: string
  pageType: string
  categorySlug: string | null
  visits: number
  uniqueVisitors: number
}

export interface AnalyticsRecentVisit {
  buildingId: string
  buildingName: string
  pathname: string
  pageTitle: string
  pageType: string
  categorySlug: string | null
  visitorId: string
  visitedAt: string
}

export interface AnalyticsDashboardData {
  rangeDays: AnalyticsRangeDays
  generatedAt: string
  summary: {
    totalVisits: number
    uniqueVisitors: number
    trackedBuildings: number
    trackedPages: number
  }
  trend: AnalyticsTrendPoint[]
  topBuildings: AnalyticsTopBuilding[]
  topPages: AnalyticsTopPage[]
  recentVisits: AnalyticsRecentVisit[]
}

export interface RecordBuildingPageVisitInput {
  buildingId: string
  visitorId: string
  pathname: string
  pageTitle: string
  pageType: string
  categorySlug?: string | null
  referrer?: string
}

function normalizeRangeDays(rangeDays: number | string | undefined): AnalyticsRangeDays {
  const parsed = typeof rangeDays === 'string' ? Number.parseInt(rangeDays, 10) : rangeDays
  if (parsed === 7 || parsed === 30 || parsed === 90) {
    return parsed
  }
  return DEFAULT_RANGE_DAYS
}

function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function utcDayLabel(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function getTrendWindow(rangeDays: number, now: Date) {
  const end = startOfUtcDay(now)
  const start = new Date(end.getTime() - (rangeDays - 1) * DAY_MS)
  const points: AnalyticsTrendPoint[] = []
  for (let i = 0; i < rangeDays; i += 1) {
    const pointDate = new Date(start.getTime() + i * DAY_MS)
    points.push({
      date: utcDayKey(pointDate),
      label: utcDayLabel(pointDate),
      visits: 0,
      uniqueVisitors: 0,
    })
  }
  return { start, points }
}

function pageKey(visit: Pick<AnalyticsVisitRecord, 'building_id' | 'pathname'>): string {
  return `${visit.building_id}::${visit.pathname}`
}

export function aggregateAnalyticsDashboard(
  visits: AnalyticsVisitRecord[],
  buildings: AnalyticsBuildingRecord[],
  rangeDaysInput: number,
  now = new Date()
): AnalyticsDashboardData {
  const rangeDays = normalizeRangeDays(rangeDaysInput)
  const buildingMap = new Map(buildings.map((building) => [building.id, building]))
  const { start, points } = getTrendWindow(rangeDays, now)
  const trendVisitors = new Map<string, Set<string>>()
  const buildingStats = new Map<string, { visits: number; visitorIds: Set<string> }>()
  const pageStats = new Map<
    string,
    {
      buildingId: string
      pathname: string
      pageTitle: string
      pageType: string
      categorySlug: string | null
      visits: number
      visitorIds: Set<string>
    }
  >()
  const recentVisits: AnalyticsRecentVisit[] = []

  for (const visit of visits) {
    const visitTime = new Date(visit.visited_at)
    if (Number.isNaN(visitTime.getTime()) || visitTime < start) {
      continue
    }

    const building = buildingMap.get(visit.building_id)
    const buildingName = building?.name ?? visit.building_id
    const dayKey = utcDayKey(visitTime)
    const trendPoint = points.find((point) => point.date === dayKey)
    if (trendPoint) {
      trendPoint.visits += 1
      const visitorSet = trendVisitors.get(dayKey) ?? new Set<string>()
      visitorSet.add(visit.visitor_id)
      trendVisitors.set(dayKey, visitorSet)
    }

    const buildingEntry = buildingStats.get(visit.building_id) ?? {
      visits: 0,
      visitorIds: new Set<string>(),
    }
    buildingEntry.visits += 1
    buildingEntry.visitorIds.add(visit.visitor_id)
    buildingStats.set(visit.building_id, buildingEntry)

    const key = pageKey(visit)
    const pageEntry = pageStats.get(key) ?? {
      buildingId: visit.building_id,
      pathname: visit.pathname,
      pageTitle: visit.page_title,
      pageType: visit.page_type,
      categorySlug: visit.category_slug,
      visits: 0,
      visitorIds: new Set<string>(),
    }
    pageEntry.visits += 1
    pageEntry.visitorIds.add(visit.visitor_id)
    pageStats.set(key, pageEntry)

    if (recentVisits.length < 10) {
      recentVisits.push({
        buildingId: visit.building_id,
        buildingName,
        pathname: visit.pathname,
        pageTitle: visit.page_title,
        pageType: visit.page_type,
        categorySlug: visit.category_slug,
        visitorId: visit.visitor_id,
        visitedAt: visit.visited_at,
      })
    }
  }

  for (const point of points) {
    const visitorSet = trendVisitors.get(point.date)
    point.uniqueVisitors = visitorSet?.size ?? 0
  }

  const topBuildings = [...buildingStats.entries()]
    .map(([buildingId, stats]) => {
      const building = buildingMap.get(buildingId)
      return {
        buildingId,
        buildingName: building?.name ?? buildingId,
        appPath: building?.app_path ?? `/${buildingId}`,
        visits: stats.visits,
        uniqueVisitors: stats.visitorIds.size,
      }
    })
    .sort((a, b) => b.visits - a.visits || b.uniqueVisitors - a.uniqueVisitors || a.buildingName.localeCompare(b.buildingName))

  const topPages = [...pageStats.values()]
    .map((entry) => {
      const building = buildingMap.get(entry.buildingId)
      return {
        buildingId: entry.buildingId,
        buildingName: building?.name ?? entry.buildingId,
        pathname: entry.pathname,
        pageTitle: entry.pageTitle || entry.pathname,
        pageType: entry.pageType,
        categorySlug: entry.categorySlug,
        visits: entry.visits,
        uniqueVisitors: entry.visitorIds.size,
      }
    })
    .sort((a, b) => b.visits - a.visits || b.uniqueVisitors - a.uniqueVisitors || a.pageTitle.localeCompare(b.pageTitle))

  const totalVisits = visits.filter((visit) => !Number.isNaN(new Date(visit.visited_at).getTime()) && new Date(visit.visited_at) >= start).length
  const uniqueVisitors = new Set(
    visits
      .filter((visit) => !Number.isNaN(new Date(visit.visited_at).getTime()) && new Date(visit.visited_at) >= start)
      .map((visit) => visit.visitor_id)
  ).size

  return {
    rangeDays,
    generatedAt: now.toISOString(),
    summary: {
      totalVisits,
      uniqueVisitors,
      trackedBuildings: buildingStats.size,
      trackedPages: pageStats.size,
    },
    trend: points,
    topBuildings: topBuildings.slice(0, 8),
    topPages: topPages.slice(0, 12),
    recentVisits,
  }
}

export async function recordBuildingPageVisit(input: RecordBuildingPageVisitInput): Promise<void> {
  const admin = createSupabaseAdmin()
  const { error } = await admin.from('building_page_visits').insert({
    building_id: input.buildingId,
    visitor_id: input.visitorId,
    pathname: input.pathname,
    page_title: input.pageTitle,
    page_type: input.pageType,
    category_slug: input.categorySlug ?? null,
    referrer: input.referrer ?? '',
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function getAnalyticsDashboardData(rangeDaysInput: number | string | undefined = DEFAULT_RANGE_DAYS) {
  const rangeDays = normalizeRangeDays(rangeDaysInput)
  const now = new Date()
  const start = new Date(now.getTime() - (rangeDays - 1) * DAY_MS)
  const admin = createSupabaseAdmin()

  const [visitsResult, buildingsResult] = await Promise.all([
    admin
      .from('building_page_visits')
      .select('building_id, visitor_id, pathname, page_title, page_type, category_slug, referrer, visited_at')
      .gte('visited_at', start.toISOString())
      .order('visited_at', { ascending: false }),
    admin.from('buildings').select('id, name, app_path').order('name', { ascending: true }),
  ])

  if (visitsResult.error) {
    throw new Error(visitsResult.error.message)
  }
  if (buildingsResult.error) {
    throw new Error(buildingsResult.error.message)
  }

  return aggregateAnalyticsDashboard(
    (visitsResult.data ?? []) as AnalyticsVisitRecord[],
    (buildingsResult.data ?? []) as AnalyticsBuildingRecord[],
    rangeDays,
    now
  )
}
