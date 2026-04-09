'use client'

import { useEffect, useState } from 'react'
import { Plus, Users, Pencil, Trash2, Copy, Check, KeyRound } from 'lucide-react'
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
import type { TeamMember } from '@/lib/admin-types'

type InviteResponse = TeamMember

export default function AdminTeamPage() {
  const { email, canManageTeam, canEdit, loading, error, setError, logout } = useAdminSession()
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<TeamMember[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TeamMember | null>(null)
  const [deletingItem, setDeletingItem] = useState<TeamMember | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    void adminRequest<TeamMember[]>('/api/admin/teams')
      .then(setItems)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load team data'
        setError(message)
      })
  }, [loading, setError])

  function copyMemberEmail(userId: string, email: string) {
    void navigator.clipboard.writeText(email).then(() => {
      setCopiedUserId(userId)
      window.setTimeout(() => {
        setCopiedUserId((current) => (current === userId ? null : current))
      }, 2000)
    })
  }

  async function mutate(action: () => Promise<void>) {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)
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
        title="Team Access"
        description="Owners invite staff by email and can reset passwords when needed."
      />

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {successMessage}
        </p>
      )}

      <Card className="rounded-3xl min-w-0">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 shrink-0" />
              Staff accounts
            </CardTitle>
            <CardDescription>All listed users can sign in and manage guide content.</CardDescription>
          </div>
          {canManageTeam && (
            <Button size="sm" className="gap-1.5 w-full sm:w-auto shrink-0" disabled={!canEdit} onClick={() => setAddOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              Invite member
            </Button>
          )}
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="w-full overflow-x-auto -mx-1 px-1 pb-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                {canManageTeam && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5 min-w-0 max-w-[min(100%,28rem)]">
                      <span className="truncate">{member.email}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        title="Copy email"
                        onClick={() => copyMemberEmail(member.userId, member.email)}
                      >
                        {copiedUserId === member.userId ? (
                          <Check className="w-3.5 h-3.5 text-green-600" aria-hidden />
                        ) : (
                          <Copy className="w-3.5 h-3.5" aria-hidden />
                        )}
                        <span className="sr-only">Copy email</span>
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{member.displayName ?? '—'}</TableCell>
                  {canManageTeam && (
                    <TableCell className="text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canEdit || saving}
                          title="Reset the account password"
                          onClick={() =>
                            mutate(async () => {
                              await adminRequest<{ ok: boolean }>(
                                '/api/admin/teams/reset-password',
                                {
                                  method: 'POST',
                                  body: JSON.stringify({ userId: member.userId }),
                                }
                              )
                              setSuccessMessage(
                                `Password reset for ${member.email}. Ask the user to use the password recovery flow.`
                              )
                            })
                          }
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reset password</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canEdit || saving}
                          title="Edit display name"
                          onClick={() => {
                            setEditingItem(member)
                            setEditOpen(true)
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {!member.isOwner && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canEdit || saving}
                            title="Remove member"
                            onClick={() => setDeletingItem(member)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
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
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              We create their account and they can set a password using the recovery flow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              autoComplete="off"
            />
            <Input
              placeholder="Display name (optional)"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={saving || !newEmail.trim()}
              onClick={() =>
                mutate(async () => {
                  const created = await adminRequest<InviteResponse>('/api/admin/teams', {
                    method: 'POST',
                    body: JSON.stringify({
                      email: newEmail.trim(),
                      displayName: newDisplayName.trim() || undefined,
                    }),
                  })
                  setItems((prev) => [...prev.filter((m) => m.userId !== created.userId), created])
                  setSuccessMessage(
                    `Account created for ${created.email}. Ask the user to create a password via password recovery.`
                  )
                  setNewEmail('')
                  setNewDisplayName('')
                  setAddOpen(false)
                })
              }
            >
              Create account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit display name</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <Input
              value={editingItem.displayName ?? ''}
              onChange={(e) =>
                setEditingItem((prev) => (prev ? { ...prev, displayName: e.target.value || null } : prev))
              }
              placeholder="Display name"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={saving || !editingItem}
              onClick={() =>
                mutate(async () => {
                  if (!editingItem) return
                  const updated = await adminRequest<TeamMember>('/api/admin/teams', {
                    method: 'PUT',
                    body: JSON.stringify({
                      userId: editingItem.userId,
                      displayName: editingItem.displayName,
                    }),
                  })
                  setItems((prev) => prev.map((m) => (m.userId === updated.userId ? updated : m)))
                  setEditOpen(false)
                  setEditingItem(null)
                })
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Remove team member"
        description="This will delete their login. They will no longer access the admin app."
        disabled={saving}
        onConfirm={() => {
          const userId = deletingItem?.userId
          if (!userId) return
          void mutate(async () => {
            await adminRequest('/api/admin/teams', {
              method: 'DELETE',
              body: JSON.stringify({ userId }),
            })
            setItems((prev) => prev.filter((m) => m.userId !== userId))
            setDeletingItem(null)
          })
        }}
      />
    </AdminShell>
  )
}
