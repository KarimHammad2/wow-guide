import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdminSession, requireMutableCities } from '@/lib/admin-api'
import { deleteCity, insertCity, listCities, updateCity } from '@/lib/cities-repository'
import type { City } from '@/lib/admin-types'

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  try {
    const rows = await listCities()
    return NextResponse.json(rows)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load cities'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableCities()
  if (!auth.ok) return auth.response
  const body = await request.json()
  try {
    const created = await insertCity({
      name: body.name ?? 'New City',
      country: body.country ?? 'Switzerland',
    })
    return NextResponse.json(created)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireMutableCities()
  if (!auth.ok) return auth.response
  const body = (await request.json()) as City
  try {
    const updated = await updateCity({
      id: body.id,
      name: body.name ?? '',
      country: body.country ?? '',
    })
    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireMutableCities()
  if (!auth.ok) return auth.response
  const body = await request.json()
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 })
  }
  try {
    await deleteCity(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
