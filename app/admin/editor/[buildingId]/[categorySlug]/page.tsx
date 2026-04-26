'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, ChevronsLeft, ChevronsRight, Eye, Save, Upload } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import {
  getEditorDocument,
  deleteEditorMedia,
  publishEditorDocument,
  saveEditorDocument,
  uploadEditorMedia,
} from '@/components/editor/editor-api'
import { LiveCanvas } from '@/components/editor/live-canvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RichTextBlockEditor } from '@/components/editor/rich-text-block-editor'
import { EMPTY_RICH_TEXT_DOC } from '@/lib/tiptap/empty-doc'
import { ListBlockItemsField } from '@/components/admin/builder/list-block-items-field'
import {
  contentItemToVisualListItem,
  sectionsFromVisualDocument,
  visualListItemsFromEditorRows,
  visualListItemsToEditorRows,
  type VisualBlock,
  type VisualGuideDocument,
} from '@/lib/visual-builder-schema'
import type { Building, ContentSection } from '@/lib/data'

const FONT_CHOICES = ['Inter', 'Poppins', 'Montserrat', 'Lora', 'Merriweather', 'JetBrains Mono']
const MEDIA_FIT_CHOICES = [
  { value: 'auto', label: 'Auto (show full image)' },
  { value: 'contain', label: 'Contain (no crop)' },
  { value: 'cover', label: 'Cover (fill frame)' },
] as const

