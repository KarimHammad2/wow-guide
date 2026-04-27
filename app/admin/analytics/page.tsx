'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  Clock3,
  Eye,
  LineChart as LineChartIcon,
  MapPinned,
  MousePointerClick,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AnalyticsDashboardData, AnalyticsRangeDays } from '@/lib/analytics-repository'

const RANGE_OPTIONS: Array<{ value: AnalyticsRangeDays; label: string }> = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

export default function AdminAnalyticsPage() {
  const { email, canManageTeam, loading, error, setError, logout } = useAdminSession()
  const [rangeDays, setRangeDays] = useState<AnalyticsRangeDays>(30)
  const [dataLoading, setDataLoading] = useState(true)
  const [data, setData] = useState<AnalyticsDashboardData | null>(null)

  useEffect(() => {
    if (loading) return

    setDataLoading(true)
    setError(null)
    void adminRequest<AnalyticsDashboardData>(`/api/admin/analytics?range=${rangeDays}`)
      .then((payload) => {
        setData(payload)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to load analytics data')
      })
      .finally(() => {
        setDataLoading(false)
      })
  }, [loading, rangeDays, setError])

  const topBuilding = data?.topBuildings[0]

  const trendData = useMemo(
    () =>
      data?.trend.map((point) => ({
        ...point,
        label: point.label,
      })) ?? [],
    [data?.trend]
  )

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <AdminShell userEmail={email} canManageTeam={canManageTeam} onLogout={logout}>
      <ModuleHeader
        title="Analytics"
        description="Track unique visitors and page views across every building page."
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Date range</p>
          <p className="text-xs text-muted-foreground">Choose how much history to include in the charts.</p>
        </div>
        <Select value={String(rangeDays)} onValueChange={(value) => setRangeDays(Number(value) as AnalyticsRangeDays)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Unique visitors
            </CardDescription>
            <CardTitle className="text-3xl">{data?.summary.uniqueVisitors ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Page views
            </CardDescription>
            <CardTitle className="text-3xl">{data?.summary.totalVisits ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MapPinned className="h-4 w-4" />
              Tracked buildings
            </CardDescription>
            <CardTitle className="text-3xl">{data?.summary.trackedBuildings ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Top building
            </CardDescription>
            <CardTitle className="text-xl">
              {topBuilding ? topBuilding.buildingName : '—'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-3xl xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Visitor Trend
            </CardTitle>
            <CardDescription>Daily page views and unique visitors for the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <p className="py-8 text-sm text-muted-foreground">Loading trend...</p>
            ) : (
              <ChartContainer
                className="h-[320px] w-full"
                config={{
                  visits: { label: 'Page views', color: '#9b5a74' },
                  uniqueVisitors: { label: 'Unique visitors', color: '#6b7280' },
                }}
              >
                <LineChart data={trendData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="var(--color-visits)"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="uniqueVisitors"
                    stroke="var(--color-uniqueVisitors)"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-5 w-5" />
              Recent Visits
            </CardTitle>
            <CardDescription>Latest tracked page loads from the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <p className="py-8 text-sm text-muted-foreground">Loading recent visits...</p>
            ) : (
              <div className="space-y-3">
                {data?.recentVisits.length ? (
                  data.recentVisits.map((visit) => (
                    <div key={`${visit.visitorId}-${visit.visitedAt}`} className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{visit.pageTitle}</p>
                          <p className="truncate text-xs text-muted-foreground">{visit.buildingName}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-secondary-foreground">
                          {visit.pageType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(visit.visitedAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-sm text-muted-foreground">No visits recorded yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              Top Buildings
            </CardTitle>
            <CardDescription>Which buildings attract the most traffic.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <p className="py-8 text-sm text-muted-foreground">Loading building breakdown...</p>
            ) : data?.topBuildings.length ? (
              <>
                <ChartContainer
                  className="h-[320px] w-full"
                  config={{
                    value: { label: 'Visits', color: '#faf085' },
                  }}
                >
                  <BarChart data={data.topBuildings} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="buildingName" tickLine={false} axisLine={false} width={140} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="visits" radius={[0, 8, 8, 0]} fill="var(--color-value)" />
                  </BarChart>
                </ChartContainer>
                <div className="mt-4 w-full min-w-0 overflow-x-auto -mx-1 px-1 pb-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Building</TableHead>
                        <TableHead className="text-right">Visits</TableHead>
                        <TableHead className="text-right">Unique</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topBuildings.slice(0, 5).map((row) => (
                        <TableRow key={row.buildingId}>
                          <TableCell className="max-w-48 truncate">
                            <Link href={row.appPath} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                              {row.buildingName}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{row.visits}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.uniqueVisitors}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <p className="py-8 text-sm text-muted-foreground">No building analytics available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Top Pages
            </CardTitle>
            <CardDescription>Most visited pages across the guide.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <p className="py-8 text-sm text-muted-foreground">Loading page breakdown...</p>
            ) : data?.topPages.length ? (
              <div className="w-full min-w-0 overflow-x-auto -mx-1 px-1 pb-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead>Building</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                      <TableHead className="text-right">Unique</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topPages.map((row) => (
                      <TableRow key={`${row.buildingId}:${row.pathname}`}>
                        <TableCell className="max-w-[16rem]">
                          <Link href={row.pathname} className="truncate text-primary hover:underline" target="_blank" rel="noreferrer">
                            {row.pageTitle}
                          </Link>
                          <div className="truncate text-xs text-muted-foreground">{row.pathname}</div>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">{row.buildingName}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.visits}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.uniqueVisitors}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-8 text-sm text-muted-foreground">No page visits tracked yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
