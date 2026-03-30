'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Hotel, ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

export default function AdminBuildingsPage() {
  const { access, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [newBuilding, setNewBuilding] = useState<Omit<Building, 'id'>>({
    name: '',
    address: '',
    city: '',
    country: 'Switzerland',
    imageUrl: '/images/buildings/kannenfeldstrasse.jpg',
    emergencyPhone: '',
    supportEmail: '',
    welcomeMessage: '',
  })
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null)

  useEffect(() => {
    if (loading) return
    void adminRequest<Building[]>('/api/admin/buildings')
      .then(setBuildings)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load buildings'
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
      summary={[{ label: 'Buildings', value: buildings.length }]}
    >
      <ModuleHeader
        title="Buildings"
        description="Create and manage buildings. New buildings automatically get default guide sections."
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Hotel className="w-5 h-5" />Building List</CardTitle>
            <CardDescription>Open section editor per building or edit building details here.</CardDescription>
          </div>
          <Button size="sm" className="gap-1.5" disabled={!canEdit} onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Building
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Support Email</TableHead>
                <TableHead>Emergency Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildings.map((building) => (
                <TableRow key={building.id}>
                  <TableCell className="font-medium">{building.name}</TableCell>
                  <TableCell>{building.city}</TableCell>
                  <TableCell>{building.country}</TableCell>
                  <TableCell>{building.supportEmail}</TableCell>
                  <TableCell>{building.emergencyPhone}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link href={`/admin/buildings/${building.id}/sections`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          Sections
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
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
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Building</DialogTitle>
            <DialogDescription>Create a new building. Default guide sections will be generated automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Building name" value={newBuilding.name} onChange={(e) => setNewBuilding((p) => ({ ...p, name: e.target.value }))} />
            <div className="grid sm:grid-cols-2 gap-2">
              <Input placeholder="Address" value={newBuilding.address} onChange={(e) => setNewBuilding((p) => ({ ...p, address: e.target.value }))} />
              <Input placeholder="City" value={newBuilding.city} onChange={(e) => setNewBuilding((p) => ({ ...p, city: e.target.value }))} />
              <Input placeholder="Country" value={newBuilding.country} onChange={(e) => setNewBuilding((p) => ({ ...p, country: e.target.value }))} />
              <Input placeholder="Image URL" value={newBuilding.imageUrl} onChange={(e) => setNewBuilding((p) => ({ ...p, imageUrl: e.target.value }))} />
              <Input placeholder="Emergency phone" value={newBuilding.emergencyPhone} onChange={(e) => setNewBuilding((p) => ({ ...p, emergencyPhone: e.target.value }))} />
              <Input placeholder="Support email" value={newBuilding.supportEmail} onChange={(e) => setNewBuilding((p) => ({ ...p, supportEmail: e.target.value }))} />
            </div>
            <Textarea placeholder="Welcome message" rows={3} value={newBuilding.welcomeMessage} onChange={(e) => setNewBuilding((p) => ({ ...p, welcomeMessage: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !newBuilding.name.trim() || !newBuilding.city.trim() || !newBuilding.address.trim()}
              onClick={() =>
                mutate(async () => {
                  const created = await adminRequest<Building>('/api/admin/buildings', {
                    method: 'POST',
                    body: JSON.stringify(newBuilding),
                  })
                  setBuildings((prev) => [...prev, created])
                  setNewBuilding({
                    name: '',
                    address: '',
                    city: '',
                    country: 'Switzerland',
                    imageUrl: '/images/buildings/kannenfeldstrasse.jpg',
                    emergencyPhone: '',
                    supportEmail: '',
                    welcomeMessage: '',
                  })
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
              <Input value={editingBuilding.name} onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, name: e.target.value } : prev))} placeholder="Building name" />
              <div className="grid sm:grid-cols-2 gap-2">
                <Input value={editingBuilding.address} onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, address: e.target.value } : prev))} placeholder="Address" />
                <Input value={editingBuilding.city} onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, city: e.target.value } : prev))} placeholder="City" />
                <Input value={editingBuilding.country} onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, country: e.target.value } : prev))} placeholder="Country" />
                <Input value={editingBuilding.imageUrl} onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, imageUrl: e.target.value } : prev))} placeholder="Image URL" />
                <Input value={editingBuilding.emergencyPhone} onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, emergencyPhone: e.target.value } : prev))} placeholder="Emergency phone" />
                <Input value={editingBuilding.supportEmail} onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, supportEmail: e.target.value } : prev))} placeholder="Support email" />
              </div>
              <Textarea rows={3} value={editingBuilding.welcomeMessage} onChange={(e) => setEditingBuilding((prev) => (prev ? { ...prev, welcomeMessage: e.target.value } : prev))} placeholder="Welcome message" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !editingBuilding?.name.trim() || !editingBuilding?.city.trim() || !editingBuilding?.address.trim()}
              onClick={() =>
                mutate(async () => {
                  if (!editingBuilding) return
                  const updated = await adminRequest<Building>('/api/admin/buildings', {
                    method: 'PUT',
                    body: JSON.stringify(editingBuilding),
                  })
                  setBuildings((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
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
    </AdminShell>
  )
}
