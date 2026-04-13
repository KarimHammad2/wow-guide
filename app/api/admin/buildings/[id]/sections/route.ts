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
import { isSafeHttpUrl, isSafeNavigationTarget } from '@/lib/url-safety'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  createBuildingGuideCategory,
  deleteBuildingGuideCategory,
  getBuildingGuideCategory,
  updateBuildingGuideCategory,
  listBuildingGuideSections,
} from '@/lib/building-guides-repository'
import type { Category, ContentSection } from '@/lib/data'

interface RouteContext {
  params: Promise<{ id: string }>
}

const contentItemSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
    link: z.string().optional(),
    items: z.array(contentItemSchema).optional(),
  })
)

const contentSectionSchema = z.object({
  id: z.string().min(1),
  blockId: z.string().optional(),
  type: z.enum([
    'text',
    'steps',
    'alert',
    'card',
    'accordion',
    'schedule',
    'contact',
    'manual',
    'image',
    'tabs',
    'hero',
    'checklist',
    'media',
    'video',
    'links',
    'gallery',
    'list',
    'button',
  ]),
  title: z.string().optional(),
  content: z.string().optional(),
  items: z.array(contentItemSchema).optional(),
  variant: z.enum(['info', 'warning', 'success', 'danger']).optional(),
  mediaUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  buttonUrl: z.string().optional(),
  textLinkUrl: z.string().optional(),
  caption: z.string().optional(),
  layout: z.enum(['default', 'split', 'full-bleed']).optional(),
  styleVariant: z.enum(['default', 'highlighted', 'minimal']).optional(),
  textColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  fontSize: z.number().int().min(10).max(72).optional(),
  fontFamily: z.string().optional(),
  blockWidth: z.number().int().min(120).max(1400).optional(),
  blockHeight: z.number().int().min(60).max(1200).optional(),
  rowId: z.string().optional(),
})

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
})

const bulkSectionMutationSchema = z.object({
  sections: z.array(sectionMutationSchema),
})

function firstUnsafeSectionUrl(sections: z.infer<typeof contentSectionSchema>[]): string | null {
  const stack = [...sections]
  while (stack.length > 0) {
    const section = stack.pop()
    if (!section) continue

    if (section.videoUrl && !isSafeHttpUrl(section.videoUrl)) {
      return `Invalid videoUrl for section "${section.id}".`
    }
    if (section.mediaUrl && !isSafeNavigationTarget(section.mediaUrl)) {
      return `Invalid mediaUrl for section "${section.id}".`
    }
    if (section.buttonUrl && !isSafeNavigationTarget(section.buttonUrl)) {
      return `Invalid buttonUrl for section "${section.id}".`
    }
    if (section.textLinkUrl && !isSafeNavigationTarget(section.textLinkUrl)) {
      return `Invalid textLinkUrl for section "${section.id}".`
    }

    for (const item of section.items ?? []) {
      if (item.link && !isSafeNavigationTarget(item.link)) {
        return `Invalid link for item "${item.id}" in section "${section.id}".`
      }
      if (item.image && !isSafeNavigationTarget(item.image)) {
        return `Invalid image URL for item "${item.id}" in section "${section.id}".`
      }
      if (item.items?.length) {
        stack.push({
          id: section.id,
          type: section.type,
          title: section.title,
          content: section.content,
          items: item.items,
          variant: section.variant,
          mediaUrl: section.mediaUrl,
          videoUrl: section.videoUrl,
          caption: section.caption,
          layout: section.layout,
          styleVariant: section.styleVariant,
        })
      }
    }
  }

  return null
}

function normalizeSections(sections: z.infer<typeof contentSectionSchema>[]): ContentSection[] {
  return sections.map((section, index) => ({
    ...section,
    blockId: section.blockId ?? section.id,
    title: section.title ?? `${section.type} block ${index + 1}`,
  })) as ContentSection[]
}

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
      intro: payload.intro ?? '',
      alert: payload.alert,
      sections: normalizeSections(payload.sections ?? []),
    })
    return NextResponse.json(created)
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
            intro: payload.intro ?? existing.content.intro,
            alert: payload.alert,
            sections: payload.sections ? normalizeSections(payload.sections) : existing.content.sections,
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
      intro: payload.intro ?? existing.content.intro,
      alert: payload.alert,
      sections: payload.sections ? normalizeSections(payload.sections) : existing.content.sections,
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
