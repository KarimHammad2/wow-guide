import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin, requireMutableAdmin } from '@/lib/admin-api'
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  updateTeamMember,
} from '@/lib/admin-store'

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response
  return NextResponse.json(getTeamMembers())
}

export async function POST(request: NextRequest) {
  const auth = requireMutableAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  const created = createTeamMember({
    name: body.name ?? 'New Team Member',
    email: body.email ?? '',
    access: body.access === 'read-only' ? 'read-only' : 'full-access',
  })
  return NextResponse.json(created)
}

export async function PUT(request: NextRequest) {
  const auth = requireMutableAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  const updated = updateTeamMember({
    id: body.id,
    name: body.name ?? 'Team Member',
    email: body.email ?? '',
    access: body.access === 'read-only' ? 'read-only' : 'full-access',
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest) {
  const auth = requireMutableAdmin(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  deleteTeamMember(body.id)
  return NextResponse.json({ ok: true })
}