function createDefaultBlock(type: VisualBlock['type']): VisualBlock {
  const id = `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  if (type === 'catalogBand') {
    return {
      id,
      type,
      title: 'Section title',
      catalogRows: [
        { title: 'First row body text', icon: 'Wifi' },
        { title: 'Second row body text', icon: 'Tv' },
      ],
      styles: { backgroundColor: '#9b5d72', textColor: '#ffffff' },
    }
  }
  if (type === 'list') {
    return { id, type, title: 'List', items: ['First item'] }
  }
  if (type === 'button') {
    return { id, type, title: 'Call to action', content: 'Open', url: '#' }
  }
  if (type === 'link') {
    return { id, type, title: 'Useful link', content: 'Open link', url: '#' }
  }
  if (type === 'text') {
    return { id, type, title: `${type[0]?.toUpperCase()}${type.slice(1)}`, content: '', richText: EMPTY_RICH_TEXT_DOC }
  }
  return { id, type, title: `${type[0]?.toUpperCase()}${type.slice(1)}`, content: '' }
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
  const [mediaUploadState, setMediaUploadState] = useState<'idle' | 'uploading' | 'error' | 'warning'>('idle')
  const [mediaUploadMessage, setMediaUploadMessage] = useState<string | null>(null)

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
        setDocument(data.document)
        setActiveBlockId(data.document.blocks[0]?.id ?? null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load editor')
      })
  }, [loading, buildingId, categorySlug, setError])

  useEffect(() => {
    if (!document) return
    setHasPendingChanges(true)
    setSaveState('saving')
    const timeout = setTimeout(() => {
      void saveEditorDocument(buildingId, categorySlug, document)
        .then(() => {
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

  function updateBlock(blockId: string, patch: Partial<VisualBlock>) {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        blocks: prev.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
      }
    })
  }

  function updateBlockStyles(
    blockId: string,
    patch: NonNullable<VisualBlock['styles']>
  ) {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        blocks: prev.blocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                styles: {
                  ...block.styles,
                  ...patch,
                },
              }
            : block
        ),
      }
    })
  }

  function getBlockById(blockId: string) {
    return document?.blocks.find((block) => block.id === blockId) ?? null
  }

  async function applyMediaFile(
    blockId: string,
    file: File,
    options?: { side?: 'left' | 'right' }
  ) {
    const targetBlock = getBlockById(blockId)
    if (!targetBlock) {
      setMediaUploadState('error')
      setMediaUploadMessage('Block not found.')
      return
    }

    if (targetBlock.type === 'text' || targetBlock.type === 'list') {
      setMediaUploadState('uploading')
      setMediaUploadMessage(null)
      const previousUrl = targetBlock.sideImageUrl?.trim() ?? ''
      const pos = options?.side ?? targetBlock.sideImagePosition ?? 'right'
      try {
        const uploaded = await uploadEditorMedia(file)
        updateBlock(blockId, { sideImageUrl: uploaded.url, sideImagePosition: pos })
        if (previousUrl && previousUrl !== uploaded.url) {
          try {
            await deleteEditorMedia(previousUrl)
          } catch {
            setMediaUploadState('warning')
            setMediaUploadMessage('The image was replaced, but the old file could not be removed.')
            return
          }
        }
        setMediaUploadState('idle')
        setMediaUploadMessage(null)
      } catch (err) {
        setMediaUploadState('error')
        setMediaUploadMessage(err instanceof Error ? err.message : 'Upload failed')
      }
      return
    }

    if (targetBlock.type !== 'image' && targetBlock.type !== 'video') {
      setMediaUploadState('error')
      setMediaUploadMessage('Select an image or video block before uploading media.')
      return
    }

    setMediaUploadState('uploading')
    setMediaUploadMessage(null)

    const previousUrl = targetBlock.url?.trim() ?? ''

    try {
      const uploaded = await uploadEditorMedia(file)
      updateBlock(blockId, { url: uploaded.url })

      if (previousUrl && previousUrl !== uploaded.url) {
        try {
          await deleteEditorMedia(previousUrl)
        } catch {
          setMediaUploadState('warning')
          setMediaUploadMessage('The media was replaced, but the old file could not be removed.')
          return
        }
      }

      setMediaUploadState('idle')
      setMediaUploadMessage(null)
    } catch (err) {
      setMediaUploadState('error')
      setMediaUploadMessage(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  async function removeBlockSideImage(blockId: string) {
    const target = getBlockById(blockId)
    if (!target || (target.type !== 'text' && target.type !== 'list') || !target.sideImageUrl?.trim()) {
      return
    }
    const url = target.sideImageUrl.trim()
    setMediaUploadState('uploading')
    setMediaUploadMessage(null)
    try {
      await deleteEditorMedia(url)
      updateBlock(blockId, { sideImageUrl: undefined, sideImagePosition: undefined })
      setMediaUploadState('idle')
      setMediaUploadMessage(null)
    } catch (err) {
      setMediaUploadState('error')
      setMediaUploadMessage(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function removeMedia(blockId: string) {
    const targetBlock = getBlockById(blockId)
    if (!targetBlock || (targetBlock.type !== 'image' && targetBlock.type !== 'video')) {
      setMediaUploadState('error')
      setMediaUploadMessage('Select an image or video block before removing media.')
      return
    }

    if (!targetBlock.url) return

    setMediaUploadState('uploading')
    setMediaUploadMessage(null)

    try {
      await deleteEditorMedia(targetBlock.url)
      updateBlock(blockId, { url: undefined })
      setMediaUploadState('idle')
      setMediaUploadMessage(null)
    } catch (err) {
      setMediaUploadState('error')
      setMediaUploadMessage(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  function dropBlockOnBlock(
    sourceBlockId: string,
    targetBlockId: string,
    options?: { side?: 'left' | 'right' }
  ) {
    const preSource = getBlockById(sourceBlockId)
    const preTarget = getBlockById(targetBlockId)
    const mergeInBlockImage =
      preSource?.type === 'image' &&
      (preTarget?.type === 'text' || preTarget?.type === 'list') &&
      Boolean(preSource?.url?.trim())

    if (mergeInBlockImage) {
      const url = preSource!.url!.trim()
      const side = options?.side === 'left' || options?.side === 'right' ? options.side : 'right'
      setDocument((prev) => {
        if (!prev) return prev
        const withoutSource = prev.blocks.filter((b) => b.id !== sourceBlockId)
        const ti = withoutSource.findIndex((b) => b.id === targetBlockId)
        if (ti < 0) return prev
        const previousSide = withoutSource[ti].sideImageUrl?.trim()
        if (previousSide && previousSide !== url) {
          void deleteEditorMedia(previousSide).catch(() => {
            // best-effort cleanup; merge still applied
          })
        }
        const next = [...withoutSource]
        next[ti] = {
          ...next[ti],
          sideImageUrl: url,
          sideImagePosition: side,
        }
        return { ...prev, blocks: next }
      })
      setActiveBlockId(targetBlockId)
      return
    }

    setDocument((prev) => {
      if (!prev) return prev
      const sourceIndex = prev.blocks.findIndex((block) => block.id === sourceBlockId)
      const targetIndex = prev.blocks.findIndex((block) => block.id === targetBlockId)
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return prev

      const source = prev.blocks[sourceIndex]
      const target = prev.blocks[targetIndex]
      const rowId = target.styles?.rowId ?? `row-${Date.now().toString(36)}`

      const next = [...prev.blocks]
      // ensure target is in a row
      next[targetIndex] = {
        ...target,
        styles: {
          ...target.styles,
          rowId,
        },
      }

      // remove source then insert right after target for side-by-side layout
      next.splice(sourceIndex, 1)
      const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
      const updatedSource: VisualBlock = {
        ...source,
        styles: {
          ...source.styles,
          rowId,
        },
      }
      next.splice(adjustedTargetIndex + 1, 0, updatedSource)

      return {
        ...prev,
        blocks: next,
      }
    })
  }

  function addBlock(type: VisualBlock['type']) {
    const block = createDefaultBlock(type)
    setDocument((prev) => (prev ? { ...prev, blocks: [...prev.blocks, block] } : prev))
    setActiveBlockId(block.id)
  }

  function insertBlock(index: number, type: VisualBlock['type']) {
    const block = createDefaultBlock(type)
    setDocument((prev) => {
      if (!prev) return prev
      const next = [...prev.blocks]
      next.splice(index, 0, block)
      return { ...prev, blocks: next }
    })
    setActiveBlockId(block.id)
  }

  function deleteBlock(blockId: string) {
    setDocument((prev) => {
      if (!prev) return prev
      return { ...prev, blocks: prev.blocks.filter((block) => block.id !== blockId) }
    })
    setActiveBlockId(null)
  }

  function moveBlockDirection(blockId: string, direction: 'up' | 'down') {
    setDocument((prev) => {
      if (!prev) return prev
      const sourceIndex = prev.blocks.findIndex((b) => b.id === blockId)
      const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1
      if (sourceIndex < 0 || targetIndex < 0) return prev
      if (targetIndex >= prev.blocks.length) return prev
      const next = [...prev.blocks]
      const [removed] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, removed)
      return { ...prev, blocks: next }
    })
  }

  function reorderToIndex(sourceId: string, targetIndex: number) {
    setDocument((prev) => {
      if (!prev) return prev
      const sourceIndex = prev.blocks.findIndex((b) => b.id === sourceId)
      if (sourceIndex < 0) return prev
      const clampedTarget = Math.max(0, Math.min(targetIndex, prev.blocks.length))
      const next = [...prev.blocks]
      const [removed] = next.splice(sourceIndex, 1)
      const insertIndex = sourceIndex < clampedTarget ? clampedTarget - 1 : clampedTarget
      next.splice(insertIndex, 0, removed)
      return { ...prev, blocks: next }
    })
  }

  function duplicateBlock(blockId: string) {
    setDocument((prev) => {
      if (!prev) return prev
      const index = prev.blocks.findIndex((item) => item.id === blockId)
      if (index < 0) return prev
      const source = prev.blocks[index]
      const copy: VisualBlock = {
        ...source,
        id: `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      }
      const next = [...prev.blocks]
      next.splice(index + 1, 0, copy)
      return { ...prev, blocks: next }
    })
  }

  function patchSectionFromCanvas(blockId: string, patch: Partial<ContentSection>) {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        blocks: prev.blocks.map((block) => {
          if (block.id !== blockId) return block
          if (patch.items) {
            if (block.type === 'catalogBand') {
              return {
                ...block,
                title: patch.title ?? block.title,
                catalogRows: patch.items.map((item) => ({
                  title: item.title,
                  icon: item.icon,
                  image: item.image,
                  description: item.description,
                })),
              }
            }
            return {
              ...block,
              title: patch.title ?? block.title,
              items: patch.items.map((item) => contentItemToVisualListItem(item)),
            }
          }
          return {
            ...block,
            title: patch.title ?? block.title,
            content: patch.content ?? block.content,
            richText: patch.richText !== undefined ? patch.richText : block.richText,
            sideImageUrl:
              'blockMediaUrl' in patch
                ? patch.blockMediaUrl?.trim()
                  ? patch.blockMediaUrl.trim()
                  : undefined
                : block.sideImageUrl,
            sideImagePosition:
              'blockMediaPosition' in patch ? patch.blockMediaPosition : block.sideImagePosition,
            sideImageFit: 'blockMediaFit' in patch ? patch.blockMediaFit : block.sideImageFit,
            mediaFit: 'mediaFit' in patch ? patch.mediaFit : block.mediaFit,
            styles: {
              ...block.styles,
              textColor: patch.textColor ?? block.styles?.textColor,
              backgroundColor: patch.backgroundColor ?? block.styles?.backgroundColor,
              fontSize: patch.fontSize ?? block.styles?.fontSize,
              fontFamily: patch.fontFamily ?? block.styles?.fontFamily,
              width: patch.blockWidth ?? block.styles?.width,
              height: patch.blockHeight ?? block.styles?.height,
              rowId: patch.rowId ?? block.styles?.rowId,
              align: patch.blockAlign ?? block.styles?.align,
              marginTop: patch.blockMarginTop ?? block.styles?.marginTop,
              marginBottom: patch.blockMarginBottom ?? block.styles?.marginBottom,
            },
          }
        }),
      }
    })
  }

  async function publish() {
    if (!document) return
    setPublishing(true)
    setError(null)
    try {
      await saveEditorDocument(buildingId, categorySlug, document)
      await publishEditorDocument(buildingId, categorySlug)
      setSaveState('saved')
      setHasPendingChanges(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
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
          <div className="flex gap-2">
            <Link href="/admin/categories">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button asChild variant="outline" className="gap-2">
              <Link href={publicCategoryHref} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4" />
                Preview
              </Link>
            </Button>
            <Button variant="outline" disabled={saveState === 'saving'} className="gap-2">
              <Save className="h-4 w-4" />
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Draft'}
            </Button>
            <Button onClick={() => void publish()} disabled={publishing}>
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        }
      />

      {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

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
                              {activeBlock.url ? 'Replace media' : 'Upload media'}
                              <input
                                type="file"
                                className="sr-only"
                                accept={activeBlock.type === 'image' ? 'image/*' : 'video/*'}
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  event.currentTarget.value = ''
                                  if (!file) return
                                  void applyMediaFile(activeBlock.id, file).catch((err: unknown) => {
                                    setMediaUploadState('error')
                                    setMediaUploadMessage(err instanceof Error ? err.message : 'Upload failed')
                                  })
                                }}
                              />
                            </label>
                            {activeBlock.url && (
                              <Button
                                type="button"
                                variant="outline"
                                disabled={mediaUploadState === 'uploading'}
                                onClick={() =>
                                  void removeMedia(activeBlock.id).catch((err: unknown) => {
                                    setMediaUploadState('error')
                                    setMediaUploadMessage(err instanceof Error ? err.message : 'Delete failed')
                                  })
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
                                  }).catch((err: unknown) => {
                                    setMediaUploadState('error')
                                    setMediaUploadMessage(err instanceof Error ? err.message : 'Upload failed')
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
                                  void removeBlockSideImage(activeBlock.id).catch((err: unknown) => {
                                    setMediaUploadState('error')
                                    setMediaUploadMessage(err instanceof Error ? err.message : 'Delete failed')
                                  })
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
