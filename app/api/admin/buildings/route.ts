import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin, requireFullAccess } from '@/lib/admin-api'
import {
  createBuilding,
  deleteBuilding,
  getBuildings,
  updateBuilding,
} from '@/lib/admin-store'

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response
  return NextResponse.json(getBuildings())
}

export async function POST(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  const created = createBuilding({
    name: body.name ?? 'New Building',
    address: body.address ?? '',
    city: body.city ?? '',
    country: body.country ?? 'Switzerland',
    imageUrl: body.imageUrl ?? '/images/buildings/kannenfeldstrasse.jpg',
    emergencyPhone: body.emergencyPhone ?? '',
    supportEmail: body.supportEmail ?? '',
    welcomeMessage: body.welcomeMessage ?? '',
  })
  return NextResponse.json(created)
}

export async function PUT(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  const updated = updateBuilding(body)
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  deleteBuilding(body.id)
  return NextResponse.json({ ok: true })
}
