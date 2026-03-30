'use client'

import { useEffect, useState } from 'react'
import { Plus, MapPinned, Pencil, Trash2 } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog'
import type { City } from '@/lib/admin-types'

export default function AdminCitiesPage() {
  const { access, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [newCityName, setNewCityName] = useState('')
  const [newCityCountry, setNewCityCountry] = useState('Switzerland')
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
    <AdminShell
      access={access}
      onLogout={logout}
      summary={[{ label: 'Cities', value: cities.length }]}
    >
      <ModuleHeader
        title="Cities"
        description="Maintain your supported city list used in building records."
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><MapPinned className="w-5 h-5" />City List</CardTitle>
            <CardDescription>Add, edit, and remove cities.</CardDescription>
          </div>
          <Button size="sm" className="gap-1.5" disabled={!canEdit} onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add City
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.country}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={() => {
                          setEditingCity(city)
                          setEditOpen(true)
                        }}
                        className="h-8 w-8 p-0"
                        title="Edit city"
                        aria-label="Edit city"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!canEdit || saving}
                        onClick={() => setDeletingCity(city)}
                        className="h-8 w-8 p-0"
                        title="Delete city"
                        aria-label="Delete city"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            <Input value={newCityCountry} onChange={(e) => setNewCityCountry(e.target.value)} placeholder="Country" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !newCityName.trim() || !newCityCountry.trim()}
              onClick={() =>
                mutate(async () => {
                  const created = await adminRequest<City>('/api/admin/cities', {
                    method: 'POST',
                    body: JSON.stringify({ name: newCityName, country: newCityCountry }),
                  })
                  setCities((prev) => [...prev, created])
                  setNewCityName('')
                  setNewCityCountry('Switzerland')
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
            <DialogDescription>Update city and country details.</DialogDescription>
          </DialogHeader>
          {editingCity && (
            <div className="space-y-3">
              <Input value={editingCity.name} onChange={(e) => setEditingCity((prev) => (prev ? { ...prev, name: e.target.value } : prev))} placeholder="City name" />
              <Input value={editingCity.country} onChange={(e) => setEditingCity((prev) => (prev ? { ...prev, country: e.target.value } : prev))} placeholder="Country" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !editingCity?.name.trim() || !editingCity?.country.trim()}
              onClick={() =>
                mutate(async () => {
                  if (!editingCity) return
                  const updated = await adminRequest<City>('/api/admin/cities', {
                    method: 'PUT',
                    body: JSON.stringify(editingCity),
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
          if (!deletingCity) return
          void mutate(async () => {
            await adminRequest('/api/admin/cities', {
              method: 'DELETE',
              body: JSON.stringify({ id: deletingCity.id }),
            })
            setCities((prev) => prev.filter((p) => p.id !== deletingCity.id))
            setDeletingCity(null)
          })
        }}
      />
    </AdminShell>
  )
}
