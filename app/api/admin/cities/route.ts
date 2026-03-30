import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin, requireFullAccess } from '@/lib/admin-api'
import { createCity, deleteCity, getCities, updateCity } from '@/lib/admin-store'

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response
  return NextResponse.json(getCities())
}

export async function POST(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  const created = createCity({
    name: body.name ?? 'New City',
    country: body.country ?? 'Switzerland',
  })
  return NextResponse.json(created)
}

export async function PUT(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  const updated = updateCity({
    id: body.id,
    name: body.name ?? '',
    country: body.country ?? '',
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const body = await request.json()
  deleteCity(body.id)
  return NextResponse.json({ ok: true })
}
