'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, FileText } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import { LiveCanvas } from '@/components/editor/live-canvas'
import {
  normalizeEditorDocument,
  useVisualGuideLiveDocumentHandlers,
} from '@/components/editor/use-visual-guide-live-document'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SitePageRecord } from '@/lib/site-pages-repository'
import { normalizeSitePageSlug } from '@/lib/site-page-slug'
import { sectionsFromVisualDocument, visualFromGuideContent, type VisualGuideDocument } from '@/lib/visual-builder-schema'

function emptyDocument(): VisualGuideDocument {
  return {
    contentVersion: 2,
    layout: 'single-column',
    blocks: [],
    settings: { intro: '' },
  }
}

export function SitePageEditor({
  mode,
  initialPage,
}: {
  mode: 'create' | 'edit'
  initialPage?: SitePageRecord | null
}) {
  const router = useRouter()
  const { email, canManageTeam, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState(initialPage?.title ?? '')
  const [slugInput, setSlugInput] = useState(initialPage?.slug ?? '')
  const [document, setDocument] = useState<VisualGuideDocument | null>(null)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const originalSlug = initialPage?.slug ?? null

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
    updateBlockStyles,
  } = useVisualGuideLiveDocumentHandlers(document, setDocument, setActiveBlockId)

  const sections = useMemo(
    () => (document ? sectionsFromVisualDocument(document) : []),
    [document]
  )

  useEffect(() => {
    if (mode === 'edit' && initialPage) {
      const base = initialPage.content.visualDocument
        ? normalizeEditorDocument(initialPage.content.visualDocument as VisualGuideDocument)
        : visualFromGuideContent({
            intro: initialPage.content.intro,
            sections: initialPage.content.sections,
            alert: initialPage.content.alert,
          })
      const normalized = normalizeEditorDocument(base)
      setDocument(normalized)
      setActiveBlockId(normalized.blocks[0]?.id ?? null)
    } else if (mode === 'create') {
      setDocument(emptyDocument())
      setActiveBlockId(null)
    }
    setHydrated(true)
  }, [mode, initialPage])

  const mutate = useCallback(
    async (action: () => Promise<void>) => {
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
    },
    [setError]
  )

  async function handleSave() {
    if (!document) return
    const normalizedSlug = normalizeSitePageSlug(slugInput)
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!normalizedSlug) {
      setError('URL slug is required.')
      return
    }

    const derivedSections = sectionsFromVisualDocument(document)
    const payload = {
      slug: normalizedSlug,
      title: title.trim(),
      content: {
        intro: document.settings?.intro ?? '',
        sections: derivedSections,
        visualDocument: document,
      },
    }

    if (mode === 'create') {
      await mutate(async () => {
        const created = await adminRequest<SitePageRecord>('/api/admin/site-pages', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        router.replace(`/admin/pages/${encodeURIComponent(created.slug)}/edit`)
        router.refresh()
      })
      return
    }

    if (!originalSlug) return

    await mutate(async () => {
      const updated = await adminRequest<SitePageRecord>(
        `/api/admin/site-pages/${encodeURIComponent(originalSlug)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            slug: normalizedSlug,
            title: title.trim(),
            content: {
              intro: document.settings?.intro ?? '',
              sections: derivedSections,
              visualDocument: document,
            },
          }),
        }
      )
      if (updated.slug !== originalSlug) {
        router.replace(`/admin/pages/${encodeURIComponent(updated.slug)}/edit`)
      }
      router.refresh()
    })
  }

  const publicHref = `/${encodeURIComponent(normalizeSitePageSlug(slugInput) || 'page')}`

  if (loading || !hydrated || !document) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>
  }

  return (
    <AdminShell userEmail={email} canManageTeam={canManageTeam} onLogout={logout}>
      <ModuleHeader
        title={mode === 'create' ? 'New site page' : 'Edit site page'}
        description="Set the title and URL, then edit content on the live canvas (same as category visual builder)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/pages">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                All pages
              </Button>
            </Link>
            {normalizeSitePageSlug(slugInput) ? (
              <Button variant="outline" className="gap-2" asChild>
                <a href={publicHref} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-4 h-4" />
                  Preview
                </a>
              </Button>
            ) : null}
          </div>
        }
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {mode === 'create' ? 'Create page' : title || 'Page'}
          </CardTitle>
          <CardDescription>
            Public URL: <span className="font-medium text-foreground">/{normalizeSitePageSlug(slugInput) || '…'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Terms of service" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">URL slug</label>
              <Input
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="terms"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Live canvas — drag blocks, inline edit, and upload media like building categories.</p>
            <Button disabled={!canEdit || saving} onClick={() => void handleSave()}>
              Save page
            </Button>
          </div>

          {mediaUploadMessage && (
            <p
              className={`text-sm px-3 py-2 rounded-xl border ${
                mediaUploadState === 'error'
                  ? 'border-destructive/40 bg-destructive/10 text-destructive'
                  : mediaUploadState === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100'
                    : 'border-border bg-muted/40 text-foreground'
              }`}
            >
              {mediaUploadMessage}
            </p>
          )}

          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Intro (optional)</label>
            <Textarea
              rows={2}
              placeholder="Short lead text under the title"
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

          <Card className="rounded-3xl border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Live Canvas</CardTitle>
              <CardDescription>Add blocks in the zones below; edits apply directly on the page preview.</CardDescription>
            </CardHeader>
            <CardContent
              className={mediaUploadState === 'uploading' ? 'pointer-events-none opacity-60' : ''}
            >
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
                onResizeBlock={(blockId, next) =>
                  updateBlockStyles(blockId, { width: next.width, height: next.height })
                }
                onDropBlockOnBlock={dropBlockOnBlock}
                onUploadMedia={applyMediaFile}
                onRemoveBlockSideImage={removeBlockSideImage}
              />
              {document.blocks.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Use the insertion zones above to add your first block.
                </p>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
