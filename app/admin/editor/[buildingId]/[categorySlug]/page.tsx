'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, ChevronsLeft, ChevronsRight, Save, Upload } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import {
  getEditorDocument,
  publishEditorDocument,
  saveEditorDocument,
  uploadEditorMedia,
} from '@/components/editor/editor-api'
import { LiveCanvas } from '@/components/editor/live-canvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { sectionsFromVisualDocument, type VisualBlock, type VisualGuideDocument } from '@/lib/visual-builder-schema'
import type { ContentSection } from '@/lib/data'

const FONT_CHOICES = ['Inter', 'Poppins', 'Montserrat', 'Lora', 'Merriweather', 'JetBrains Mono']

function createDefaultBlock(type: VisualBlock['type']): VisualBlock {
  const id = `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  if (type === 'list') {
    return { id, type, title: 'List', items: ['First item'] }
  }
  if (type === 'button') {
    return { id, type, title: 'Call to action', content: 'Open', url: '#' }
  }
  if (type === 'link') {
    return { id, type, title: 'Useful link', content: 'Open link', url: '#' }
  }
  return { id, type, title: `${type[0]?.toUpperCase()}${type.slice(1)}`, content: '' }
}

export default function CategoryVisualEditorPage() {
  const params = useParams<{ buildingId: string; categorySlug: string }>()
  const buildingId = params.buildingId
  const categorySlug = params.categorySlug
  const { email, canManageTeam, loading, error, setError, logout } = useAdminSession()

  const [document, setDocument] = useState<VisualGuideDocument | null>(null)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [publishing, setPublishing] = useState(false)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)

  const activeBlock = useMemo(
    () => document?.blocks.find((block) => block.id === activeBlockId) ?? null,
    [document, activeBlockId]
  )
  const sections = useMemo<ContentSection[]>(
    () => (document ? sectionsFromVisualDocument(document) : []),
    [document]
  )

  useEffect(() => {
    if (loading || !buildingId || !categorySlug) return
    void getEditorDocument(buildingId, categorySlug)
      .then((data) => {
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

  function dropBlockOnBlock(sourceBlockId: string, targetBlockId: string) {
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
            return {
              ...block,
              title: patch.title ?? block.title,
              items: patch.items.map((item) => item.title),
            }
          }
          return {
            ...block,
            title: patch.title ?? block.title,
            content: patch.content ?? block.content,
            styles: {
              ...block.styles,
              textColor: patch.textColor ?? block.styles?.textColor,
              backgroundColor: patch.backgroundColor ?? block.styles?.backgroundColor,
              fontSize: patch.fontSize ?? block.styles?.fontSize,
              fontFamily: patch.fontFamily ?? block.styles?.fontFamily,
              width: patch.blockWidth ?? block.styles?.width,
              height: patch.blockHeight ?? block.styles?.height,
              rowId: patch.rowId ?? block.styles?.rowId,
            },
          }
        }),
      }
    })
  }

  async function uploadMedia(file: File) {
    const uploaded = await uploadEditorMedia(file)
    if (!activeBlock) return
    updateBlock(activeBlock.id, { url: uploaded.url })
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
        title={`Visual Builder · ${categorySlug}`}
        description="Single live canvas: drag blocks in-place on the rendered page."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/categories">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setInspectorOpen((open) => !open)}
            >
              {inspectorOpen ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              {inspectorOpen ? 'Hide inspector' : 'Show inspector'}
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

      <div className={`grid gap-4 ${inspectorOpen ? 'lg:grid-cols-[1fr_340px]' : 'lg:grid-cols-1'}`}>
        <Card className="rounded-3xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Live Canvas</CardTitle>
            <div className="rounded-2xl border border-border bg-card p-4">
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
            />
            {document.blocks.length === 0 && (
              <div className="mt-3 text-sm text-muted-foreground">
                Add your first block directly in the canvas insertion zone.
              </div>
            )}
          </CardContent>
        </Card>

        {inspectorOpen && (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">Inspector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!activeBlock && <p className="text-sm text-muted-foreground">Select a block to edit.</p>}
              {activeBlock && (
                <>
                  <Input
                    value={activeBlock.title ?? ''}
                    placeholder="Block title"
                    onChange={(event) => updateBlock(activeBlock.id, { title: event.target.value })}
                  />
                  <Textarea
                    rows={4}
                    value={activeBlock.content ?? ''}
                    placeholder="Block content"
                    onChange={(event) => updateBlock(activeBlock.id, { content: event.target.value })}
                  />
                  {(activeBlock.type === 'image' ||
                    activeBlock.type === 'video' ||
                    activeBlock.type === 'button' ||
                    activeBlock.type === 'link' ||
                    activeBlock.type === 'text') && (
                    <Input
                      value={activeBlock.url ?? ''}
                      placeholder="https://..."
                      onChange={(event) => updateBlock(activeBlock.id, { url: event.target.value })}
                    />
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-muted-foreground">
                      Text color
                      <Input
                        type="color"
                        className="h-10 px-1"
                        value={activeBlock.styles?.textColor ?? '#222222'}
                        onChange={(event) => updateBlockStyles(activeBlock.id, { textColor: event.target.value })}
                      />
                    </label>
                    <label className="text-xs text-muted-foreground">
                      Background
                      <Input
                        type="color"
                        className="h-10 px-1"
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
                  {(activeBlock.type === 'image' || activeBlock.type === 'video') && (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                      <Upload className="h-4 w-4" />
                      Upload media
                      <input
                        type="file"
                        className="sr-only"
                        accept={activeBlock.type === 'image' ? 'image/*' : 'video/*'}
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          void uploadMedia(file)
                        }}
                      />
                    </label>
                  )}
                  {activeBlock.type === 'list' && (
                    <Textarea
                      rows={6}
                      value={(activeBlock.items ?? []).join('\n')}
                      placeholder="One list item per line"
                      onChange={(event) =>
                        updateBlock(activeBlock.id, {
                          items: event.target.value
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean),
                        })
                      }
                    />
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
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  )
}
