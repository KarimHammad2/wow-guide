'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, Hotel, Pencil, Trash2, QrCode, Loader2, Eye, Upload } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest, adminUploadBuildingImage } from '@/components/admin/admin-api'
import { BuildingQrDialog } from '@/components/admin/builder/building-qr-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog'
import type { Building } from '@/lib/data'
import type { City } from '@/lib/admin-types'
import { QuietHourPicker } from '@/components/admin/quiet-hour-picker'
import {
  DEFAULT_QUIET_HOURS_FROM,
  DEFAULT_QUIET_HOURS_TO,
  formatQuietHoursRange,
  hasValidQuietHoursRange,
  isValidQuietHourSlot,
  parseQuietHoursRange,
} from '@/lib/quiet-hours'

function BuildingPhotoField({
  label,
  alt,
  imageUrl,
  onImageUrlChange,
  onUploadError,
  disabled,
}: {
  label: string
  alt: string
  imageUrl: string
  onImageUrlChange: (url: string) => void
  onUploadError?: (message: string) => void
  disabled?: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(files: FileList | null) {
    const file = files?.[0]
    if (!file || disabled) return
    setUploading(true)
    try {
      const { url } = await adminUploadBuildingImage(file)
      onImageUrlChange(url)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed'
      onUploadError?.(message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const trimmed = imageUrl.trim()

  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">Optional. Shown on the public buildings list.</p>
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
          {trimmed ? (
            <Image src={trimmed} alt={alt} fill className="object-cover" sizes="96px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Hotel className="h-9 w-9 text-muted-foreground/55" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              className="gap-1.5"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" aria-hidden />
                  Upload image
                </>
              )}
            </Button>
            {trimmed ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => onImageUrlChange('')}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files)}
        />
      </div>
    </div>
  )
}

export default function AdminBuildingsPage() {
  const { email, canManageTeam, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [newBuilding, setNewBuilding] = useState<Omit<Building, 'id'>>({
    name: '',
    address: '',
    city: '',
    appPath: '',
    country: 'Switzerland',
    imageUrl: '',
    emergencyPhone: '',
    supportEmail: '',
    welcomeMessage: '',
    googleMapsUrl: '',
    quietHours: '',
    goodToKnow: '',
  })
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null)
  const [qrBuilding, setQrBuilding] = useState<Building | null>(null)
  const [quietFrom, setQuietFrom] = useState(DEFAULT_QUIET_HOURS_FROM)
  const [quietTo, setQuietTo] = useState(DEFAULT_QUIET_HOURS_TO)
  const [quietEditFrom, setQuietEditFrom] = useState('')
  const [quietEditTo, setQuietEditTo] = useState('')

  useEffect(() => {
    if (loading) return
    void Promise.all([
      adminRequest<Building[]>('/api/admin/buildings'),
      adminRequest<City[]>('/api/admin/cities'),
    ])
      .then(([buildingsData, citiesData]) => {
        setBuildings(buildingsData)
        setCities(citiesData)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load buildings and cities'
        setError(message)
      })
  }, [loading, setError])

  function isValidAppPath(value: string) {
    const v = value.trim()
    return /^\/[a-z0-9-]+$/i.test(v) || /^\/building\/[a-z0-9-]+$/i.test(v)
  }

  function isOptionalAppPathOk(value: string) {
    const v = value.trim()
    return v === '' || isValidAppPath(v)
  }

  function resetNewBuildingQuietHours() {
    setQuietFrom(DEFAULT_QUIET_HOURS_FROM)
    setQuietTo(DEFAULT_QUIET_HOURS_TO)
  }

  function canSubmitNewBuilding(b: Omit<Building, 'id'>) {
    return (
      Boolean(b.name.trim()) &&
      Boolean(b.address.trim()) &&
      Boolean(b.city.trim()) &&
      Boolean(b.googleMapsUrl.trim()) &&
      hasValidQuietHoursRange(quietFrom, quietTo) &&
      isOptionalAppPathOk(b.appPath)
    )
  }

  function canSubmitEdit(b: Building | null) {
    if (!b) return false
    return (
      Boolean(b.name.trim()) &&
      Boolean(b.address.trim()) &&
      Boolean(b.city.trim()) &&
      Boolean(b.googleMapsUrl.trim()) &&
      isValidQuietHourSlot(quietEditFrom) &&
      isValidQuietHourSlot(quietEditTo) &&
      isOptionalAppPathOk(b.appPath)
    )
  }

  useEffect(() => {
    if (!editingBuilding) {
      setQuietEditFrom('')
      setQuietEditTo('')
      return
    }
    const p = parseQuietHoursRange(editingBuilding.quietHours)
    setQuietEditFrom(p.from && isValidQuietHourSlot(p.from) ? p.from : '22:00')
    setQuietEditTo(p.to && isValidQuietHourSlot(p.to) ? p.to : '07:00')
  }, [editingBuilding])

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
        title="Buildings"
        description="Create and manage buildings. New buildings automatically get default guide sections."
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card className="rounded-3xl min-w-0">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2"><Hotel className="w-5 h-5 shrink-0" />Building List</CardTitle>
            <CardDescription>Edit building details and manage actions here.</CardDescription>
          </div>
          <Button
            size="sm"
            className="gap-1.5 w-full sm:w-auto shrink-0"
            disabled={!canEdit}
            onClick={() => {
              resetNewBuildingQuietHours()
              setAddOpen(true)
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Building
          </Button>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="w-full overflow-x-auto -mx-1 px-1 pb-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[3.75rem]" />
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildings.map((building) => (
                <TableRow key={building.id}>
                  <TableCell className="p-2 w-[3.75rem]">
                    <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-border bg-secondary">
                      {building.imageUrl.trim() ? (
                        <Image
                          src={building.imageUrl.trim()}
                          alt={`${building.name} photo`}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Hotel className="h-5 w-5 text-muted-foreground/55" aria-hidden />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{building.name}</TableCell>
                  <TableCell>{building.city}</TableCell>
                  <TableCell>{building.appPath}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      {building.appPath ? (
                        <Link href={building.appPath} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 px-2.5">
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 px-2.5" disabled>
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQrBuilding(building)}
                        className="h-8 w-8 p-0"
                        title="Generate building QR code"
                        aria-label="Generate building QR code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={() => {
                          setEditingBuilding(building)
                          setEditOpen(true)
                        }}
                        className="h-8 w-8 p-0"
                        title="Edit building"
                        aria-label="Edit building"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!canEdit || saving}
                        onClick={() => setDeletingBuilding(building)}
                        className="h-8 w-8 p-0"
                        title="Delete building"
                        aria-label="Delete building"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open)
          if (open) resetNewBuildingQuietHours()
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Building</DialogTitle>
            <DialogDescription>
              Create a new building. Default guide sections are saved to the database and may take a few seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-building-name">Building name</Label>
              <Input
                id="add-building-name"
                placeholder="Building name"
                value={newBuilding.name}
                onChange={(e) => setNewBuilding((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-address">Address</Label>
                <Input
                  id="add-address"
                  placeholder="Street and number"
                  value={newBuilding.address}
                  onChange={(e) => setNewBuilding((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Select value={newBuilding.city} onValueChange={(value) => setNewBuilding((p) => ({ ...p, city: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="add-maps">Google Maps link</Label>
                <Input
                  id="add-maps"
                  type="url"
                  inputMode="url"
                  placeholder="https://maps.google.com/..."
                  value={newBuilding.googleMapsUrl}
                  onChange={(e) => setNewBuilding((p) => ({ ...p, googleMapsUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="add-app-path">Guide URL path (optional)</Label>
                <Input
                  id="add-app-path"
                  placeholder="/your-building-slug"
                  value={newBuilding.appPath}
                  onChange={(e) => setNewBuilding((p) => ({ ...p, appPath: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use a path derived from the building name.
                </p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Quiet hours</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <QuietHourPicker
                    id="add-quiet-from"
                    placeholder="From"
                    value={quietFrom}
                    onValueChange={setQuietFrom}
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <QuietHourPicker
                    id="add-quiet-to"
                    placeholder="To"
                    value={quietTo}
                    onValueChange={setQuietTo}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Night-time ranges (e.g. 22:00 to 07:00) are allowed.</p>
              </div>
              <BuildingPhotoField
                label="Building photo"
                alt={newBuilding.name.trim() ? `${newBuilding.name.trim()} preview` : 'New building preview'}
                imageUrl={newBuilding.imageUrl}
                onImageUrlChange={(url) => setNewBuilding((p) => ({ ...p, imageUrl: url }))}
                onUploadError={setError}
                disabled={!canEdit || saving}
              />
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="add-good">Good to know (optional)</Label>
                <Textarea
                  id="add-good"
                  placeholder="Short tips for residents"
                  rows={2}
                  value={newBuilding.goodToKnow}
                  onChange={(e) => setNewBuilding((p) => ({ ...p, goodToKnow: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !canSubmitNewBuilding(newBuilding)}
              onClick={() =>
                mutate(async () => {
                  if (!hasValidQuietHoursRange(quietFrom, quietTo)) return
                  const payload: Omit<Building, 'id'> = {
                    ...newBuilding,
                    quietHours: formatQuietHoursRange(quietFrom, quietTo),
                  }
                  const created = await adminRequest<Building>('/api/admin/buildings', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  })
                  setBuildings((prev) => [...prev, created])
                  setNewBuilding({
                    name: '',
                    address: '',
                    city: '',
                    appPath: '',
                    country: 'Switzerland',
                    imageUrl: '',
                    emergencyPhone: '',
                    supportEmail: '',
                    welcomeMessage: '',
                    googleMapsUrl: '',
                    quietHours: '',
                    goodToKnow: '',
                  })
                  setQuietFrom(DEFAULT_QUIET_HOURS_FROM)
                  setQuietTo(DEFAULT_QUIET_HOURS_TO)
                  setAddOpen(false)
                })
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Building</DialogTitle>
            <DialogDescription>Update building details.</DialogDescription>
          </DialogHeader>
          {editingBuilding && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-building-name">Building name</Label>
                <Input
                  id="edit-building-name"
                  value={editingBuilding.name}
                  onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                  placeholder="Building name"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={editingBuilding.address}
                    onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, address: e.target.value } : prev))}
                    placeholder="Street and number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Select
                    value={editingBuilding.city}
                    onValueChange={(value) => setEditingBuilding((prev) => (prev ? { ...prev, city: value } : prev))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-maps">Google Maps link</Label>
                  <Input
                    id="edit-maps"
                    type="url"
                    inputMode="url"
                    placeholder="https://maps.google.com/..."
                    value={editingBuilding.googleMapsUrl}
                    onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, googleMapsUrl: e.target.value } : prev))}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-app-path">Guide URL path (optional)</Label>
                  <Input
                    id="edit-app-path"
                    value={editingBuilding.appPath}
                    onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, appPath: e.target.value } : prev))}
                    placeholder="/your-building-slug"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use a path derived from the building name.
                  </p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Quiet hours</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <QuietHourPicker
                      id="edit-quiet-from"
                      placeholder="From"
                      value={quietEditFrom}
                      onValueChange={setQuietEditFrom}
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <QuietHourPicker
                      id="edit-quiet-to"
                      placeholder="To"
                      value={quietEditTo}
                      onValueChange={setQuietEditTo}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Night-time ranges (e.g. 22:00 to 07:00) are allowed.</p>
                </div>
                <BuildingPhotoField
                  label="Building photo"
                  alt={`${editingBuilding.name} preview`}
                  imageUrl={editingBuilding.imageUrl}
                  onImageUrlChange={(url) =>
                    setEditingBuilding((prev) => (prev ? { ...prev, imageUrl: url } : prev))
                  }
                  onUploadError={setError}
                  disabled={!canEdit || saving}
                />
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-good">Good to know (optional)</Label>
                  <Textarea
                    id="edit-good"
                    value={editingBuilding.goodToKnow}
                    onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, goodToKnow: e.target.value } : prev))}
                    placeholder="Short tips for residents"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !canSubmitEdit(editingBuilding)}
              onClick={() =>
                mutate(async () => {
                  if (!editingBuilding) return
                  const updated = await adminRequest<Building>('/api/admin/buildings', {
                    method: 'PUT',
                    body: JSON.stringify({
                      ...editingBuilding,
                      quietHours: formatQuietHoursRange(quietEditFrom, quietEditTo),
                    }),
                  })
                  setBuildings((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                  setEditOpen(false)
                })
              }
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deletingBuilding)}
        onOpenChange={(open) => {
          if (!open) setDeletingBuilding(null)
        }}
        title="Delete building?"
        description={
          deletingBuilding
            ? `Delete ${deletingBuilding.name}? This action cannot be undone.`
            : 'This action cannot be undone.'
        }
        disabled={saving}
        onConfirm={() => {
          if (!deletingBuilding) return
          void mutate(async () => {
            await adminRequest('/api/admin/buildings', {
              method: 'DELETE',
              body: JSON.stringify({ id: deletingBuilding.id }),
            })
            setBuildings((prev) => prev.filter((p) => p.id !== deletingBuilding.id))
            setDeletingBuilding(null)
          })
        }}
      />
      <BuildingQrDialog
        building={qrBuilding}
        open={Boolean(qrBuilding)}
        onOpenChange={(open) => {
          if (!open) setQrBuilding(null)
        }}
      />
    </AdminShell>
  )
}
