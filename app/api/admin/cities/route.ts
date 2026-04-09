import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminSession, requireMutableCities } from '@/lib/admin-api'
import {
  getRequestIp,
  logApiError,
  parseJsonBody,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { deleteCity, insertCity, listCities, updateCity } from '@/lib/cities-repository'

const createCitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120).default('Switzerland'),
})

const updateCitySchema = z.object({
  id: z.string().trim().uuid(),
  name: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
})

const deleteCitySchema = z.object({
  id: z.string().trim().uuid(),
})

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  try {
    const rows = await listCities()
    return NextResponse.json(rows)
  } catch (err) {
    logApiError('admin-cities-list', err)
    return serverErrorResponse('Failed to load cities.')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableCities()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-cities-create:${getRequestIp(request)}`, { limit: 30, windowMs: 60_000 })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = createCitySchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid city payload.' }, { status: 400 })
  }

  try {
    const created = await insertCity({
      name: body.data.name,
      country: body.data.country,
    })
    return NextResponse.json(created)
  } catch (err) {
    logApiError('admin-cities-create', err)
    return serverErrorResponse('Failed to create city.')
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireMutableCities()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-cities-update:${getRequestIp(request)}`, { limit: 60, windowMs: 60_000 })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = updateCitySchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid city payload.' }, { status: 400 })
  }

  try {
    const updated = await updateCity({
      id: body.data.id,
      name: body.data.name,
      country: body.data.country,
    })
    return NextResponse.json(updated)
  } catch (err) {
    logApiError('admin-cities-update', err)
    return serverErrorResponse('Failed to update city.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireMutableCities()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-cities-delete:${getRequestIp(request)}`, { limit: 60, windowMs: 60_000 })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = deleteCitySchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid city payload.' }, { status: 400 })
  }
  try {
    await deleteCity(body.data.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logApiError('admin-cities-delete', err)
    return serverErrorResponse('Failed to delete city.')
  }
}
