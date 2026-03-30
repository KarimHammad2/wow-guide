'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Hotel, Plus } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog'
import type { Building, Category, ContentSection } from '@/lib/data'

type BuildingSectionRecord = {
  category: Category
  content: {
    intro: string
    alert?: { type: 'info' | 'warning' | 'success' | 'danger'; message: string }
    sections: ContentSection[]
  }
}

export default function BuildingSectionsPage() {
  const params = useParams<{ id: string }>()
  const buildingId = params.id

  const { access, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [sections, setSections] = useState<BuildingSectionRecord[]>([])
  const [newSection, setNewSection] = useState({
    slug: '',
    title: '',
    subtitle: '',
    icon: 'BookOpen',
    color: 'primary' as Category['color'],
    intro: '',
    sectionsJson: '[]',
  })
  const [deletingSectionSlug, setDeletingSectionSlug] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !buildingId) return
    void Promise.all([
      adminRequest<Building[]>('/api/admin/buildings'),
      adminRequest<BuildingSectionRecord[]>(`/api/admin/buildings/${buildingId}/sections`),
    ])
      .then(([buildingsData, sectionsData]) => {
        setBuildings(buildingsData)
        setSections(sectionsData)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load sections data'
        setError(message)
      })
  }, [buildingId, loading, setError])

  const building = useMemo(
    () => buildings.find((item) => item.id === buildingId),
    [buildings, buildingId]
  )

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
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>
  }

  return (
    <AdminShell
      access={access}
      onLogout={logout}
      summary={[
        { label: 'Building', value: building?.name ?? buildingId },
        { label: 'Sections', value: sections.length },
      ]}
    >
      <ModuleHeader
        title="Building Guide Sections"
        description="Edit all guide categories and content for this building."
        actions={
          <Link href="/admin/buildings">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Buildings
            </Button>
          </Link>
        }
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Hotel className="w-5 h-5" />{building?.name ?? buildingId}</CardTitle>
          <CardDescription>Update titles, intros, icons, color theme, and raw JSON sections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section) => (
            <div key={section.category.slug} className="rounded-2xl border border-border p-4 space-y-3">
              <div className="grid md:grid-cols-4 gap-2">
                <Input
                  value={section.category.title}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((p) =>
                        p.category.slug === section.category.slug
                          ? { ...p, category: { ...p.category, title: e.target.value } }
                          : p
                      )
                    )
                  }
                  placeholder="Title"
                />
                <Input
                  value={section.category.subtitle}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((p) =>
                        p.category.slug === section.category.slug
                          ? { ...p, category: { ...p.category, subtitle: e.target.value } }
                          : p
                      )
                    )
                  }
                  placeholder="Subtitle"
                />
                <Input
                  value={section.category.icon}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((p) =>
                        p.category.slug === section.category.slug
                          ? { ...p, category: { ...p.category, icon: e.target.value } }
                          : p
                      )
                    )
                  }
                  placeholder="Icon"
                />
                <Select
                  value={section.category.color}
                  onValueChange={(value: Category['color']) =>
                    setSections((prev) =>
                      prev.map((p) =>
                        p.category.slug === section.category.slug
                          ? { ...p, category: { ...p.category, color: value } }
                          : p
                      )
                    )
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">primary</SelectItem>
                    <SelectItem value="accent">accent</SelectItem>
                    <SelectItem value="muted">muted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                value={section.content.intro}
                onChange={(e) =>
                  setSections((prev) =>
                    prev.map((p) =>
                      p.category.slug === section.category.slug
                        ? { ...p, content: { ...p.content, intro: e.target.value } }
                        : p
                    )
                  )
                }
                rows={2}
                placeholder="Intro text"
              />

              <Textarea
                value={JSON.stringify(section.content.sections, null, 2)}
                onChange={(e) => {
                  setSections((prev) =>
                    prev.map((p) => {
                      if (p.category.slug !== section.category.slug) return p
                      try {
                        const parsed = JSON.parse(e.target.value) as ContentSection[]
                        return { ...p, content: { ...p.content, sections: parsed } }
                      } catch {
                        return p
                      }
                    })
                  )
                }}
                rows={8}
                placeholder="Sections JSON"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!canEdit || saving}
                  onClick={() =>
                    mutate(async () => {
                      await adminRequest(`/api/admin/buildings/${buildingId}/sections`, {
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
                    })
                  }
                >
                  Save Section
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!canEdit || saving}
                  onClick={() => setDeletingSectionSlug(section.category.slug)}
                >
                  Delete Section
                </Button>
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
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!canEdit || saving}
              onClick={() =>
                mutate(async () => {
                  const parsed = JSON.parse(newSection.sectionsJson) as ContentSection[]
                  const created = await adminRequest<BuildingSectionRecord>(`/api/admin/buildings/${buildingId}/sections`, {
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
                })
              }
            >
              <Plus className="w-3.5 h-3.5" />
              Add Section
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={Boolean(deletingSectionSlug)}
        onOpenChange={(open) => {
          if (!open) setDeletingSectionSlug(null)
        }}
        title="Delete section?"
        description="This action cannot be undone."
        disabled={saving}
        onConfirm={() => {
          if (!deletingSectionSlug) return
          void mutate(async () => {
            await adminRequest(`/api/admin/buildings/${buildingId}/sections`, {
              method: 'DELETE',
              body: JSON.stringify({ slug: deletingSectionSlug }),
            })
            setSections((prev) => prev.filter((p) => p.category.slug !== deletingSectionSlug))
            setDeletingSectionSlug(null)
          })
        }}
      />
    </AdminShell>
  )
}
