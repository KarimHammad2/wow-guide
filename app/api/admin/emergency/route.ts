import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin, requireFullAccess } from '@/lib/admin-api'
import {
  createEmergencyInfo,
  deleteEmergencyInfo,
  getEmergencyInfos,
  updateEmergencyInfo,
} from '@/lib/admin-store'

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response
  return NextResponse.json(getEmergencyInfos())
}

export async function POST(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  const created = createEmergencyInfo({
    label: body.label ?? 'Emergency',
    phone: body.phone ?? '',
    email: body.email ?? '',
  })
  return NextResponse.json(created)
}

export async function PUT(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  const updated = updateEmergencyInfo(body)
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  deleteEmergencyInfo(body.id)
  return NextResponse.json({ ok: true })
}
