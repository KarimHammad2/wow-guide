'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, ChevronsLeft, ChevronsRight, Eye, Save, Upload } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import { getEditorDocument, publishEditorDocument, saveEditorDocument } from '@/components/editor/editor-api'
import { LiveCanvas } from '@/components/editor/live-canvas'
import {
  createDefaultBlock,
  normalizeEditorDocument,
  useVisualGuideLiveDocumentHandlers,
} from '@/components/editor/use-visual-guide-live-document'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RichTextBlockEditor } from '@/components/editor/rich-text-block-editor'
import { ListBlockItemsField } from '@/components/admin/builder/list-block-items-field'
import {
  sectionsFromVisualDocument,
  visualListItemsFromEditorRows,
  visualListItemsToEditorRows,
  type VisualBlock,
  type VisualGuideDocument,
} from '@/lib/visual-builder-schema'
import type { Building, ContentSection } from '@/lib/data'
import type { BuildingGuideCategory, ContentInheritance } from '@/lib/admin-types'
import { toast } from '@/hooks/use-toast'

const FONT_CHOICES = ['Inter', 'Poppins', 'Montserrat', 'Lora', 'Merriweather', 'JetBrains Mono']
const MEDIA_FIT_CHOICES = [
  { value: 'auto', label: 'Auto (show full image)' },
  { value: 'contain', label: 'Contain (no crop)' },
  { value: 'cover', label: 'Cover (fill frame)' },
] as const
const DEFAULT_BUTTON_COLOR = '#0f172a'
const INHERITANCE_NONE = '__none__'
const INHERITANCE_CATEGORY_PICK = '__category_pick__'

function getReadableTextColor(hexColor: string) {
  const normalized = hexColor.trim().replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(normalized) && !/^[0-9a-f]{3}$/i.test(normalized)) return '#ffffff'
  const expanded =
    normalized.length === 3 ? normalized.split('').map((char) => `${char}${char}`).join('') : normalized
  const value = Number.parseInt(expanded, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  const luminance = (r * 299 + g * 587 + b * 114) / 1000
  return luminance >= 160 ? '#111827' : '#ffffff'
}

