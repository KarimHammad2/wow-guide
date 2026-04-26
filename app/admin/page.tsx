'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPinned, Activity, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import type { Building } from '@/lib/data'
import type { City, EmergencyInfo, TeamMember } from '@/lib/admin-types'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'

export default function AdminDashboardPage() {
  const { email, canManageTeam, loading, error, setError, logout } = useAdminSession()
  const [dataLoading, setDataLoading] = useState(true)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [emergencyRecords, setEmergencyRecords] = useState<EmergencyInfo[]>([])

  useEffect(() => {
    if (loading) return
    setDataLoading(true)
    void Promise.all([
      adminRequest<Building[]>('/api/admin/buildings'),
      adminRequest<City[]>('/api/admin/cities'),
      adminRequest<TeamMember[]>('/api/admin/teams'),
      adminRequest<EmergencyInfo[]>('/api/admin/emergency'),
    ])
      .then(([buildingsData, citiesData, teamData, emergencyData]) => {
        setBuildings(buildingsData)
        setCities(citiesData)
        setTeamMembers(teamData)
        setEmergencyRecords(emergencyData)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load analytics data'
        setError(message)
      })
      .finally(() => setDataLoading(false))
  }, [loading, setError])

  const snapshotData = useMemo(
    () => [
      { name: 'Buildings', value: buildings.length },
      { name: 'Cities', value: cities.length },
      { name: 'Team', value: teamMembers.length },
      { name: 'Emergency', value: emergencyRecords.length },
    ],
    [buildings.length, cities.length, teamMembers.length, emergencyRecords.length]
  )

  const buildingsByCity = useMemo(() => {
    const map = buildings.reduce<Record<string, number>>((acc, building) => {
      acc[building.city] = (acc[building.city] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
      .slice(0, 8)
  }, [buildings])

  const roleDistribution = useMemo(
    () => [
      {
        name: 'Owner',
        value: teamMembers.filter((member) => member.isOwner).length,
        fill: 'var(--color-owner)',
      },
      {
        name: 'Team',
        value: teamMembers.filter((member) => !member.isOwner).length,
        fill: 'var(--color-team)',
      },
    ],
    [teamMembers]
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
        title="Admin Dashboard"
        description="Choose a module from the sidebar or cards below to manage your platform."
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Buildings</CardDescription>
            <CardTitle className="text-3xl">{buildings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Cities</CardDescription>
            <CardTitle className="text-3xl">{cities.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Team Members</CardDescription>
            <CardTitle className="text-3xl">{teamMembers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Emergency Records</CardDescription>
            <CardTitle className="text-3xl">{emergencyRecords.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-3xl xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Platform Snapshot
            </CardTitle>
            <CardDescription>Live totals across key admin modules.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <p className="text-sm text-muted-foreground py-8">Loading chart...</p>
            ) : (
              <ChartContainer
                className="h-[280px] w-full"
                config={{
                  value: { label: 'Count', color: '#9b5a74' },
                }}
              >
                <BarChart data={snapshotData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="var(--color-value)" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Team Access Mix
            </CardTitle>
            <CardDescription>Distribution of permissions in your team.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <p className="text-sm text-muted-foreground py-8">Loading chart...</p>
            ) : (
              <ChartContainer
                className="h-[280px] w-full"
                config={{
                  owner: { label: 'Owner', color: '#9b5a74' },
                  team: { label: 'Team', color: '#faf085' },
                }}
              >
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    strokeWidth={3}
                  >
                    {roleDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="w-5 h-5" />
            Buildings by City
          </CardTitle>
          <CardDescription>Where your current building inventory is concentrated.</CardDescription>
        </CardHeader>
        <CardContent>
          {dataLoading ? (
            <p className="text-sm text-muted-foreground py-8">Loading chart...</p>
          ) : (
            <ChartContainer
              className="h-[320px] w-full"
              config={{
                value: { label: 'Buildings', color: '#faf085' },
              }}
            >
              <BarChart data={buildingsByCity} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={120} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="var(--color-value)" />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Open the visitor analytics dashboard for per-building traffic trends.</CardDescription>
          </div>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            View analytics
          </Link>
        </CardHeader>
      </Card>

    </AdminShell>
  )
}
