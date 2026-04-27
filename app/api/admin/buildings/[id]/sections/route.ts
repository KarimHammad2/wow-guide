import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminSession, requireMutableBuildingSections } from '@/lib/admin-api'
import {
  getRequestIp,
  logApiError,
  parseJsonBody,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  createBuildingGuideCategory,
  deleteBuildingGuideCategory,
  getBuildingGuideCategory,
  updateBuildingGuideCategory,
  listBuildingGuideSections,
} from '@/lib/building-guides-repository'
import { contentInheritancePayloadSchema } from '@/lib/content-inheritance'
import {
  contentSectionSchema,
  firstUnsafeSectionUrl,
  normalizeSections,
} from '@/lib/admin-content-sections-validation'
import type { Category, ContentSection } from '@/lib/data'

interface RouteContext {
  params: Promise<{ id: string }>
}

const sectionMutationSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1).max(120).optional(),
  subtitle: z.string().max(200).optional(),
  icon: z.string().max(80).optional(),
  color: z.enum(['primary', 'accent', 'muted']).optional(),
  intro: z.string().optional(),
  alert: z
    .object({
      type: z.enum(['info', 'warning', 'success', 'danger']),
      message: z.string().min(1),
    })
    .optional(),
  sections: z.array(contentSectionSchema).optional(),
  order: z.number().int().positive().optional(),
  /** Building home Quick Access; null clears. Omitted leaves unchanged on update. */
  quickAccessOrder: z.union([z.number().int().min(1).max(32), z.null()]).optional(),
  contentInheritance: contentInheritancePayloadSchema.optional(),
})

const bulkSectionMutationSchema = z.object({
  sections: z.array(sectionMutationSchema),
})

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const sections = await listBuildingGuideSections(id)
  return NextResponse.json(sections)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireMutableBuildingSections()
  if (!auth.ok) return auth.response
  const limiter = checkRateLimit(`admin-sections-create:${getRequestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)
  const { id } = await context.params
  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = sectionMutationSchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid section payload.' }, { status: 400 })
  }
  const payload = body.data
  const unsafeUrlError = firstUnsafeSectionUrl(payload.sections ?? [])
  if (unsafeUrlError) {
    return NextResponse.json({ error: unsafeUrlError }, { status: 400 })
  }
  try {
    const created = await createBuildingGuideCategory(id, {
      slug: payload.slug ?? payload.title ?? 'section',
      title: payload.title ?? 'New Section',
      subtitle: payload.subtitle ?? 'Guide details',
      icon: payload.icon ?? 'BookOpen',
      color: (payload.color as Category['color']) ?? 'primary',
      quickAccessOrder: payload.quickAccessOrder,
      intro: payload.intro ?? '',
      alert: payload.alert,
      sections: normalizeSections(payload.sections ?? []),
    })
    return NextResponse.json({
      category: created.category,
      content: created.content,
      quickAccessOrder: payload.quickAccessOrder ?? null,
    })
  } catch (error) {
    logApiError('admin-sections-create', error)
    return serverErrorResponse('Unable to create guide section.')
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireMutableBuildingSections()
  if (!auth.ok) return auth.response
  const limiter = checkRateLimit(`admin-sections-update:${getRequestIp(request)}`, {
    limit: 120,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)
  const { id } = await context.params
  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const json = parsedBody.data
  const bulk = bulkSectionMutationSchema.safeParse(json)
  if (bulk.success) {
    const bulkUnsafeUrlError = bulk.data.sections
      .map((section) => firstUnsafeSectionUrl(section.sections ?? []))
      .find((message): message is string => Boolean(message))
    if (bulkUnsafeUrlError) {
      return NextResponse.json({ error: bulkUnsafeUrlError }, { status: 400 })
    }
    try {
      const updates = await Promise.all(
        bulk.data.sections.map(async (payload) => {
          const existing = await getBuildingGuideCategory(id, payload.slug)
          if (!existing) {
            throw new Error(`Guide section not found: ${payload.slug}`)
          }
          return updateBuildingGuideCategory(id, payload.slug, {
            title: payload.title ?? existing.category.title,
            subtitle: payload.subtitle ?? existing.category.subtitle,
            icon: payload.icon ?? existing.category.icon,
            color: (payload.color as Category['color']) ?? existing.category.color,
            order: payload.order ?? existing.category.order,
            quickAccessOrder:
              payload.quickAccessOrder !== undefined ? payload.quickAccessOrder : undefined,
            intro: payload.intro ?? existing.content.intro,
            alert: payload.alert,
            sections: payload.sections ? normalizeSections(payload.sections) : existing.content.sections,
            contentInheritance:
              payload.contentInheritance !== undefined
                ? payload.contentInheritance
                : existing.content.contentInheritance,
          })
        })
      )
      return NextResponse.json(updates)
    } catch (error) {
      logApiError('admin-sections-bulk-update', error)
      return NextResponse.json({ error: 'Unable to save sections.' }, { status: 400 })
    }
  }

  const body = sectionMutationSchema.safeParse(json)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid section payload', details: body.error.flatten() }, { status: 400 })
  }
  const payload = body.data
  const unsafeUrlError = firstUnsafeSectionUrl(payload.sections ?? [])
  if (unsafeUrlError) {
    return NextResponse.json({ error: unsafeUrlError }, { status: 400 })
  }
  const categorySlug = payload.slug as string
  const existing = await getBuildingGuideCategory(id, categorySlug)
  if (!existing) {
    return NextResponse.json({ error: 'Guide section not found' }, { status: 404 })
  }

  try {
    const updated = await updateBuildingGuideCategory(id, categorySlug, {
      title: payload.title ?? existing.category.title,
      subtitle: payload.subtitle ?? existing.category.subtitle,
      icon: payload.icon ?? existing.category.icon,
      color: (payload.color as Category['color']) ?? existing.category.color,
      order: payload.order ?? existing.category.order,
      quickAccessOrder:
        payload.quickAccessOrder !== undefined ? payload.quickAccessOrder : undefined,
      intro: payload.intro ?? existing.content.intro,
      alert: payload.alert,
      sections: payload.sections ? normalizeSections(payload.sections) : existing.content.sections,
      contentInheritance:
        payload.contentInheritance !== undefined
          ? payload.contentInheritance
          : existing.content.contentInheritance,
    })
    return NextResponse.json(updated)
  } catch (error) {
    logApiError('admin-sections-update', error)
    return serverErrorResponse('Unable to update guide section.')
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireMutableBuildingSections()
  if (!auth.ok) return auth.response
  const limiter = checkRateLimit(`admin-sections-delete:${getRequestIp(request)}`, {
    limit: 120,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)
  const { id } = await context.params
  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = z.object({ slug: z.string().trim().min(1) }).safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  try {
    await deleteBuildingGuideCategory(id, body.data.slug)
    return NextResponse.json({ ok: true })
  } catch (error) {
    logApiError('admin-sections-delete', error)
    return serverErrorResponse('Unable to delete guide section.')
  }
}
