import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdminSession, requireMutableEmergency } from '@/lib/admin-api'
import {
  deleteEmergencyContact,
  insertEmergencyContact,
  listEmergencyContacts,
  updateEmergencyContact,
} from '@/lib/emergency-repository'
import type { EmergencyInfo } from '@/lib/admin-types'

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  try {
    const rows = await listEmergencyContacts()
    return NextResponse.json(rows)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load emergency contacts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableEmergency()
  if (!auth.ok) return auth.response
  const body = await request.json()
  try {
    const created = await insertEmergencyContact({
      label: body.label ?? 'Emergency',
      phone: body.phone ?? '',
      email: body.email ?? '',
    })
    return NextResponse.json(created)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireMutableEmergency()
  if (!auth.ok) return auth.response
  const body = (await request.json()) as EmergencyInfo
  try {
    const updated = await updateEmergencyContact(body)
    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireMutableEmergency()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 })
  }
  try {
    await deleteEmergencyContact(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