export default function CategoryVisualEditorPage() {
  const params = useParams<{ buildingId: string; categorySlug: string }>()
  const buildingId = params.buildingId
  const categorySlug = params.categorySlug
  const { email, canManageTeam, loading, error, setError, logout } = useAdminSession()

  const [document, setDocument] = useState<VisualGuideDocument | null>(null)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [publishing, setPublishing] = useState(false)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [contentInheritance, setContentInheritance] = useState<ContentInheritance | null | undefined>(undefined)
  const [sourceInheritanceAvailable, setSourceInheritanceAvailable] = useState(true)
  const [inheritanceHydrated, setInheritanceHydrated] = useState(false)
  const [sourceCategoryOptions, setSourceCategoryOptions] = useState<BuildingGuideCategory[]>([])
  const [inheritSourceBuilding, setInheritSourceBuilding] = useState<string>(INHERITANCE_NONE)
  const [inheritSourceCategory, setInheritSourceCategory] = useState<string>(INHERITANCE_NONE)

  const contentInheritanceRef = useRef<ContentInheritance | null | undefined>(undefined)
  const inheritanceHydratedRef = useRef(false)
  useEffect(() => {
    contentInheritanceRef.current = contentInheritance
    inheritanceHydratedRef.current = inheritanceHydrated
  }, [contentInheritance, inheritanceHydrated])

  const activeBlock = useMemo(
    () => document?.blocks.find((block) => block.id === activeBlockId) ?? null,
    [document, activeBlockId]
  )

  useLayoutEffect(() => {
    if (!activeBlockId) return
    const id = activeBlockId
    requestAnimationFrame(() => {
      const safe = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id
      const el = globalThis.document?.querySelector(`[data-editor-block-id="${safe}"]`)
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
      }
    })
  }, [activeBlockId])
  const building = useMemo(
    () => buildings.find((item) => item.id === buildingId) ?? null,
    [buildings, buildingId]
  )
  const sections = useMemo<ContentSection[]>(
    () => (document ? sectionsFromVisualDocument(document) : []),
    [document]
  )

  const {
    mediaUploadState,
    mediaUploadMessage,
    patchSectionFromCanvas,
    moveBlockDirection,
    reorderToIndex,
    duplicateBlock,
    insertBlock,
    deleteBlock,
    dropBlockOnBlock,
    applyMediaFile,
    removeBlockSideImage,
    removeMedia,
    addBlock,
    getBlockById,
    updateBlock,
    updateBlockStyles,
  } = useVisualGuideLiveDocumentHandlers(document, setDocument, setActiveBlockId)

  /** Public guest guide URL for this category (same route as end users). */
  const publicCategoryHref = useMemo(() => {
    const raw = building?.appPath?.trim() ?? ''
    let base = ''
    if (/^\/[a-z0-9-]+$/i.test(raw)) {
      base = raw
    } else {
      const legacy = raw.match(/^\/building\/([a-z0-9-]+)$/i)
      if (legacy) base = `/${legacy[1]}`
    }
    if (!base) base = `/${buildingId}`
    return `${base}/category/${categorySlug}`
  }, [building?.appPath, buildingId, categorySlug])

  useEffect(() => {
    if (loading || !buildingId || !categorySlug) return
    void Promise.all([adminRequest<Building[]>('/api/admin/buildings'), getEditorDocument(buildingId, categorySlug)])
      .then(([buildingsData, data]) => {
        setBuildings(buildingsData)
        setDocument(normalizeEditorDocument(data.document))
        setActiveBlockId(data.document.blocks[0]?.id ?? null)
        setContentInheritance(data.contentInheritance)
        setSourceInheritanceAvailable(data.sourceInheritanceAvailable)
        setInheritSourceBuilding(data.contentInheritance?.sourceBuildingId ?? INHERITANCE_NONE)
        setInheritSourceCategory(
          data.contentInheritance?.sourceCategorySlug
            ? data.contentInheritance.sourceCategorySlug
            : data.contentInheritance?.sourceBuildingId
              ? INHERITANCE_CATEGORY_PICK
              : INHERITANCE_NONE
        )
        setInheritanceHydrated(true)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load editor')
      })
  }, [loading, buildingId, categorySlug, setError])

  const sourceForCategories =
    inheritSourceBuilding && inheritSourceBuilding !== INHERITANCE_NONE ? inheritSourceBuilding : null
  useEffect(() => {
    if (!sourceForCategories) {
      setSourceCategoryOptions([])
      return
    }
    void adminRequest<BuildingGuideCategory[]>(`/api/admin/categories?buildingId=${encodeURIComponent(sourceForCategories)}`)
      .then((rows) => setSourceCategoryOptions(rows))
      .catch(() => setSourceCategoryOptions([]))
  }, [sourceForCategories])

  useEffect(() => {
    if (!document) return
    setHasPendingChanges(true)
    setSaveState('saving')
    const timeout = setTimeout(() => {
      const inh = contentInheritanceRef.current
      const hy = inheritanceHydratedRef.current
      void saveEditorDocument(
        buildingId,
        categorySlug,
        document,
        hy ? (inh === undefined ? null : inh) : undefined
      )
        .then((res) => {
          if (res.contentInheritance !== undefined) {
            setContentInheritance(res.contentInheritance)
            setSourceInheritanceAvailable(res.sourceInheritanceAvailable)
          }
          setSaveState('saved')
          setHasPendingChanges(false)
        })
        .catch(() => setSaveState('error'))
    }, 900)
    return () => clearTimeout(timeout)
  }, [document, buildingId, categorySlug])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingChanges && saveState !== 'error') return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasPendingChanges, saveState])

  const filteredSourceCategories = useMemo(
    () =>
      sourceCategoryOptions.filter(
        (row) => row.category.slug !== categorySlug || inheritSourceBuilding !== buildingId
      ),
    [sourceCategoryOptions, categorySlug, inheritSourceBuilding, buildingId]
  )

  async function applyInheritanceMetadata(next: ContentInheritance | null) {
    if (!document) return
    setError(null)
    setSaveState('saving')
    try {
      await saveEditorDocument(buildingId, categorySlug, document, next)
      const r = await getEditorDocument(buildingId, categorySlug)
      setDocument(normalizeEditorDocument(r.document))
      setContentInheritance(r.contentInheritance)
      setInheritSourceBuilding(r.contentInheritance?.sourceBuildingId ?? INHERITANCE_NONE)
      setInheritSourceCategory(
        r.contentInheritance?.sourceCategorySlug
          ? r.contentInheritance.sourceCategorySlug
          : r.contentInheritance?.sourceBuildingId
            ? INHERITANCE_CATEGORY_PICK
            : INHERITANCE_NONE
      )
      setSourceInheritanceAvailable(r.sourceInheritanceAvailable)
      setSaveState('saved')
    } catch (e) {
      setSaveState('error')
      setError(e instanceof Error ? e.message : 'Failed to update inheritance')
    }
  }

  function onInheritSourceBuilding(v: string) {
    setInheritSourceBuilding(v)
    if (v === INHERITANCE_NONE) {
      setInheritSourceCategory(INHERITANCE_NONE)
      void applyInheritanceMetadata(null)
      return
    }
    setInheritSourceCategory(INHERITANCE_CATEGORY_PICK)
  }

  function onInheritSourceCategory(v: string) {
    if (v === INHERITANCE_NONE || v === INHERITANCE_CATEGORY_PICK) return
    if (inheritSourceBuilding === INHERITANCE_NONE) return
    if (inheritSourceBuilding === buildingId && v === categorySlug) {
      setError('A category cannot inherit from itself.')
      return
    }
    setInheritSourceCategory(v)
    void applyInheritanceMetadata({ sourceBuildingId: inheritSourceBuilding, sourceCategorySlug: v })
  }

  async function publish() {
    if (!document) return
    setPublishing(true)
    setError(null)
    try {
      await saveEditorDocument(
        buildingId,
        categorySlug,
        document,
        inheritanceHydrated ? (contentInheritance === undefined ? null : contentInheritance) : undefined
      )
      await publishEditorDocument(buildingId, categorySlug)
      setSaveState('saved')
      setHasPendingChanges(false)
      const place = building?.name
        ? `${building.name} · ${categorySlug.replace(/-/g, ' ')}`
        : categorySlug.replace(/-/g, ' ')
      toast({
        className:
          'border-emerald-500/35 bg-emerald-50/95 text-emerald-950 shadow-md dark:border-emerald-500/40 dark:bg-emerald-950/55 dark:text-emerald-50',
        title: 'Published',
        description: `${place} is live for guests. Open Preview to see the public page.`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publish failed'
      setError(message)
      toast({
        variant: 'destructive',
        title: 'Could not publish',
        description: message,
      })
    } finally {
      setPublishing(false)
    }
  }

  if (loading || !document) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading editor...</div>
  }

  return (
    <AdminShell userEmail={email} canManageTeam={canManageTeam} onLogout={logout}>
      <ModuleHeader
        title={`Visual Builder · ${building?.name ?? buildingId} · ${categorySlug}`}
        description="Single live canvas: drag blocks in-place on the rendered page."
        actions={
          <div className="flex w-full max-w-full flex-wrap gap-2 sm:w-auto sm:max-w-none sm:justify-end">
            <Link href="/admin/categories" className="min-w-0 flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button asChild variant="outline" className="min-w-0 flex-1 gap-2 sm:flex-initial sm:w-auto">
              <Link href={publicCategoryHref} target="_blank" rel="noopener noreferrer" className="inline-flex w-full justify-center sm:w-auto">
                <Eye className="h-4 w-4" />
                Preview
              </Link>
            </Button>
            <Button variant="outline" disabled={saveState === 'saving'} className="min-w-0 flex-1 gap-2 sm:flex-initial sm:w-auto">
              <Save className="h-4 w-4" />
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Draft'}
            </Button>
            <Button onClick={() => void publish()} disabled={publishing} className="min-w-0 flex-1 sm:flex-initial sm:w-auto">
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        }
      />

      {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <Card className="rounded-3xl border-dashed">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-base">Content inheritance</CardTitle>
          <CardDescription>
            Merge the latest page from another building and category. Same block id overrides the source. New source blocks
            appear automatically. You can still add and edit blocks here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-xs text-muted-foreground">Source building</p>
            <Select value={inheritSourceBuilding} onValueChange={onInheritSourceBuilding}>
              <SelectTrigger className="w-full min-w-0 sm:max-w-md">
                <SelectValue placeholder="No inheritance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={INHERITANCE_NONE}>No inheritance</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                    {b.city ? ` — ${b.city}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-xs text-muted-foreground">Source category</p>
            <Select
              value={
                inheritSourceBuilding === INHERITANCE_NONE
                  ? INHERITANCE_NONE
                  : inheritSourceCategory === INHERITANCE_NONE || inheritSourceCategory === INHERITANCE_CATEGORY_PICK
                    ? INHERITANCE_CATEGORY_PICK
                    : inheritSourceCategory
              }
              onValueChange={onInheritSourceCategory}
              disabled={inheritSourceBuilding === INHERITANCE_NONE}
            >
              <SelectTrigger className="w-full min-w-0 sm:max-w-md">
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={INHERITANCE_CATEGORY_PICK} disabled>
                  {inheritSourceBuilding === INHERITANCE_NONE ? 'Select a building first' : 'Choose a category…'}
                </SelectItem>
                {filteredSourceCategories.map((row) => (
                  <SelectItem key={row.category.id} value={row.category.slug}>
                    {row.category.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        {contentInheritance && !sourceInheritanceAvailable && (
          <CardContent className="pt-0">
            <p className="text-sm text-amber-800 dark:text-amber-200/90">
              The source page was not found. Showing only content saved for this building until you pick a valid source
              or clear inheritance.
            </p>
          </CardContent>
        )}
      </Card>

      <div
        className={`grid min-w-0 gap-4 ${inspectorOpen ? 'lg:grid-cols-[1fr_minmax(300px,380px)]' : 'lg:grid-cols-[1fr_56px]'}`}
      >
        <Card className="min-w-0 rounded-3xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Live Canvas</CardTitle>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                {building ? `Building: ${building.name}${building.city ? ` — ${building.city}` : ''}` : buildingId}
              </p>
              <h2 className="text-2xl font-bold tracking-tight">{categorySlug.replaceAll('-', ' ')}</h2>
              <Textarea
                rows={2}
                className="mt-2"
                placeholder="Category introduction shown before blocks"
                value={document.settings?.intro ?? ''}
                onChange={(event) =>
                  setDocument((prev) =>
                    prev
                      ? {
                          ...prev,
                          settings: {
                            ...prev.settings,
                            intro: event.target.value,
                          },
                        }
                      : prev
                  )
                }
              />
            </div>
          </CardHeader>
          <CardContent>
            <LiveCanvas
              sections={sections}
              activeBlockId={activeBlockId}
              onSelectBlock={setActiveBlockId}
              onInlinePatch={patchSectionFromCanvas}
              onMoveBlock={moveBlockDirection}
              onDeleteBlock={deleteBlock}
              onDuplicateBlock={duplicateBlock}
              onReorderToIndex={reorderToIndex}
              onInsertBlock={insertBlock}
              onResizeBlock={(blockId, next) => updateBlockStyles(blockId, { width: next.width, height: next.height })}
              onDropBlockOnBlock={dropBlockOnBlock}
              onUploadMedia={applyMediaFile}
              onRemoveBlockSideImage={removeBlockSideImage}
            />
            {document.blocks.length === 0 && (
              <div className="mt-3 text-sm text-muted-foreground">
                Add your first block directly in the canvas insertion zone.
              </div>
            )}
          </CardContent>
        </Card>

        {inspectorOpen ? (
          <Card className="gap-3 rounded-3xl py-5 lg:sticky lg:top-4 lg:z-10 lg:max-h-[calc(100vh-2rem)] lg:min-h-0 lg:overflow-hidden">
            <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 px-6 pb-0 pt-0">
              <CardTitle className="text-base">Inspector</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Hide inspector"
                title="Hide inspector"
                onClick={() => setInspectorOpen(false)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 pb-5 pt-0">
              {!activeBlock && <p className="text-sm text-muted-foreground">Select a block to edit.</p>}
              {activeBlock && (
                <>
                  <Input
                    value={activeBlock.title ?? ''}
                    placeholder="Block title"
                    onChange={(event) => updateBlock(activeBlock.id, { title: event.target.value })}
                  />
                  <Tabs
                    key={activeBlock.id}
                    defaultValue="content"
                    className="flex min-h-0 flex-1 flex-col gap-2"
                  >
                    <TabsList className="grid h-9 w-full shrink-0 grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-muted-foreground">
                      <TabsTrigger value="content" className="flex-1">
                        Content
                      </TabsTrigger>
                      <TabsTrigger value="design" className="flex-1">
                        Design
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent
                      value="content"
                      className="mt-0 min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-0.5 outline-none"
                    >
                      {activeBlock.type === 'text' ? (
                        <RichTextBlockEditor
                          surface={
                            activeBlock.styles?.textColor?.trim() ||
                            activeBlock.styles?.backgroundColor?.trim()
                              ? 'inherit'
                              : 'default'
                          }
                          value={activeBlock.richText}
                          plainFallback={activeBlock.content ?? ''}
                          editorScrollMaxClassName="max-h-[min(42vh,260px)]"
                          onChange={(json, plain) =>
                            updateBlock(activeBlock.id, { richText: json, content: plain })
                          }
                        />
                      ) : activeBlock.type === 'catalogBand' ? (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground">
                            Catalog band rows (Wi‑Fi / TV style). Optional image URL on a row shows a photo on the
                            right on larger screens.
                          </p>
                          {(activeBlock.catalogRows ?? []).map((row, idx) => (
                            <div key={`${activeBlock.id}-row-${idx}`} className="space-y-2 rounded-lg border border-border p-3">
                              <label className="text-xs text-muted-foreground">
                                Row {idx + 1} — body
                                <Textarea
                                  rows={4}
                                  className="mt-1"
                                  value={row.title}
                                  onChange={(event) => {
                                    const next = [...(activeBlock.catalogRows ?? [])]
                                    next[idx] = { ...row, title: event.target.value }
                                    updateBlock(activeBlock.id, { catalogRows: next })
                                  }}
                                />
                              </label>
                              <label className="text-xs text-muted-foreground">
                                Lucide icon name (optional)
                                <Input
                                  className="mt-1"
                                  value={row.icon ?? ''}
                                  placeholder="Wifi, Tv, …"
                                  onChange={(event) => {
                                    const next = [...(activeBlock.catalogRows ?? [])]
                                    const v = event.target.value.trim()
                                    next[idx] = { ...row, icon: v || undefined }
                                    updateBlock(activeBlock.id, { catalogRows: next })
                                  }}
                                />
                              </label>
                              <label className="text-xs text-muted-foreground">
                                Image URL (optional)
                                <Input
                                  className="mt-1"
                                  value={row.image ?? ''}
                                  placeholder="/guides/…"
                                  onChange={(event) => {
                                    const next = [...(activeBlock.catalogRows ?? [])]
                                    const v = event.target.value.trim()
                                    next[idx] = { ...row, image: v || undefined }
                                    updateBlock(activeBlock.id, { catalogRows: next })
                                  }}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Textarea
                          rows={4}
                          value={activeBlock.content ?? ''}
                          placeholder="Block content"
                          onChange={(event) => updateBlock(activeBlock.id, { content: event.target.value })}
                        />
                      )}
                      {(activeBlock.type === 'image' ||
                        activeBlock.type === 'video' ||
                        activeBlock.type === 'button' ||
                        activeBlock.type === 'link' ||
                        activeBlock.type === 'text') && (
                        <div className="space-y-1">
                          {activeBlock.type === 'image' ? (
                            <label className="text-xs text-muted-foreground">
                              Image link URL (optional)
                              <Input
                                value={activeBlock.imageLinkUrl ?? ''}
                                placeholder="https://..."
                                className="mt-1"
                                onChange={(event) =>
                                  updateBlock(activeBlock.id, { imageLinkUrl: event.target.value })
                                }
                              />
                            </label>
                          ) : (
                            <>
                              <label className="text-xs text-muted-foreground">
                                {activeBlock.type === 'text' ? 'Block link (optional)' : 'URL'}
                                <Input
                                  value={activeBlock.url ?? ''}
                                  placeholder="https://..."
                                  title={
                                    activeBlock.type === 'text'
                                      ? 'Optional: makes the whole block a link. Prefer the editor Link control for inline links inside the text.'
                                      : undefined
                                  }
                                  className="mt-1"
                                  onChange={(event) => updateBlock(activeBlock.id, { url: event.target.value })}
                                />
                              </label>
                            </>
                          )}
                        </div>
                      )}
                      {(activeBlock.type === 'image' || activeBlock.type === 'video') && (
                        <div className="space-y-2">
                          {activeBlock.type === 'image' && (
                            <label className="text-xs text-muted-foreground">
                              Image fit
                              <select
                                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={activeBlock.mediaFit ?? 'auto'}
                                onChange={(event) =>
                                  updateBlock(activeBlock.id, {
                                    mediaFit: event.target.value as 'auto' | 'contain' | 'cover',
                                  })
                                }
                              >
                                {MEDIA_FIT_CHOICES.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          {activeBlock.type === 'video' && (
                            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                              Tip: use block Width/Height to control the video frame. The video now fills that frame
                              without forcing a permanent crop behavior on your uploaded media.
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <label
                              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm ${
                                mediaUploadState === 'uploading' ? 'pointer-events-none opacity-60' : ''
                              }`}
                            >
                              <Upload className="h-4 w-4" />
                              {activeBlock.mediaUrl ? 'Replace media' : 'Upload media'}
                              <input
                                type="file"
                                className="sr-only"
                                accept={activeBlock.type === 'image' ? 'image/*' : 'video/*'}
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  event.currentTarget.value = ''
                                  if (!file) return
                                  void applyMediaFile(activeBlock.id, file)
                                }}
                              />
                            </label>
                            {activeBlock.mediaUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                disabled={mediaUploadState === 'uploading'}
                                onClick={() =>
                                  void removeMedia(activeBlock.id)
                                }
                              >
                                Remove media
                              </Button>
                            )}
                          </div>
                          {mediaUploadMessage && (
                            <p
                              className={`text-sm ${
                                mediaUploadState === 'error'
                                  ? 'text-destructive'
                                  : mediaUploadState === 'warning'
                                    ? 'text-amber-600'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {mediaUploadMessage}
                            </p>
                          )}
                          {mediaUploadState === 'uploading' && (
                            <p className="text-xs text-muted-foreground">Uploading media…</p>
                          )}
                        </div>
                      )}
                      {activeBlock.type === 'list' && (
                        <ListBlockItemsField
                          items={visualListItemsToEditorRows(activeBlock.id, activeBlock.items)}
                          onChange={(rows) =>
                            updateBlock(activeBlock.id, {
                              items: visualListItemsFromEditorRows(rows),
                            })
                          }
                        />
                      )}
                      {(activeBlock.type === 'text' || activeBlock.type === 'list') && (
                        <div className="space-y-2 rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Side image (same card as content)</p>
                          <p className="text-[11px] text-muted-foreground">
                            Drop a file on the left or right half of the block, or use upload here. Image appears beside
                            the text on larger screens; stacks on small screens.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                (activeBlock.sideImagePosition ?? 'right') === 'left' ? 'default' : 'outline'
                              }
                              className="h-8"
                              onClick={() => updateBlock(activeBlock.id, { sideImagePosition: 'left' })}
                            >
                              Image left
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                (activeBlock.sideImagePosition ?? 'right') === 'right' ? 'default' : 'outline'
                              }
                              className="h-8"
                              onClick={() => updateBlock(activeBlock.id, { sideImagePosition: 'right' })}
                            >
                              Image right
                            </Button>
                          </div>
                          <label className="text-xs text-muted-foreground">
                            Side image fit
                            <select
                              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                              value={activeBlock.sideImageFit ?? 'auto'}
                              onChange={(event) =>
                                updateBlock(activeBlock.id, {
                                  sideImageFit: event.target.value as 'auto' | 'contain' | 'cover',
                                })
                              }
                            >
                              {MEDIA_FIT_CHOICES.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-muted-foreground">Side image width (desktop)</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs tabular-nums text-foreground">
                                  {activeBlock.sideImageWidthPercent ?? 40}%
                                </span>
                                {activeBlock.sideImageWidthPercent !== undefined ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() =>
                                      updateBlock(activeBlock.id, { sideImageWidthPercent: undefined })
                                    }
                                  >
                                    Reset
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                            <Slider
                              min={5}
                              max={60}
                              step={1}
                              value={[activeBlock.sideImageWidthPercent ?? 40]}
                              onValueChange={(values) => {
                                const n = values[0] ?? 40
                                updateBlock(activeBlock.id, {
                                  sideImageWidthPercent: n === 40 ? undefined : n,
                                })
                              }}
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Share of the row used by the image on larger screens; stacks full width on mobile.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <label
                              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm ${
                                mediaUploadState === 'uploading' ? 'pointer-events-none opacity-60' : ''
                              }`}
                            >
                              <Upload className="h-4 w-4" />
                              {activeBlock.sideImageUrl ? 'Replace side image' : 'Upload side image'}
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  event.currentTarget.value = ''
                                  if (!file) return
                                  void applyMediaFile(activeBlock.id, file, {
                                    side: activeBlock.sideImagePosition ?? 'right',
                                  })
                                }}
                              />
                            </label>
                            {activeBlock.sideImageUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={mediaUploadState === 'uploading'}
                                onClick={() =>
                                  void removeBlockSideImage(activeBlock.id)
                                }
                              >
                                Remove side image
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      {activeBlock.type === 'text' && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => addBlock('text')}
                        >
                          Add another text block
                        </Button>
                      )}
                    </TabsContent>
                    <TabsContent
                      value="design"
                      className="mt-0 min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-0.5 outline-none"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-muted-foreground">
                          Text color
                          <Input
                            type="color"
                            className="mt-1 h-10 px-1"
                            value={activeBlock.styles?.textColor ?? '#222222'}
                            onChange={(event) => updateBlockStyles(activeBlock.id, { textColor: event.target.value })}
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Background
                          <Input
                            type="color"
                            className="mt-1 h-10 px-1"
                            value={activeBlock.styles?.backgroundColor ?? '#ffffff'}
                            onChange={(event) =>
                              updateBlockStyles(activeBlock.id, { backgroundColor: event.target.value })
                            }
                          />
                        </label>
                      </div>
                      {(!activeBlock.styles?.textColor?.trim() ||
                        !activeBlock.styles?.backgroundColor?.trim()) && (
                        <p className="text-xs text-muted-foreground">
                          {(!activeBlock.styles?.textColor?.trim() &&
                            !activeBlock.styles?.backgroundColor?.trim()) ? (
                            <>
                              Text and background are unset: the live guide uses the page theme. Swatches
                              show editor placeholders until you pick colors.
                            </>
                          ) : !activeBlock.styles?.textColor?.trim() ? (
                            <>Text color is unset: the live guide uses theme text until you pick a color.</>
                          ) : (
                            <>
                              Background is unset: the live guide uses the default card surface until you pick
                              a color.
                            </>
                          )}
                        </p>
                      )}
                      {activeBlock.type === 'button' && (
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-xs text-muted-foreground">
                            Button color
                            <Input
                              type="color"
                              className="mt-1 h-10 px-1"
                              value={activeBlock.buttonColor ?? DEFAULT_BUTTON_COLOR}
                              onChange={(event) =>
                                updateBlock(activeBlock.id, { buttonColor: event.target.value })
                              }
                            />
                          </label>
                          <div className="rounded-md border border-border p-3">
                            <p className="text-xs text-muted-foreground">Preview</p>
                            <div
                              className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium"
                              style={{
                                backgroundColor: activeBlock.buttonColor ?? DEFAULT_BUTTON_COLOR,
                                color: getReadableTextColor(activeBlock.buttonColor ?? DEFAULT_BUTTON_COLOR),
                              }}
                            >
                              {activeBlock.content?.trim() || 'Open'}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-muted-foreground">
                          Font size
                          <Input
                            type="number"
                            className="mt-1"
                            min={10}
                            max={72}
                            value={activeBlock.styles?.fontSize ?? 16}
                            onChange={(event) =>
                              updateBlockStyles(activeBlock.id, {
                                fontSize: Number(event.target.value || 16),
                              })
                            }
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Font family
                          <select
                            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={activeBlock.styles?.fontFamily ?? FONT_CHOICES[0]}
                            onChange={(event) =>
                              updateBlockStyles(activeBlock.id, {
                                fontFamily: event.target.value,
                              })
                            }
                          >
                            {FONT_CHOICES.map((font) => (
                              <option key={font} value={font}>
                                {font}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-muted-foreground">
                          Width
                          <Input
                            type="number"
                            className="mt-1"
                            min={120}
                            max={1400}
                            value={activeBlock.styles?.width ?? 520}
                            onChange={(event) =>
                              updateBlockStyles(activeBlock.id, {
                                width: Number(event.target.value || 520),
                              })
                            }
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Height
                          <Input
                            type="number"
                            className="mt-1"
                            min={60}
                            max={1200}
                            value={activeBlock.styles?.height ?? 140}
                            onChange={(event) =>
                              updateBlockStyles(activeBlock.id, {
                                height: Number(event.target.value || 140),
                              })
                            }
                          />
                        </label>
                      </div>
                      <div
                        className="space-y-1"
                        title="In a single column, alignment is most obvious when width is below full."
                      >
                        <p className="text-xs text-muted-foreground">Horizontal align</p>
                        <div className="flex gap-1">
                          {(['left', 'center', 'right'] as const).map((value) => (
                            <Button
                              key={value}
                              type="button"
                              size="sm"
                              variant={(activeBlock.styles?.align ?? 'left') === value ? 'default' : 'outline'}
                              className="h-8 flex-1 px-2 text-xs capitalize"
                              onClick={() => updateBlockStyles(activeBlock.id, { align: value })}
                            >
                              {value}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {(['text', 'list', 'steps', 'checklist'] as readonly string[]).includes(
                        activeBlock.type as string
                      ) && (
                        <div
                          className="space-y-1"
                          title="Centers the text block when it has extra height or a side image."
                        >
                          <p className="text-xs text-muted-foreground">Vertical align</p>
                          <div className="flex gap-1">
                            {(['top', 'center', 'bottom'] as const).map((value) => (
                              <Button
                                key={value}
                                type="button"
                                size="sm"
                                variant={(activeBlock.styles?.verticalAlign ?? 'top') === value ? 'default' : 'outline'}
                                className="h-8 flex-1 px-2 text-xs capitalize"
                                onClick={() => updateBlockStyles(activeBlock.id, { verticalAlign: value })}
                              >
                                {value}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs text-muted-foreground">
                          Margin top (px)
                          <Input
                            type="number"
                            className="mt-1"
                            min={0}
                            max={400}
                            value={activeBlock.styles?.marginTop ?? 0}
                            onChange={(event) => {
                              const raw = Math.round(Number(event.target.value) || 0)
                              const marginTop = Math.max(0, Math.min(400, raw))
                              updateBlockStyles(activeBlock.id, { marginTop })
                            }}
                          />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Margin bottom (px)
                          <Input
                            type="number"
                            className="mt-1"
                            min={0}
                            max={400}
                            value={activeBlock.styles?.marginBottom ?? 0}
                            onChange={(event) => {
                              const raw = Math.round(Number(event.target.value) || 0)
                              const marginBottom = Math.max(0, Math.min(400, raw))
                              updateBlockStyles(activeBlock.id, { marginBottom })
                            }}
                          />
                        </label>
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-3xl lg:sticky lg:top-4 lg:z-10 lg:max-h-[calc(100vh-2rem)] overflow-hidden">
            <button
              type="button"
              onClick={() => setInspectorOpen(true)}
              aria-label="Show inspector"
              title="Show inspector"
              className="flex min-h-72 w-full items-center justify-center bg-background transition-colors hover:bg-accent/40"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                <ChevronsLeft className="h-4 w-4" />
              </span>
            </button>
          </Card>
        )}
      </div>
    </AdminShell>
  )
}
