'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Hotel } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import { BlockCanvas } from '@/components/admin/builder/block-canvas'
import { BlockInspector } from '@/components/admin/builder/block-inspector'
import { BlockToolbar } from '@/components/admin/builder/block-toolbar'
import { PreviewToggle } from '@/components/admin/builder/preview-toggle'
import { SectionListPanel } from '@/components/admin/builder/section-list-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
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

  const { email, canManageTeam, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [sections, setSections] = useState<BuildingSectionRecord[]>([])
  const [activeSectionSlug, setActiveSectionSlug] = useState<string | null>(null)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [newSectionName, setNewSectionName] = useState('')
  const [preview, setPreview] = useState(false)
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
        setActiveSectionSlug(sectionsData[0]?.category.slug ?? null)
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
  const activeSection = useMemo(
    () => sections.find((section) => section.category.slug === activeSectionSlug) ?? null,
    [sections, activeSectionSlug]
  )
  const activeBlock = useMemo(
    () =>
      activeSection?.content.sections.find((section) => (section.blockId ?? section.id) === activeBlockId) ??
      null,
    [activeSection, activeBlockId]
  )

  function slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function moveSection(slug: string, direction: 'up' | 'down') {
    setSections((prev) => {
      const currentIndex = prev.findIndex((item) => item.category.slug === slug)
      if (currentIndex < 0) return prev
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (targetIndex < 0 || targetIndex >= prev.length) return prev
      const next = [...prev]
      const [removed] = next.splice(currentIndex, 1)
      next.splice(targetIndex, 0, removed)
      return next.map((item, index) => ({
        ...item,
        category: { ...item.category, order: index + 1 },
      }))
    })
  }

  function moveSectionTo(sectionSlug: string, targetSlug: string) {
    setSections((prev) => {
      const sourceIndex = prev.findIndex((item) => item.category.slug === sectionSlug)
      const targetIndex = prev.findIndex((item) => item.category.slug === targetSlug)
      if (sourceIndex < 0 || targetIndex < 0) return prev
      const next = [...prev]
      const [removed] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, removed)
      return next.map((item, index) => ({
        ...item,
        category: { ...item.category, order: index + 1 },
      }))
    })
  }

  function moveBlock(blockId: string, direction: 'up' | 'down') {
    if (!activeSectionSlug) return
    setSections((prev) =>
      prev.map((section) => {
        if (section.category.slug !== activeSectionSlug) return section
        const blocks = [...section.content.sections]
        const currentIndex = blocks.findIndex((item) => (item.blockId ?? item.id) === blockId)
        if (currentIndex < 0) return section
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
        if (targetIndex < 0 || targetIndex >= blocks.length) return section
        const [removed] = blocks.splice(currentIndex, 1)
        blocks.splice(targetIndex, 0, removed)
        return { ...section, content: { ...section.content, sections: blocks } }
      })
    )
  }

  function moveBlockTo(sourceBlockId: string, targetBlockId: string) {
    if (!activeSectionSlug) return
    setSections((prev) =>
      prev.map((section) => {
        if (section.category.slug !== activeSectionSlug) return section
        const blocks = [...section.content.sections]
        const sourceIndex = blocks.findIndex((item) => (item.blockId ?? item.id) === sourceBlockId)
        const targetIndex = blocks.findIndex((item) => (item.blockId ?? item.id) === targetBlockId)
        if (sourceIndex < 0 || targetIndex < 0) return section
        const [removed] = blocks.splice(sourceIndex, 1)
        blocks.splice(targetIndex, 0, removed)
        return { ...section, content: { ...section.content, sections: blocks } }
      })
    )
  }

  function createEmptyBlock(type: ContentSection['type']): ContentSection {
    const id = `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    return {
      id,
      blockId: id,
      type,
      title: `${type[0].toUpperCase()}${type.slice(1)} block`,
      content: '',
      items: [],
    }
  }

  function saveSection(section: BuildingSectionRecord) {
    return mutate(async () => {
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
          order: section.category.order,
        }),
      })
    })
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
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>
  }

  return (
    <AdminShell userEmail={email} canManageTeam={canManageTeam} onLogout={logout}>
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
          <CardDescription>Visual builder: reorder sections, add blocks, and edit content without JSON.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Builder style editor for non-technical admins.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={!canEdit || saving}
                onClick={() =>
                  void mutate(async () => {
                    await adminRequest(`/api/admin/buildings/${buildingId}/sections`, {
                      method: 'PUT',
                      body: JSON.stringify({
                        sections: sections.map((section) => ({
                          slug: section.category.slug,
                          title: section.category.title,
                          subtitle: section.category.subtitle,
                          icon: section.category.icon,
                          color: section.category.color,
                          intro: section.content.intro,
                          sections: section.content.sections,
                          order: section.category.order,
                        })),
                      }),
                    })
                  })
                }
              >
                Save All
              </Button>
              <PreviewToggle preview={preview} onToggle={() => setPreview((p) => !p)} />
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr_320px] gap-4">
            <SectionListPanel
              sections={sections}
              activeSlug={activeSectionSlug}
              onSelect={(slug) => {
                setActiveSectionSlug(slug)
                setActiveBlockId(null)
              }}
              onReorder={moveSection}
              onDropMove={moveSectionTo}
              newSectionName={newSectionName}
              onNewSectionNameChange={setNewSectionName}
              onCreateSection={() =>
                void mutate(async () => {
                  if (!newSectionName.trim()) return
                  const slug = slugify(newSectionName)
                  const created = await adminRequest<BuildingSectionRecord>(
                    `/api/admin/buildings/${buildingId}/sections`,
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        slug,
                        title: newSectionName.trim(),
                        subtitle: 'New section',
                        icon: 'BookOpen',
                        color: 'primary',
                        intro: '',
                        sections: [],
                      }),
                    }
                  )
                  setSections((prev) => [...prev, created])
                  setActiveSectionSlug(created.category.slug)
                  setNewSectionName('')
                })
              }
            />

            <div className="space-y-3">
              {activeSection && (
                <>
                  <Textarea
                    value={activeSection.content.intro}
                    onChange={(event) =>
                      setSections((prev) =>
                        prev.map((item) =>
                          item.category.slug === activeSection.category.slug
                            ? { ...item, content: { ...item.content, intro: event.target.value } }
                            : item
                        )
                      )
                    }
                    rows={2}
                    placeholder="Section intro"
                  />

                  {!preview && (
                    <BlockToolbar
                      onAddBlock={(type) =>
                        setSections((prev) =>
                          prev.map((item) => {
                            if (item.category.slug !== activeSection.category.slug) return item
                            const nextBlock = createEmptyBlock(type)
                            return {
                              ...item,
                              content: { ...item.content, sections: [...item.content.sections, nextBlock] },
                            }
                          })
                        )
                      }
                    />
                  )}

                  <BlockCanvas
                    blocks={activeSection.content.sections}
                    activeBlockId={activeBlockId}
                    onSelectBlock={setActiveBlockId}
                    onReorderBlock={moveBlock}
                    onDropMoveBlock={moveBlockTo}
                    onDeleteBlock={(blockId) =>
                      setSections((prev) =>
                        prev.map((item) => {
                          if (item.category.slug !== activeSection.category.slug) return item
                          return {
                            ...item,
                            content: {
                              ...item.content,
                              sections: item.content.sections.filter(
                                (block) => (block.blockId ?? block.id) !== blockId
                              ),
                            },
                          }
                        })
                      )
                    }
                  />
                </>
              )}
            </div>

            <div className="space-y-3">
              {!preview && (
                <BlockInspector
                  block={activeBlock}
                  onUpdate={(patch) =>
                    setSections((prev) =>
                      prev.map((item) => {
                        if (item.category.slug !== activeSectionSlug) return item
                        return {
                          ...item,
                          content: {
                            ...item.content,
                            sections: item.content.sections.map((block) =>
                              (block.blockId ?? block.id) === activeBlockId ? { ...block, ...patch } : block
                            ),
                          },
                        }
                      })
                    )
                  }
                />
              )}
              <Button
                className="w-full"
                disabled={!canEdit || saving || !activeSection}
                onClick={() => {
                  if (!activeSection) return
                  void saveSection(activeSection)
                }}
              >
                Save Active Section
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                disabled={!canEdit || saving || !activeSection}
                onClick={() => setDeletingSectionSlug(activeSection?.category.slug ?? null)}
              >
                Delete Active Section
              </Button>
            </div>
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
