'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Eye, ImagePlus, Layers, Pencil, Plus, Trash2, X } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest, adminUploadCategoryIcon } from '@/components/admin/admin-api'
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { BuildingGuideCategory } from '@/lib/admin-types'
import type { Building, Category } from '@/lib/data'
import { getLucideIcon } from '@/lib/icons'
import { ADMIN_CATEGORY_ICON_OPTIONS } from '@/lib/category-lucide-icons'

type IconMode = 'lucide' | 'image'

const defaultCreate = {
  title: '',
  shortDescription: '',
  iconMode: 'lucide' as IconMode,
  iconName: 'BookOpen',
  iconImageUrl: '',
  categoryColor: 'primary' as Category['color'],
}

const COLOR_CHOICES: { value: Category['color']; label: string; dot: string }[] = [
  { value: 'primary', label: 'Primary', dot: 'bg-primary' },
  { value: 'accent', label: 'Accent', dot: 'bg-accent' },
  { value: 'muted', label: 'Muted', dot: 'bg-secondary border border-border' },
]

export default function AdminCategoriesPage() {
  const { email, canManageTeam, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<BuildingGuideCategory[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(defaultCreate)
  const [editCategory, setEditCategory] = useState<BuildingGuideCategory | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    shortDescription: '',
    iconMode: 'lucide' as IconMode,
    iconName: 'BookOpen',
    iconImageUrl: '',
    categoryColor: 'primary' as Category['color'],
  })
  const [deleteCategory, setDeleteCategory] = useState<BuildingGuideCategory | null>(null)
  const createIconFileInputRef = useRef<HTMLInputElement>(null)
  const editIconFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (loading) return
    void adminRequest<Building[]>('/api/admin/buildings')
      .then((blds) => {
        setBuildings(blds)
        setSelectedBuildingId((current) => current || blds[0]?.id || '')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      })
  }, [loading, setError])

  useEffect(() => {
    if (loading || !selectedBuildingId) {
      setCategories([])
      return
    }

    void adminRequest<BuildingGuideCategory[]>(`/api/admin/categories?buildingId=${selectedBuildingId}`)
      .then((rows) => {
        setCategories(rows)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load catalog')
      })
  }, [loading, selectedBuildingId, setError])

  useEffect(() => {
    setCreateOpen(false)
    setEditCategory(null)
    setDeleteCategory(null)
    setCreateForm(defaultCreate)
  }, [selectedBuildingId])

  async function mutate(action: () => Promise<void>) {
    setSaving(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(cat: BuildingGuideCategory) {
    setEditCategory(cat)
    const isImage = Boolean(cat.category.icon?.trim().match(/^https?:\/\//))
    setEditForm({
      title: cat.category.title,
      shortDescription: cat.category.subtitle,
      iconMode: isImage ? 'image' : 'lucide',
      iconName: isImage ? 'BookOpen' : cat.category.icon ?? 'BookOpen',
      iconImageUrl: isImage ? cat.category.icon : '',
      categoryColor: cat.category.color ?? 'primary',
    })
  }

  function payloadFromForm(f: typeof createForm | typeof editForm) {
    if (f.iconMode === 'image') {
      return {
        iconName: null as string | null,
        iconImageUrl: f.iconImageUrl.trim() || null,
      }
    }
    return {
      iconName: f.iconName.trim() || 'BookOpen',
      iconImageUrl: null as string | null,
    }
  }

  async function refreshCategories() {
    if (!selectedBuildingId) return
    const rows = await adminRequest<BuildingGuideCategory[]>(
      `/api/admin/categories?buildingId=${selectedBuildingId}`
    )
    setCategories(rows)
  }

  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId) ?? null,
    [buildings, selectedBuildingId]
  )

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>
  }

  return (
    <AdminShell userEmail={email} canManageTeam={canManageTeam} onLogout={logout}>
      <ModuleHeader
        title="Categories"
        description={
          selectedBuilding
            ? `Manage the catalog for ${selectedBuilding.name}.`
            : 'Select a building to edit its catalog.'
        }
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="space-y-6">
        <Card className="rounded-3xl min-w-0">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 shrink-0" />
                Catalog
              </CardTitle>
              <CardDescription className="mt-1">
                Pick a building first, then edit only that building’s catalog.
              </CardDescription>
              {selectedBuilding ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Current building: <span className="font-medium text-foreground">{selectedBuilding.name}</span>
                  {selectedBuilding.city ? ` — ${selectedBuilding.city}` : ''}
                </p>
              ) : null}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="w-full min-w-0 sm:w-72">
                <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                  <SelectTrigger
                    aria-label="Choose building"
                    className="w-full min-w-0"
                    title={selectedBuilding?.name ? `${selectedBuilding.name}${selectedBuilding.city ? ` — ${selectedBuilding.city}` : ''}` : undefined}
                  >
                    <SelectValue placeholder="Select building" className="truncate text-left" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                        {b.city ? ` — ${b.city}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedBuilding?.appPath ? (
                <Button asChild size="sm" variant="outline" className="gap-1.5 shrink-0">
                  <Link href={selectedBuilding.appPath} target="_blank" rel="noopener noreferrer">
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="gap-1.5 shrink-0" disabled>
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1.5 shrink-0"
                disabled={!canEdit || !selectedBuildingId}
                onClick={() => {
                  setCreateForm(defaultCreate)
                  setCreateOpen(true)
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                New category
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.category.slug}>
                    <TableCell className="font-medium max-w-[min(100%,14rem)]">
                      {selectedBuildingId ? (
                        <Link
                          href={`/admin/editor/${selectedBuildingId}/${cat.category.slug}`}
                          className="truncate text-primary hover:underline"
                          title={`Open editor for ${cat.category.title}`}
                        >
                          {cat.category.title}
                        </Link>
                      ) : (
                        <div className="truncate">{cat.category.title}</div>
                      )}
                      {cat.category.subtitle?.trim() ? (
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {cat.category.subtitle}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="w-[1%] whitespace-nowrap">
                      {cat.category.icon && /^https?:\/\//.test(cat.category.icon) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cat.category.icon} alt="" className="h-9 w-9 rounded-md object-cover" />
                      ) : (
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40">
                          {(() => {
                            const Icon = getLucideIcon(cat.category.icon || 'BookOpen')
                            return <Icon className="h-5 w-5" />
                          })()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {(() => {
                        const key = cat.category.color ?? 'primary'
                        const choice = COLOR_CHOICES.find((c) => c.value === key) ?? COLOR_CHOICES[0]
                        return (
                          <span className="inline-flex items-center gap-2 text-sm">
                            <span
                              className={cn('h-3 w-3 shrink-0 rounded-full', choice.dot)}
                              aria-hidden
                            />
                            {choice.label}
                          </span>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="max-w-md align-top">
                      <div className="text-sm text-muted-foreground">
                        {cat.content.sections.length} blocks
                        {cat.content.intro?.trim() ? ' · intro set' : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          disabled={!canEdit || !selectedBuildingId}
                          onClick={() => openEdit(cat)}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          disabled={!canEdit || saving}
                          onClick={() => setDeleteCategory(cat)}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      {selectedBuildingId
                        ? 'No categories have been created for this building yet.'
                        : 'Select a building to view its catalog.'}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-none overflow-visible">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              Enter title and icon, then choose a building. Short description and tile color are optional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-title"
                required
                value={createForm.title}
                onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <Label>
                Icon <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant={createForm.iconMode === 'lucide' ? 'default' : 'outline'}
                  onClick={() => setCreateForm((p) => ({ ...p, iconMode: 'lucide' }))}
                >
                  Icons
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={createForm.iconMode === 'image' ? 'default' : 'outline'}
                  onClick={() => setCreateForm((p) => ({ ...p, iconMode: 'image' }))}
                >
                  Upload image
                </Button>
              </div>
              {createForm.iconMode === 'lucide' ? (
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 p-1 border rounded-xl">
                  {ADMIN_CATEGORY_ICON_OPTIONS.map((name) => {
                    const Icon = getLucideIcon(name)
                    const selected = createForm.iconName === name
                    return (
                      <button
                        key={name}
                        type="button"
                        title={name}
                        onClick={() => setCreateForm((p) => ({ ...p, iconName: name }))}
                        className={cn(
                          'flex items-center justify-center rounded-lg border p-2 transition-colors',
                          selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/60'
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    ref={createIconFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      const input = e.target
                      if (!file) return
                      void mutate(async () => {
                        try {
                          const { url } = await adminUploadCategoryIcon(file)
                          setCreateForm((p) => ({ ...p, iconImageUrl: url }))
                        } finally {
                          input.value = ''
                        }
                      })
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={!canEdit || saving}
                      onClick={() => createIconFileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4 shrink-0" aria-hidden />
                      Choose image
                    </Button>
                    <span className="text-xs text-muted-foreground">PNG, JPG, WebP, or GIF · max 5MB</span>
                  </div>
                  {createForm.iconImageUrl ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={createForm.iconImageUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                      <span className="truncate flex-1 text-muted-foreground">{createForm.iconImageUrl}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => setCreateForm((p) => ({ ...p, iconImageUrl: '' }))}
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Short description (optional)</Label>
              <Textarea
                id="cat-desc"
                rows={3}
                placeholder="Shown under the title in lists when set"
                value={createForm.shortDescription}
                onChange={(e) => setCreateForm((p) => ({ ...p, shortDescription: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tile color (optional)</Label>
              <p className="text-xs text-muted-foreground">How this category looks on guide tiles and search.</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_CHOICES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCreateForm((p) => ({ ...p, categoryColor: c.value }))}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                      createForm.categoryColor === c.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/60'
                    )}
                  >
                    <span className={cn('size-3.5 shrink-0 rounded-full', c.dot)} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !canEdit ||
                saving ||
                !selectedBuildingId ||
                !createForm.title.trim() ||
                (createForm.iconMode === 'image' && !createForm.iconImageUrl.trim())
              }
              onClick={() =>
                mutate(async () => {
                  const icons = payloadFromForm(createForm)
                  await adminRequest<BuildingGuideCategory>('/api/admin/categories', {
                    method: 'POST',
                    body: JSON.stringify({
                      buildingId: selectedBuildingId,
                      title: createForm.title,
                      shortDescription: createForm.shortDescription.trim() || '',
                      iconName: icons.iconName,
                      iconImageUrl: icons.iconImageUrl,
                      categoryColor: createForm.categoryColor,
                    }),
                  })
                  await refreshCategories()
                  setCreateOpen(false)
                  setCreateForm(defaultCreate)
                })
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editCategory)} onOpenChange={(o) => !o && setEditCategory(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-none overflow-visible">
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>Changes apply only to the selected building.</DialogDescription>
          </DialogHeader>
          {editCategory && (
            <>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Short description (optional)</Label>
                  <Textarea
                    rows={3}
                    value={editForm.shortDescription}
                    onChange={(e) => setEditForm((p) => ({ ...p, shortDescription: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tile color (optional)</Label>
                  <p className="text-xs text-muted-foreground">How this category looks on guide tiles and search.</p>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_CHOICES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setEditForm((p) => ({ ...p, categoryColor: c.value }))}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                          editForm.categoryColor === c.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted/60'
                        )}
                      >
                        <span className={cn('size-3.5 shrink-0 rounded-full', c.dot)} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>
                    Icon <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={editForm.iconMode === 'lucide' ? 'default' : 'outline'}
                      onClick={() => setEditForm((p) => ({ ...p, iconMode: 'lucide' }))}
                    >
                      Icons
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editForm.iconMode === 'image' ? 'default' : 'outline'}
                      onClick={() => setEditForm((p) => ({ ...p, iconMode: 'image' }))}
                    >
                      Upload image
                    </Button>
                  </div>
                  {editForm.iconMode === 'lucide' ? (
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 p-1 border rounded-xl">
                      {ADMIN_CATEGORY_ICON_OPTIONS.map((name) => {
                        const Icon = getLucideIcon(name)
                        const selected = editForm.iconName === name
                        return (
                          <button
                            key={name}
                            type="button"
                            title={name}
                            onClick={() => setEditForm((p) => ({ ...p, iconName: name }))}
                            className={cn(
                              'flex items-center justify-center rounded-lg border p-2 transition-colors',
                              selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/60'
                            )}
                          >
                            <Icon className="w-6 h-6" />
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        ref={editIconFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        tabIndex={-1}
                        aria-hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          const input = e.target
                          if (!file) return
                          void mutate(async () => {
                            try {
                              const { url } = await adminUploadCategoryIcon(file)
                              setEditForm((p) => ({ ...p, iconImageUrl: url }))
                            } finally {
                              input.value = ''
                            }
                          })
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={!canEdit || saving}
                          onClick={() => editIconFileInputRef.current?.click()}
                        >
                          <ImagePlus className="h-4 w-4 shrink-0" aria-hidden />
                          Choose image
                        </Button>
                        <span className="text-xs text-muted-foreground">PNG, JPG, WebP, or GIF · max 5MB</span>
                      </div>
                      {editForm.iconImageUrl ? (
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={editForm.iconImageUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                          <span className="truncate flex-1 text-sm text-muted-foreground">{editForm.iconImageUrl}</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditCategory(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={
                    !canEdit ||
                    saving ||
                    !selectedBuildingId ||
                    !editForm.title.trim() ||
                    (editForm.iconMode === 'image' && !editForm.iconImageUrl.trim())
                  }
                  onClick={() =>
                    mutate(async () => {
                      if (!editCategory) return
                      const icons = payloadFromForm(editForm)
                      await adminRequest<BuildingGuideCategory>('/api/admin/categories', {
                        method: 'PUT',
                        body: JSON.stringify({
                          buildingId: selectedBuildingId,
                          slug: editCategory.category.slug,
                          title: editForm.title,
                          shortDescription: editForm.shortDescription.trim() || '',
                          iconName: icons.iconName,
                          iconImageUrl: icons.iconImageUrl,
                          categoryColor: editForm.categoryColor,
                        }),
                      })
                      await refreshCategories()
                      setEditCategory(null)
                    })
                  }
                >
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deleteCategory)}
        onOpenChange={(open) => {
          if (!open) setDeleteCategory(null)
        }}
        title="Delete category?"
        description={
          deleteCategory
            ? `Delete “${deleteCategory.category.title}” from this building? The guide section will be removed here only.`
            : 'This action cannot be undone.'
        }
        disabled={saving}
        onConfirm={() => {
          if (!deleteCategory) return
          void mutate(async () => {
            await adminRequest('/api/admin/categories', {
              method: 'DELETE',
              body: JSON.stringify({
                buildingId: selectedBuildingId,
                slug: deleteCategory.category.slug,
              }),
            })
            await refreshCategories()
            setDeleteCategory(null)
          })
        }}
      />
    </AdminShell>
  )
}
