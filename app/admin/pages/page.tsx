'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Plus, Pencil, ExternalLink } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SitePageListItem } from '@/lib/site-pages-repository'

export default function AdminSitePagesListPage() {
  const { email, canManageTeam, loading, error, setError, logout } = useAdminSession()
  const [pages, setPages] = useState<SitePageListItem[]>([])

  useEffect(() => {
    if (loading) return
    void adminRequest<SitePageListItem[]>('/api/admin/site-pages')
      .then(setPages)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load pages'
        setError(message)
      })
  }, [loading, setError])

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>
  }

  return (
    <AdminShell userEmail={email} canManageTeam={canManageTeam} onLogout={logout}>
      <ModuleHeader
        title="Site pages"
        description="Legal pages, policies, and other static content with custom URLs."
        actions={
          <Button asChild className="gap-2">
            <Link href="/admin/pages/new">
              <Plus className="w-4 h-4" />
              New page
            </Link>
          </Button>
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
            Pages
          </CardTitle>
          <CardDescription>Each page is available at the URL shown below.</CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pages yet. Create one to add terms, privacy, or FAQs.</p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
              {pages.map((p) => (
                <li key={p.slug} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-card">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="tabular-nums">/{p.slug}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild className="gap-1.5">
                      <a href={`/${encodeURIComponent(p.slug)}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                        View
                      </a>
                    </Button>
                    <Button size="sm" variant="secondary" asChild className="gap-1.5">
                      <Link href={`/admin/pages/${encodeURIComponent(p.slug)}/edit`}>
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  )
}
