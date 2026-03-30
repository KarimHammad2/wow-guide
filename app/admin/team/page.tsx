'use client'

import { useEffect, useState } from 'react'
import { Plus, Users, Pencil, Trash2 } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ModuleHeader } from '@/components/admin/module-header'
import { useAdminSession, type AdminAccess } from '@/components/admin/use-admin-session'
import { adminRequest } from '@/components/admin/admin-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import type { TeamMember } from '@/lib/admin-types'

export default function AdminTeamPage() {
  const { access, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<TeamMember[]>([])
  const [newItem, setNewItem] = useState<Omit<TeamMember, 'id'>>({
    name: '',
    email: '',
    access: 'read-only',
  })
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TeamMember | null>(null)
  const [deletingItem, setDeletingItem] = useState<TeamMember | null>(null)

  useEffect(() => {
    if (loading) return
    void adminRequest<TeamMember[]>('/api/admin/teams')
      .then(setItems)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load team data'
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
      summary={[{ label: 'Team members', value: items.length }]}
    >
      <ModuleHeader
        title="Team Access"
        description="Manage team members and set access level to read-only or full-access."
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Team Members</CardTitle>
            <CardDescription>Full-access members can edit and delete records in admin modules.</CardDescription>
          </div>
          <Button size="sm" className="gap-1.5" disabled={!canEdit} onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Team Member
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Access</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.access}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={() => {
                          setEditingItem(member)
                          setEditOpen(true)
                        }}
                        className="h-8 w-8 p-0"
                        title="Edit team member"
                        aria-label="Edit team member"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!canEdit || saving}
                        onClick={() => setDeletingItem(member)}
                        className="h-8 w-8 p-0"
                        title="Delete team member"
                        aria-label="Delete team member"
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
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Create a new team member and assign access level.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
            <Input value={newItem.email} onChange={(e) => setNewItem((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
            <Select value={newItem.access} onValueChange={(value: AdminAccess) => setNewItem((p) => ({ ...p, access: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="read-only">read-only</SelectItem>
                <SelectItem value="full-access">full-access</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !newItem.name.trim() || !newItem.email.trim()}
              onClick={() =>
                mutate(async () => {
                  const created = await adminRequest<TeamMember>('/api/admin/teams', {
                    method: 'POST',
                    body: JSON.stringify(newItem),
                  })
                  setItems((prev) => [...prev, created])
                  setNewItem({ name: '', email: '', access: 'read-only' })
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
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update member details and access level.</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-3">
              <Input value={editingItem.name} onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, name: e.target.value } : prev))} placeholder="Name" />
              <Input value={editingItem.email} onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, email: e.target.value } : prev))} placeholder="Email" />
              <Select
                value={editingItem.access}
                onValueChange={(value: AdminAccess) => setEditingItem((prev) => (prev ? { ...prev, access: value } : prev))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="read-only">read-only</SelectItem>
                  <SelectItem value="full-access">full-access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              disabled={!canEdit || saving || !editingItem?.name.trim() || !editingItem?.email.trim()}
              onClick={() =>
                mutate(async () => {
                  if (!editingItem) return
                  const updated = await adminRequest<TeamMember>('/api/admin/teams', {
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
        title="Delete team member?"
        description={
          deletingItem
            ? `Delete ${deletingItem.name}? This action cannot be undone.`
            : 'This action cannot be undone.'
        }
        disabled={saving}
        onConfirm={() => {
          if (!deletingItem) return
          void mutate(async () => {
            await adminRequest('/api/admin/teams', {
              method: 'DELETE',
              body: JSON.stringify({ id: deletingItem.id }),
            })
            setItems((prev) => prev.filter((p) => p.id !== deletingItem.id))
            setDeletingItem(null)
          })
        }}
      />
    </AdminShell>
  )
}
