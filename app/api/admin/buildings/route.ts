import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdminSession, requireMutableAdmin } from '@/lib/admin-api'
import { createBuilding, deleteBuilding, getBuildings, updateBuilding } from '@/lib/admin-store'
import { getPrimarySupportContact } from '@/lib/emergency-repository'

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

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  return NextResponse.json(getBuildings())
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableAdmin()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const supportContact = await getPrimarySupportContact()
  const name = body.name ?? 'New Building'
  const created = createBuilding(
    {
      name,
      address: body.address ?? '',
      city: body.city ?? '',
      appPath: toAppPath(body.appPath, name),
      country: 'Switzerland',
      imageUrl: body.imageUrl ?? '/images/buildings/kannenfeldstrasse.jpg',
      emergencyPhone: supportContact.phone,
      supportEmail: supportContact.email,
      welcomeMessage: '',
    },
    { support: supportContact }
  )
  return NextResponse.json(created)
}

export async function PUT(request: NextRequest) {
  const auth = await requireMutableAdmin()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const updated = updateBuilding(body)
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireMutableAdmin()
  if (!auth.ok) return auth.response
  const body = await request.json()
  deleteBuilding(body.id)
  return NextResponse.json({ ok: true })
}
