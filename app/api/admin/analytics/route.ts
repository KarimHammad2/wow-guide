import { NextResponse } from 'next/server'
import { requireAnalyticsDashboardSession } from '@/lib/admin-api'
import { getAnalyticsDashboardData } from '@/lib/analytics-repository'
import { logApiError, serverErrorResponse } from '@/lib/api-route-utils'

export async function GET(request: Request) {
  const auth = await requireAnalyticsDashboardSession()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const range = url.searchParams.get('range') ?? undefined

  try {
    const data = await getAnalyticsDashboardData(range)
    return NextResponse.json(data)
  } catch (error) {
    logApiError('admin-analytics', error)
    return serverErrorResponse('Unable to load analytics data.')
  }
}
