'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, AlertTriangle, Pencil } from 'lucide-react'
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
import type { EmergencyInfo } from '@/lib/admin-types'

export default function AdminEmergencyPage() {
  const { email, canManageTeam, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<EmergencyInfo[]>([])
  const [newItem, setNewItem] = useState<Omit<EmergencyInfo, 'id'>>({
    label: 'Emergency contact',
    phone: '',
    email: '',
  })
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EmergencyInfo | null>(null)
  const [deletingItem, setDeletingItem] = useState<EmergencyInfo | null>(null)

  useEffect(() => {
    if (loading) return
    void adminRequest<EmergencyInfo[]>('/api/admin/emergency')
      .then(setItems)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load emergency data'
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
        title="Emergency Management"
        description="Create, edit, and delete emergency records with phone and email details."
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card className="rounded-3xl min-w-0">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />Emergency Contacts</CardTitle>
            <CardDescription>These values are used across admin-managed guide pages.</CardDescription>
          </div>
          <Button size="sm" className="gap-1.5 w-full sm:w-auto shrink-0" disabled={!canEdit} onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Emergency
          </Button>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="w-full overflow-x-auto -mx-1 px-1 pb-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        title="Edit emergency record"
                        aria-label="Edit emergency record"
                        disabled={!canEdit}
                        onClick={() => {
                          setEditingItem(item)
                          setEditOpen(true)
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        title="Delete emergency record"
                        aria-label="Delete emergency record"
                        disabled={!canEdit || saving}
                        onClick={() => setDeletingItem(item)}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Emergency Record</DialogTitle>
            <DialogDescription>Create a new emergency contact record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newItem.label}
              onChange={(e) => setNewItem((p) => ({ ...p, label: e.target.value }))}
              placeholder="Label"
            />
            <Input
              value={newItem.phone}
              onChange={(e) => setNewItem((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Phone"
            />
            <Input
              value={newItem.email}
              onChange={(e) => setNewItem((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !newItem.label.trim() || !newItem.phone.trim() || !newItem.email.trim()}
              onClick={() =>
                mutate(async () => {
                  const created = await adminRequest<EmergencyInfo>('/api/admin/emergency', {
                    method: 'POST',
                    body: JSON.stringify(newItem),
                  })
                  setItems((prev) => [...prev, created])
                  setNewItem({ label: 'Emergency contact', phone: '', email: '' })
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
            <DialogTitle>Edit Emergency Record</DialogTitle>
            <DialogDescription>Update emergency contact details.</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-3">
              <Input
                value={editingItem.label}
                onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, label: e.target.value } : prev))}
                placeholder="Label"
              />
              <Input
                value={editingItem.phone}
                onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
                placeholder="Phone"
              />
              <Input
                value={editingItem.email}
                onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
                placeholder="Email"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !editingItem?.label.trim() || !editingItem?.phone.trim() || !editingItem?.email.trim()}
              onClick={() =>
                mutate(async () => {
                  if (!editingItem) return
                  const updated = await adminRequest<EmergencyInfo>('/api/admin/emergency', {
                    method: 'PUT',
                    body: JSON.stringify(editingItem),
                  })
                  setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
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
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null)
        }}
        title="Delete emergency record?"
        description={
          deletingItem
            ? `Delete ${deletingItem.label}? This action cannot be undone.`
            : 'This action cannot be undone.'
        }
        disabled={saving}
        onConfirm={() => {
          const id = deletingItem?.id
          if (!id) return
          void mutate(async () => {
            await adminRequest('/api/admin/emergency', {
              method: 'DELETE',
              body: JSON.stringify({ id }),
            })
            setItems((prev) => prev.filter((p) => p.id !== id))
            setDeletingItem(null)
          })
        }}
      />
    </AdminShell>
  )
}
