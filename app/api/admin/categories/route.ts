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
import { isSafeHttpUrl } from '@/lib/url-safety'
import {
  createGuideCategoryForBuilding,
  deleteGuideCategoryForBuilding,
  listGuideCategoriesForBuilding,
  updateGuideCategoryForBuilding,
} from '@/lib/guide-categories-repository'
import {
  categorySlugConflictMessage,
  isCategorySlugConflictError,
  normalizeCategorySlug,
} from '@/lib/category-slug'

const categoryColorSchema = z.enum(['primary', 'accent', 'muted'])

const iconXorRefine = (data: { iconName: string | null; iconImageUrl: string | null }) => {
  const hasName = Boolean(data.iconName?.trim())
  const hasUrl = Boolean(data.iconImageUrl?.trim())
  return hasName !== hasUrl
}

const buildingSchema = z.object({
  buildingId: z.string().trim().min(1).max(120),
})

const createCategorySchema = buildingSchema
  .extend({
    title: z.string().trim().min(1).max(180),
    slug: z.string().trim().max(180).optional(),
    shortDescription: z.string().trim().max(500).optional().default(''),
    iconName: z.string().trim().min(1).max(80).nullable(),
    iconImageUrl: z.string().trim().nullable(),
    categoryColor: categoryColorSchema.optional(),
  })
  .refine(iconXorRefine, { message: 'Provide exactly one of iconName or iconImageUrl.' })
  .refine(
    (data) => {
      if (!data.iconImageUrl?.trim()) return true
      return isSafeHttpUrl(data.iconImageUrl.trim())
    },
    { message: 'iconImageUrl must be a valid http(s) URL.' }
  )

const updateCategorySchema = buildingSchema
  .extend({
    slug: z.string().trim().min(1).max(180),
    newSlug: z.string().trim().max(180).optional(),
    title: z.string().trim().min(1).max(180),
    shortDescription: z.string().trim().max(500).optional().default(''),
    iconName: z.string().trim().min(1).max(80).nullable(),
    iconImageUrl: z.string().trim().nullable(),
    categoryColor: categoryColorSchema,
  })
  .refine(iconXorRefine, { message: 'Provide exactly one of iconName or iconImageUrl.' })
  .refine(
    (data) => {
      if (!data.iconImageUrl?.trim()) return true
      return isSafeHttpUrl(data.iconImageUrl.trim())
    },
    { message: 'iconImageUrl must be a valid http(s) URL.' }
  )

const deleteCategorySchema = buildingSchema.extend({
  slug: z.string().trim().min(1).max(180),
})

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  const buildingId = request.nextUrl.searchParams.get('buildingId')?.trim()
  if (!buildingId) {
    return NextResponse.json({ error: 'Missing buildingId query parameter.' }, { status: 400 })
  }
  try {
    const rows = await listGuideCategoriesForBuilding(buildingId)
    return NextResponse.json(rows)
  } catch (err) {
    logApiError('admin-guide-categories-list', err)
    return serverErrorResponse('Failed to load guide categories.')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableGuideCategories()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-guide-categories-create:${getRequestIp(request)}`, {
    limit: 30,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = createCategorySchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid category payload.', details: body.error.flatten() }, { status: 400 })
  }

  try {
    let normalizedSlug: string
    try {
      normalizedSlug = normalizeCategorySlug(body.data.slug, body.data.title)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid category URL path.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const created = await createGuideCategoryForBuilding(body.data.buildingId, {
      title: body.data.title,
      slug: normalizedSlug,
      shortDescription: body.data.shortDescription,
      iconName: body.data.iconName?.trim() ? body.data.iconName.trim() : null,
      iconImageUrl: body.data.iconImageUrl?.trim() ? body.data.iconImageUrl.trim() : null,
      categoryColor: body.data.categoryColor,
    })
    return NextResponse.json(created)
  } catch (err) {
    if (isCategorySlugConflictError(err)) {
      return NextResponse.json({ error: categorySlugConflictMessage() }, { status: 409 })
    }
    logApiError('admin-guide-categories-create', err)
    return serverErrorResponse('Failed to create guide category.')
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireMutableGuideCategories()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-guide-categories-update:${getRequestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = updateCategorySchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid category payload.', details: body.error.flatten() }, { status: 400 })
  }

  try {
    let nextSlug: string | undefined
    if (body.data.newSlug !== undefined) {
      try {
        nextSlug = normalizeCategorySlug(body.data.newSlug, body.data.title)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid category URL path.'
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    const updated = await updateGuideCategoryForBuilding(body.data.buildingId, body.data.slug, {
      title: body.data.title,
      newSlug: nextSlug && nextSlug !== body.data.slug ? nextSlug : undefined,
      shortDescription: body.data.shortDescription,
      iconName: body.data.iconName?.trim() ? body.data.iconName.trim() : null,
      iconImageUrl: body.data.iconImageUrl?.trim() ? body.data.iconImageUrl.trim() : null,
      categoryColor: body.data.categoryColor,
    })
    return NextResponse.json(updated)
  } catch (err) {
    if (isCategorySlugConflictError(err)) {
      return NextResponse.json({ error: categorySlugConflictMessage() }, { status: 409 })
    }
    logApiError('admin-guide-categories-update', err)
    return serverErrorResponse('Failed to update guide category.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireMutableGuideCategories()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-guide-categories-delete:${getRequestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = deleteCategorySchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  try {
    await deleteGuideCategoryForBuilding(body.data.buildingId, body.data.slug)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logApiError('admin-guide-categories-delete', err)
    return serverErrorResponse('Failed to delete guide category.')
  }
}
