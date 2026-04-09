'use client'

import { useEffect, useState } from 'react'
import { Plus, MapPinned, MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog'
import type { City } from '@/lib/admin-types'

export default function AdminCitiesPage() {
  const { email, canManageTeam, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [newCityName, setNewCityName] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<City | null>(null)
  const [deletingCity, setDeletingCity] = useState<City | null>(null)

  useEffect(() => {
    if (loading) return
    void adminRequest<City[]>('/api/admin/cities')
      .then(setCities)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load cities'
        setError(message)
      })
  }, [loading, setError])

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
        title="Cities"
        description="Manage Swiss cities for your properties."
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card className="rounded-3xl min-w-0">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2"><MapPinned className="w-5 h-5 shrink-0" />City List</CardTitle>
            <CardDescription>Add, edit, and remove cities.</CardDescription>
          </div>
          <Button size="sm" className="gap-1.5 w-full sm:w-auto shrink-0" disabled={!canEdit} onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add City
          </Button>
        </CardHeader>
        <CardContent>
          {cities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cities yet. Add your first city.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cities.map((city) => (
                <div
                  key={city.id}
                  className="group relative rounded-2xl border border-border/70 bg-card px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <p className="font-semibold text-base">{city.name}</p>
                  </div>

                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-muted/70 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus-visible:opacity-100"
                          aria-label={`Open actions for ${city.name}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingCity(city)
                            setEditOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={saving}
                          onClick={() => setDeletingCity(city)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add City</DialogTitle>
            <DialogDescription>Create a new city entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={newCityName} onChange={(e) => setNewCityName(e.target.value)} placeholder="City name" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !newCityName.trim()}
              onClick={() =>
                mutate(async () => {
                  const created = await adminRequest<City>('/api/admin/cities', {
                    method: 'POST',
                    body: JSON.stringify({ name: newCityName, country: 'Switzerland' }),
                  })
                  setCities((prev) => [...prev, created])
                  setNewCityName('')
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit City</DialogTitle>
            <DialogDescription>Update city name.</DialogDescription>
          </DialogHeader>
          {editingCity && (
            <div className="space-y-3">
              <Input value={editingCity.name} onChange={(e) => setEditingCity((prev) => (prev ? { ...prev, name: e.target.value } : prev))} placeholder="City name" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !editingCity?.name.trim()}
              onClick={() =>
                mutate(async () => {
                  if (!editingCity) return
                  const updated = await adminRequest<City>('/api/admin/cities', {
                    method: 'PUT',
                    body: JSON.stringify({ ...editingCity, country: 'Switzerland' }),
                  })
                  setCities((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                  setEditOpen(false)
                })
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deletingCity)}
        onOpenChange={(open) => {
          if (!open) setDeletingCity(null)
        }}
        title="Delete city?"
        description={
          deletingCity
            ? `Delete ${deletingCity.name}? This action cannot be undone.`
            : 'This action cannot be undone.'
        }
        disabled={saving}
        onConfirm={() => {
          const id = deletingCity?.id
          if (!id) return
          void mutate(async () => {
            await adminRequest('/api/admin/cities', {
              method: 'DELETE',
              body: JSON.stringify({ id }),
            })
            setCities((prev) => prev.filter((p) => p.id !== id))
            setDeletingCity(null)
          })
        }}
      />
    </AdminShell>
  )
}
