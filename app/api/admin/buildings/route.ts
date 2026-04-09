import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminSession, requireMutableBuildings } from '@/lib/admin-api'
import {
  getRequestIp,
  logApiError,
  parseJsonBody,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import {
  createBuilding,
  deleteBuilding,
  getExistingBuildingIdSet,
  listBuildings,
  updateBuilding,
} from '@/lib/buildings-repository'
import { getPrimarySupportContact } from '@/lib/emergency-repository'
import type { Building } from '@/lib/data'
import { checkRateLimit } from '@/lib/rate-limit'
import { isSafeHttpUrl, isSafeNavigationTarget } from '@/lib/url-safety'

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toAppPath(value: unknown, fallbackName: string) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (/^\/[a-z0-9-]+$/i.test(raw)) {
    return raw
  }
  const legacy = raw.match(/^\/building\/([a-z0-9-]+)$/i)
  if (legacy) {
    return `/${legacy[1]}`
  }
  return `/${toSlug(fallbackName || 'new-building')}`
}

function requiredBuildingFields(body: Record<string, unknown>) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  const city = typeof body.city === 'string' ? body.city.trim() : ''
  const quietHours = typeof body.quietHours === 'string' ? body.quietHours.trim() : ''
  const googleMapsUrl = typeof body.googleMapsUrl === 'string' ? body.googleMapsUrl.trim() : ''
  if (!name || !address || !city || !quietHours || !googleMapsUrl) {
    return 'Missing or empty required fields: name, address, city, quietHours, googleMapsUrl.'
  }
  if (!isSafeHttpUrl(googleMapsUrl)) {
    return 'googleMapsUrl must be a valid http(s) URL.'
  }

  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : ''
  if (imageUrl && !isSafeNavigationTarget(imageUrl)) {
    return 'imageUrl must be a safe relative path or an http(s) URL.'
  }
  return null
}

const buildingMutationSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(180),
  address: z.string().trim().min(1).max(250),
  city: z.string().trim().min(1).max(120),
  appPath: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  welcomeMessage: z.string().optional(),
  googleMapsUrl: z.string().trim().min(1),
  quietHours: z.string().trim().min(1).max(250),
  goodToKnow: z.string().optional(),
})

const buildingDeleteSchema = z.object({
  id: z.string().trim().min(1),
})

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  try {
    const buildings = await listBuildings()
    return NextResponse.json(buildings)
  } catch (error) {
    logApiError('admin-buildings-list', error)
    return serverErrorResponse('Unable to load buildings.')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableBuildings()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-buildings-create:${getRequestIp(request)}`, {
    limit: 30,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const validated = buildingMutationSchema.safeParse(parsedBody.data)
  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid building payload.' }, { status: 400 })
  }
  const body = validated.data as Record<string, unknown>

  const invalid = requiredBuildingFields(body)
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 })
  }
  const name = typeof body.name === 'string' ? body.name.trim() : 'New Building'
  const googleMapsUrl = typeof body.googleMapsUrl === 'string' ? body.googleMapsUrl.trim() : ''
  try {
    const [supportContact, existingIds] = await Promise.all([
      getPrimarySupportContact(),
      getExistingBuildingIdSet(),
    ])
    const created = await createBuilding(
      {
        name,
        address: typeof body.address === 'string' ? body.address.trim() : '',
        city: typeof body.city === 'string' ? body.city.trim() : '',
        appPath: toAppPath(body.appPath, name),
        country: 'Switzerland',
        imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : '/images/buildings/kannenfeldstrasse.jpg',
        emergencyPhone: supportContact.phone,
        supportEmail: supportContact.email,
        welcomeMessage: typeof body.welcomeMessage === 'string' ? body.welcomeMessage : '',
        googleMapsUrl,
        quietHours: typeof body.quietHours === 'string' ? body.quietHours.trim() : '',
        goodToKnow: typeof body.goodToKnow === 'string' ? body.goodToKnow : '',
      },
      { support: supportContact, existingIds }
    )
    return NextResponse.json(created)
  } catch (error) {
    logApiError('admin-buildings-create', error)
    return serverErrorResponse('Unable to create building.')
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireMutableBuildings()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-buildings-update:${getRequestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const validated = buildingMutationSchema.safeParse(parsedBody.data)
  if (!validated.success || !validated.data.id) {
    return NextResponse.json({ error: 'Invalid building payload.' }, { status: 400 })
  }
  const body = validated.data as Record<string, unknown>

  const invalid = requiredBuildingFields(body)
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 })
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const googleMapsUrl = typeof body.googleMapsUrl === 'string' ? body.googleMapsUrl.trim() : ''
  const base = body as unknown as Building
  try {
    const updated = await updateBuilding({
      ...base,
      name,
      address: typeof body.address === 'string' ? body.address.trim() : '',
      city: typeof body.city === 'string' ? body.city.trim() : '',
      appPath: toAppPath(body.appPath, name),
      googleMapsUrl,
      quietHours: typeof body.quietHours === 'string' ? body.quietHours.trim() : '',
      goodToKnow: typeof body.goodToKnow === 'string' ? body.goodToKnow : '',
    })
    return NextResponse.json(updated)
  } catch (error) {
    logApiError('admin-buildings-update', error)
    return serverErrorResponse('Unable to update building.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireMutableBuildings()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-buildings-delete:${getRequestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = buildingDeleteSchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  try {
    await deleteBuilding(body.data.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    logApiError('admin-buildings-delete', error)
    return serverErrorResponse('Unable to delete building.')
  }
}
