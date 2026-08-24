'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import { getEditorDocument } from '@/components/editor/editor-api'
import { GuideBlockRenderer } from '@/components/guide/blocks/guide-block-renderer'
import { normalizeEditorDocument } from '@/components/editor/use-visual-guide-live-document'
import { sectionsFromVisualDocument } from '@/lib/visual-builder-schema'
import type { Building, Category } from '@/lib/data'

export default function AdminCategoryDraftPreviewPage() {
  const params = useParams<{ buildingId: string; categorySlug: string }>()
  const buildingId = params.buildingId
  const categorySlug = params.categorySlug
  const { email, canManageTeam, loading: sessionLoading, error, setError, logout } = useAdminSession()

  const [buildings, setBuildings] = useState<Building[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [sections, setSections] = useState<ReturnType<typeof sectionsFromVisualDocument>>([])
  const [intro, setIntro] = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  const building = useMemo(
    () => buildings.find((item) => item.id === buildingId) ?? null,
    [buildings, buildingId]
  )

  useEffect(() => {
    if (sessionLoading || !buildingId || !categorySlug) return
    setPageLoading(true)
    setError(null)
    void Promise.all([
      adminRequest<Building[]>('/api/admin/buildings'),
      getEditorDocument(buildingId, categorySlug),
    ])
      .then(([buildingsData, editorData]) => {
        setBuildings(buildingsData)
        setCategory(editorData.category)
        const normalized = normalizeEditorDocument(editorData.document)
        setSections(sectionsFromVisualDocument(normalized))
        setIntro(normalized.settings?.intro ?? '')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load draft preview')
      })
      .finally(() => setPageLoading(false))
  }, [sessionLoading, buildingId, categorySlug, setError])

  if (sessionLoading || pageLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">Loading draft preview...</div>
    )
  }

  return (
    <AdminShell userEmail={email} canManageTeam={canManageTeam} onLogout={logout}>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/admin/editor/${buildingId}/${categorySlug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Visual Builder
          </Link>
        </div>

        <div
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/40 dark:text-amber-50"
        >
          Draft preview (admin) — loaded from your saved draft via the editor API. Guests see the last published
          version until you click Publish.
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {building?.name ?? buildingId} · {category?.title ?? categorySlug.replaceAll('-', ' ')}
          </p>
          {intro.trim() ? <p className="text-muted-foreground leading-relaxed">{intro}</p> : null}
        </header>

        <GuideBlockRenderer sections={sections} />
      </div>
    </AdminShell>
  )
}
