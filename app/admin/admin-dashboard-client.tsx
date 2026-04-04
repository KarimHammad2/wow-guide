'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Hotel,
  Building,
  MapPinned,
  Users,
  AlertTriangle,
  LogOut,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Building as BuildingType, Category, ContentSection } from '@/lib/data'
import type { City, EmergencyInfo, TeamMember } from '@/lib/admin-types'

type BuildingSectionRecord = {
  category: Category
  content: {
    intro: string
    alert?: { type: 'info' | 'warning' | 'success' | 'danger'; message: string }
    sections: ContentSection[]
  }
}

const sidebarItems = [
  { id: 'section-emergency', label: 'Emergency', icon: AlertTriangle },
  { id: 'section-team', label: 'Team Access', icon: Users },
  { id: 'section-cities', label: 'Cities', icon: MapPinned },
  { id: 'section-buildings', label: 'Buildings', icon: Building },
  { id: 'section-guide', label: 'Guide Sections', icon: Hotel },
] as const

export function AdminDashboardClient() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [emergencyInfos, setEmergencyInfos] = useState<EmergencyInfo[]>([])
  const [teams, setTeams] = useState<TeamMember[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [buildings, setBuildings] = useState<BuildingType[]>([])
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('')
  const [sections, setSections] = useState<BuildingSectionRecord[]>([])

  const [newCityName, setNewCityName] = useState('')
  const [newCityCountry, setNewCityCountry] = useState('Switzerland')
  const [newBuilding, setNewBuilding] = useState<Omit<BuildingType, 'id'>>({
    name: '',
    address: '',
    city: '',
    appPath: '',
    country: 'Switzerland',
    imageUrl: '/images/buildings/kannenfeldstrasse.jpg',
    emergencyPhone: '',
    supportEmail: '',
    welcomeMessage: '',
  })
  const [newEmergency, setNewEmergency] = useState<Omit<EmergencyInfo, 'id'>>({
    label: 'Emergency contact',
    phone: '',
    email: '',
  })
  const [newSection, setNewSection] = useState({
    slug: '',
    title: '',
    subtitle: '',
    icon: 'BookOpen',
    color: 'primary' as Category['color'],
    intro: '',
    sectionsJson: '[]',
  })

  const canEdit = true

  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId),
    [buildings, selectedBuildingId]
  )

  function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId)
    if (!element) return
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null
      throw new Error(payload?.error || 'Request failed')
    }
    return response.json() as Promise<T>
  }

  async function loadAllData() {
    setLoading(true)
    setError(null)
    try {
      const me = await request<{ loggedIn: boolean; email?: string | null }>('/api/admin/me')
      if (!me.loggedIn) {
        router.push('/admin/login')
        return
      }
      setUserEmail(typeof me.email === 'string' ? me.email : null)

      const [emergencyData, teamsData, citiesData, buildingsData] = await Promise.all([
        request<EmergencyInfo[]>('/api/admin/emergency'),
        request<TeamMember[]>('/api/admin/teams'),
        request<City[]>('/api/admin/cities'),
        request<BuildingType[]>('/api/admin/buildings'),
      ])
      setEmergencyInfos(emergencyData)
      setTeams(teamsData)
      setCities(citiesData)
      setBuildings(buildingsData)

      const defaultBuilding = buildingsData[0]
      if (defaultBuilding) {
        setSelectedBuildingId(defaultBuilding.id)
        const sectionData = await request<BuildingSectionRecord[]>(
          `/api/admin/buildings/${defaultBuilding.id}/sections`
        )
        setSections(sectionData)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load dashboard'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedBuildingId) return
    void request<BuildingSectionRecord[]>(`/api/admin/buildings/${selectedBuildingId}/sections`)
      .then(setSections)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load sections'
        setError(message)
      })
  }, [selectedBuildingId])

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  async function mutate(action: () => Promise<void>) {
    setSaving(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl border border-border/70 bg-card/90 backdrop-blur-md p-4 shadow-[0_24px_55px_-45px_rgba(0,0,0,0.7)]">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground px-2">Admin</p>
            <h2 className="text-xl font-bold px-2 mt-2">Admin Sidebar</h2>
            <div className="mt-4 space-y-1">
              {sidebarItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => scrollToSection(item.id)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-background/70 p-3 text-sm space-y-1">
              <p className="text-muted-foreground">Overview</p>
              <p className="font-medium">Buildings: {buildings.length}</p>
              <p className="font-medium">Cities: {cities.length}</p>
              <p className="font-medium">Team members: {teams.length}</p>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-border/50 pt-4 px-2">
              <p className="text-center text-sm font-medium text-foreground leading-snug break-words">
                {userEmail ?? '—'}
              </p>
              <Button variant="outline" onClick={logout} className="w-full gap-2 rounded-lg" type="button">
                <LogOut className="w-4 h-4 shrink-0" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <header className="rounded-3xl border border-border/70 bg-card/85 backdrop-blur-md p-6 md:p-8 shadow-[0_30px_70px_-55px_rgba(0,0,0,0.65)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Manage emergency info, teams, cities, buildings, and guide sections.
                </p>
              </div>
            </div>
            {error && (
              <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
                {error}
              </p>
            )}
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card id="section-emergency" className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Emergency Contacts</CardTitle>
              <CardDescription>Add, edit, and remove emergency phone/email records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {emergencyInfos.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-3 space-y-2">
                  <Input value={item.label} onChange={(e) => setEmergencyInfos((prev) => prev.map((p) => p.id === item.id ? { ...p, label: e.target.value } : p))} />
                  <Input value={item.phone} onChange={(e) => setEmergencyInfos((prev) => prev.map((p) => p.id === item.id ? { ...p, phone: e.target.value } : p))} />
                  <Input value={item.email} onChange={(e) => setEmergencyInfos((prev) => prev.map((p) => p.id === item.id ? { ...p, email: e.target.value } : p))} />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!canEdit || saving} onClick={() => mutate(async () => {
                      const updated = await request<EmergencyInfo>('/api/admin/emergency', { method: 'PUT', body: JSON.stringify(item) })
                      setEmergencyInfos((prev) => prev.map((p) => p.id === updated.id ? updated : p))
                    })}><Save className="w-3.5 h-3.5 mr-1" />Save</Button>
                    <Button size="sm" variant="destructive" disabled={!canEdit || saving} onClick={() => mutate(async () => {
                      await request('/api/admin/emergency', { method: 'DELETE', body: JSON.stringify({ id: item.id }) })
                      setEmergencyInfos((prev) => prev.filter((p) => p.id !== item.id))
                    })}><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-dashed border-border p-3 space-y-2">
                <Input value={newEmergency.label} onChange={(e) => setNewEmergency((p) => ({ ...p, label: e.target.value }))} placeholder="Label" />
                <Input value={newEmergency.phone} onChange={(e) => setNewEmergency((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                <Input value={newEmergency.email} onChange={(e) => setNewEmergency((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
                <Button size="sm" className="gap-1.5" disabled={!canEdit || saving} onClick={() => mutate(async () => {
                  const created = await request<EmergencyInfo>('/api/admin/emergency', { method: 'POST', body: JSON.stringify(newEmergency) })
                  setEmergencyInfos((prev) => [...prev, created])
                  setNewEmergency({ label: 'Emergency contact', phone: '', email: '' })
                })}><Plus className="w-3.5 h-3.5" />Add Emergency Info</Button>
              </div>
            </CardContent>
            </Card>

            <Card id="section-team" className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Team</CardTitle>
              <CardDescription>Staff accounts use Supabase login. Invite and manage users on the Team Access page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm">
                {teams.map((member) => (
                  <li key={member.userId} className="rounded-2xl border border-border px-3 py-2 flex flex-wrap justify-between gap-2">
                    <span className="font-medium">{member.email}</span>
                    <span className="text-muted-foreground">{member.isOwner ? 'Owner' : 'Team'}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/team">Open Team Access</Link>
              </Button>
            </CardContent>
            </Card>

            <Card id="section-cities" className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPinned className="w-5 h-5" />Cities</CardTitle>
              <CardDescription>Add and maintain city list used by buildings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {cities.map((city) => (
                <div key={city.id} className="rounded-2xl border border-border p-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                  <Input value={city.name} onChange={(e) => setCities((prev) => prev.map((p) => p.id === city.id ? { ...p, name: e.target.value } : p))} />
                  <Input value={city.country} onChange={(e) => setCities((prev) => prev.map((p) => p.id === city.id ? { ...p, country: e.target.value } : p))} />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!canEdit || saving} onClick={() => mutate(async () => {
                      const updated = await request<City>('/api/admin/cities', { method: 'PUT', body: JSON.stringify(city) })
                      setCities((prev) => prev.map((p) => p.id === updated.id ? updated : p))
                    })}>Save</Button>
                    <Button size="sm" variant="destructive" disabled={!canEdit || saving} onClick={() => mutate(async () => {
                      await request('/api/admin/cities', { method: 'DELETE', body: JSON.stringify({ id: city.id }) })
                      setCities((prev) => prev.filter((p) => p.id !== city.id))
                    })}>Delete</Button>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-dashed border-border p-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                <Input value={newCityName} onChange={(e) => setNewCityName(e.target.value)} placeholder="City name" />
                <Input value={newCityCountry} onChange={(e) => setNewCityCountry(e.target.value)} placeholder="Country" />
                <Button size="sm" className="gap-1.5" disabled={!canEdit || saving} onClick={() => mutate(async () => {
                  const created = await request<City>('/api/admin/cities', { method: 'POST', body: JSON.stringify({ name: newCityName, country: newCityCountry }) })
                  setCities((prev) => [...prev, created])
                  setNewCityName('')
                })}><Plus className="w-3.5 h-3.5" />Add</Button>
              </div>
            </CardContent>
            </Card>

            <Card id="section-buildings" className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5" />Buildings</CardTitle>
              <CardDescription>Creating a building auto-generates guide sections (wifi, check-in, parking, security, emergency, cleaning).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {buildings.map((building) => (
                <div key={building.id} className="rounded-2xl border border-border p-3 space-y-2">
                  <Input value={building.name} onChange={(e) => setBuildings((prev) => prev.map((p) => p.id === building.id ? { ...p, name: e.target.value } : p))} />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Input value={building.address} onChange={(e) => setBuildings((prev) => prev.map((p) => p.id === building.id ? { ...p, address: e.target.value } : p))} />
                    <Input value={building.city} onChange={(e) => setBuildings((prev) => prev.map((p) => p.id === building.id ? { ...p, city: e.target.value } : p))} />
                    <Input value={building.country} onChange={(e) => setBuildings((prev) => prev.map((p) => p.id === building.id ? { ...p, country: e.target.value } : p))} />
                    <Input value={building.imageUrl} onChange={(e) => setBuildings((prev) => prev.map((p) => p.id === building.id ? { ...p, imageUrl: e.target.value } : p))} />
                    <Input value={building.emergencyPhone} onChange={(e) => setBuildings((prev) => prev.map((p) => p.id === building.id ? { ...p, emergencyPhone: e.target.value } : p))} />
                    <Input value={building.supportEmail} onChange={(e) => setBuildings((prev) => prev.map((p) => p.id === building.id ? { ...p, supportEmail: e.target.value } : p))} />
                  </div>
                  <Textarea value={building.welcomeMessage} onChange={(e) => setBuildings((prev) => prev.map((p) => p.id === building.id ? { ...p, welcomeMessage: e.target.value } : p))} rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!canEdit || saving} onClick={() => mutate(async () => {
                      const updated = await request<BuildingType>('/api/admin/buildings', { method: 'PUT', body: JSON.stringify(building) })
                      setBuildings((prev) => prev.map((p) => p.id === updated.id ? updated : p))
                    })}>Save</Button>
                    <Button size="sm" variant="destructive" disabled={!canEdit || saving} onClick={() => mutate(async () => {
                      await request('/api/admin/buildings', { method: 'DELETE', body: JSON.stringify({ id: building.id }) })
                      setBuildings((prev) => prev.filter((p) => p.id !== building.id))
                      if (selectedBuildingId === building.id) setSelectedBuildingId('')
                    })}>Delete</Button>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-dashed border-border p-3 space-y-2">
                <Input placeholder="Building name" value={newBuilding.name} onChange={(e) => setNewBuilding((p) => ({ ...p, name: e.target.value }))} />
                <div className="grid sm:grid-cols-2 gap-2">
                  <Input placeholder="Address" value={newBuilding.address} onChange={(e) => setNewBuilding((p) => ({ ...p, address: e.target.value }))} />
                  <Input placeholder="City" value={newBuilding.city} onChange={(e) => setNewBuilding((p) => ({ ...p, city: e.target.value }))} />
                  <Input placeholder="Country" value={newBuilding.country} onChange={(e) => setNewBuilding((p) => ({ ...p, country: e.target.value }))} />
                  <Input placeholder="Image URL" value={newBuilding.imageUrl} onChange={(e) => setNewBuilding((p) => ({ ...p, imageUrl: e.target.value }))} />
                  <Input placeholder="Emergency phone" value={newBuilding.emergencyPhone} onChange={(e) => setNewBuilding((p) => ({ ...p, emergencyPhone: e.target.value }))} />
                  <Input placeholder="Support email" value={newBuilding.supportEmail} onChange={(e) => setNewBuilding((p) => ({ ...p, supportEmail: e.target.value }))} />
                </div>
                <Textarea placeholder="Welcome message" rows={2} value={newBuilding.welcomeMessage} onChange={(e) => setNewBuilding((p) => ({ ...p, welcomeMessage: e.target.value }))} />
                <Button className="gap-1.5" size="sm" disabled={!canEdit || saving} onClick={() => mutate(async () => {
                  const created = await request<BuildingType>('/api/admin/buildings', { method: 'POST', body: JSON.stringify(newBuilding) })
                  setBuildings((prev) => [...prev, created])
                  setSelectedBuildingId(created.id)
                  setNewBuilding({
                    name: '',
                    address: '',
                    city: '',
                    appPath: '',
                    country: 'Switzerland',
                    imageUrl: '/images/buildings/kannenfeldstrasse.jpg',
                    emergencyPhone: '',
                    supportEmail: '',
                    welcomeMessage: '',
                  })
                })}><Plus className="w-3.5 h-3.5" />Add Building</Button>
              </div>
            </CardContent>
            </Card>
          </div>

          <Card id="section-guide" className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Hotel className="w-5 h-5" />Building Guide Sections</CardTitle>
              <CardDescription>
                Edit guide content for one building at a time. You can fully edit intro, alert, and JSON sections payload.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-[260px_1fr] gap-4 items-end">
                <div className="space-y-2">
                  <Label>Select building</Label>
                  <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                    <SelectTrigger><SelectValue placeholder="Select building" /></SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedBuilding ? `Editing: ${selectedBuilding.name}` : 'Select a building to edit sections.'}
                </p>
              </div>

              {sections.map((section) => (
                <div key={section.category.slug} className="rounded-2xl border border-border p-4 space-y-3">
                  <div className="grid md:grid-cols-4 gap-2">
                    <Input value={section.category.title} onChange={(e) => setSections((prev) => prev.map((p) => p.category.slug === section.category.slug ? { ...p, category: { ...p.category, title: e.target.value } } : p))} placeholder="Title" />
                    <Input value={section.category.subtitle} onChange={(e) => setSections((prev) => prev.map((p) => p.category.slug === section.category.slug ? { ...p, category: { ...p.category, subtitle: e.target.value } } : p))} placeholder="Subtitle" />
                    <Input value={section.category.icon} onChange={(e) => setSections((prev) => prev.map((p) => p.category.slug === section.category.slug ? { ...p, category: { ...p.category, icon: e.target.value } } : p))} placeholder="Icon" />
                    <Select value={section.category.color} onValueChange={(value: Category['color']) => setSections((prev) => prev.map((p) => p.category.slug === section.category.slug ? { ...p, category: { ...p.category, color: value } } : p))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">primary</SelectItem>
                        <SelectItem value="accent">accent</SelectItem>
                        <SelectItem value="muted">muted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea value={section.content.intro} onChange={(e) => setSections((prev) => prev.map((p) => p.category.slug === section.category.slug ? { ...p, content: { ...p.content, intro: e.target.value } } : p))} rows={2} placeholder="Intro text" />
                  <Textarea
                    value={JSON.stringify(section.content.sections, null, 2)}
                    onChange={(e) => {
                      setSections((prev) => prev.map((p) => {
                        if (p.category.slug !== section.category.slug) return p
                        try {
                          const parsed = JSON.parse(e.target.value) as ContentSection[]
                          return { ...p, content: { ...p.content, sections: parsed } }
                        } catch {
                          return p
                        }
                      }))
                    }}
                    rows={8}
                    placeholder="Sections JSON"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!canEdit || saving || !selectedBuildingId} onClick={() => mutate(async () => {
                      await request(`/api/admin/buildings/${selectedBuildingId}/sections`, {
                        method: 'PUT',
                        body: JSON.stringify({
                          slug: section.category.slug,
                          title: section.category.title,
                          subtitle: section.category.subtitle,
                          icon: section.category.icon,
                          color: section.category.color,
                          intro: section.content.intro,
                          sections: section.content.sections,
                        }),
                      })
                    })}>Save Section</Button>
                    <Button size="sm" variant="destructive" disabled={!canEdit || saving || !selectedBuildingId} onClick={() => mutate(async () => {
                      await request(`/api/admin/buildings/${selectedBuildingId}/sections`, {
                        method: 'DELETE',
                        body: JSON.stringify({ slug: section.category.slug }),
                      })
                      setSections((prev) => prev.filter((p) => p.category.slug !== section.category.slug))
                    })}>Delete Section</Button>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-dashed border-border p-4 space-y-2">
                <p className="font-medium text-sm">Add new section</p>
                <div className="grid md:grid-cols-3 gap-2">
                  <Input placeholder="Slug (ex: wifi)" value={newSection.slug} onChange={(e) => setNewSection((p) => ({ ...p, slug: e.target.value }))} />
                  <Input placeholder="Title" value={newSection.title} onChange={(e) => setNewSection((p) => ({ ...p, title: e.target.value }))} />
                  <Input placeholder="Subtitle" value={newSection.subtitle} onChange={(e) => setNewSection((p) => ({ ...p, subtitle: e.target.value }))} />
                  <Input placeholder="Icon" value={newSection.icon} onChange={(e) => setNewSection((p) => ({ ...p, icon: e.target.value }))} />
                  <Select value={newSection.color} onValueChange={(value: Category['color']) => setNewSection((p) => ({ ...p, color: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">primary</SelectItem>
                      <SelectItem value="accent">accent</SelectItem>
                      <SelectItem value="muted">muted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea placeholder="Intro" rows={2} value={newSection.intro} onChange={(e) => setNewSection((p) => ({ ...p, intro: e.target.value }))} />
                <Textarea placeholder="Sections JSON" rows={6} value={newSection.sectionsJson} onChange={(e) => setNewSection((p) => ({ ...p, sectionsJson: e.target.value }))} />
                <Button size="sm" className="gap-1.5" disabled={!canEdit || saving || !selectedBuildingId} onClick={() => mutate(async () => {
                  const parsed = JSON.parse(newSection.sectionsJson) as ContentSection[]
                  const created = await request<BuildingSectionRecord>(`/api/admin/buildings/${selectedBuildingId}/sections`, {
                    method: 'POST',
                    body: JSON.stringify({
                      slug: newSection.slug || newSection.title,
                      title: newSection.title || newSection.slug,
                      subtitle: newSection.subtitle,
                      icon: newSection.icon,
                      color: newSection.color,
                      intro: newSection.intro,
                      sections: parsed,
                    }),
                  })
                  setSections((prev) => [...prev, created])
                  setNewSection({
                    slug: '',
                    title: '',
                    subtitle: '',
                    icon: 'BookOpen',
                    color: 'primary',
                    intro: '',
                    sectionsJson: '[]',
                  })
                })}><Plus className="w-3.5 h-3.5" />Add Section</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
