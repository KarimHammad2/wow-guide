import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminSession, requireMutableGuideCategories } from '@/lib/admin-api'
import {
  getRequestIp,
  logApiError,
  parseJsonBody,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  assignCategoryToBuilding,
  listAssignmentsForBuilding,
  unassignCategoryFromBuilding,
} from '@/lib/guide-categories-repository'

const assignSchema = z.object({
  buildingId: z.string().trim().min(1).max(120),
  categoryId: z.string().trim().uuid(),
  isRequired: z.boolean().optional(),
})

const unassignSchema = assignSchema

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const buildingId = request.nextUrl.searchParams.get('buildingId')?.trim()
  if (!buildingId) {
    return NextResponse.json({ error: 'Missing buildingId query parameter.' }, { status: 400 })
  }

  try {
    const rows = await listAssignmentsForBuilding(buildingId)
    return NextResponse.json(rows)
  } catch (err) {
    logApiError('admin-category-assignments-list', err)
    return serverErrorResponse('Failed to load category assignments.')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableGuideCategories()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-category-assign:${getRequestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = assignSchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid assignment payload.' }, { status: 400 })
  }

  try {
    await assignCategoryToBuilding(body.data.buildingId, body.data.categoryId, {
      isRequired: body.data.isRequired,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assignment failed'
    logApiError('admin-category-assign', err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireMutableGuideCategories()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-category-unassign:${getRequestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = unassignSchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid unassign payload.' }, { status: 400 })
  }

  try {
    await unassignCategoryFromBuilding(body.data.buildingId, body.data.categoryId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logApiError('admin-category-unassign', err)
    return serverErrorResponse('Failed to remove category assignment.')
  }
}
