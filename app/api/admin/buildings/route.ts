import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin, requireFullAccess } from '@/lib/admin-api'
import {
  createBuilding,
  deleteBuilding,
  getEffectiveSupportContact,
  getBuildings,
  updateBuilding,
} from '@/lib/admin-store'

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toAppPath(value: unknown, fallbackName: string) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (/^\/building\/[a-z0-9-]+$/i.test(raw)) {
    return raw
  }
  return `/building/${toSlug(fallbackName || 'new-building')}`
}

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response
  return NextResponse.json(getBuildings())
}

export async function POST(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  const supportContact = getEffectiveSupportContact()
  const name = body.name ?? 'New Building'
  const created = createBuilding({
    name,
    address: body.address ?? '',
    city: body.city ?? '',
    appPath: toAppPath(body.appPath, name),
    country: 'Switzerland',
    imageUrl: body.imageUrl ?? '/images/buildings/kannenfeldstrasse.jpg',
    emergencyPhone: supportContact.phone,
    supportEmail: supportContact.email,
    welcomeMessage: '',
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
