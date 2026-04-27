import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminSession, requireMutableSitePages } from '@/lib/admin-api'
import {
  firstUnsafeSectionUrl,
  normalizeSections,
  sitePageContentUpdateSchema,
} from '@/lib/admin-content-sections-validation'
import type { ContentSection } from '@/lib/data'
import {
  getRequestIp,
  logApiError,
  parseJsonBody,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { getBuildingReservedUrlSegments } from '@/lib/buildings-repository'
import { sitePagePayloadSectionsForValidation } from '@/lib/site-pages-api-content'
import { isVisualGuideDocument } from '@/lib/visual-builder-schema'
import {
  deleteSitePage,
  getSitePageAdmin,
  updateSitePage,
} from '@/lib/site-pages-repository'
import { assertSitePageSlugAllowed, normalizeSitePageSlug } from '@/lib/site-page-slug'

interface RouteContext {
  params: Promise<{ slug: string }>
}

const updateBodySchema = z.object({
  slug: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200).optional(),
  content: sitePageContentUpdateSchema.optional(),
})

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  const { slug: rawSlug } = await context.params
  const slug = decodeURIComponent(rawSlug)
  try {
    const page = await getSitePageAdmin(slug)
    if (!page) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(page)
  } catch (error) {
    logApiError('admin-site-pages-get', error)
    return serverErrorResponse('Unable to load site page.')
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireMutableSitePages()
  if (!auth.ok) return auth.response
  const limiter = checkRateLimit(`admin-site-pages-update:${getRequestIp(request)}`, {
    limit: 120,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const { slug: rawSlug } = await context.params
  const slug = decodeURIComponent(rawSlug)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = updateBodySchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const existing = await getSitePageAdmin(slug)
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const reserved = await getBuildingReservedUrlSegments()
  let nextSlug = slug
  if (body.data.slug !== undefined) {
    nextSlug = normalizeSitePageSlug(body.data.slug)
    const slugCheck = assertSitePageSlugAllowed(nextSlug, { reservedBuildingSegments: reserved })
    if (!slugCheck.ok) {
      return NextResponse.json({ error: slugCheck.error }, { status: 400 })
    }
    if (nextSlug !== slug) {
      const collision = await getSitePageAdmin(nextSlug)
      if (collision) {
        return NextResponse.json({ error: 'A page with this URL already exists.' }, { status: 409 })
      }
    }
  }

  const content = body.data.content
  let sectionsToSave: ContentSection[] | undefined
  let visualToSave: unknown | null | undefined

  if (content !== undefined) {
    if ('visualDocument' in content) {
      const vd = content.visualDocument
      if (vd !== null && vd !== undefined && !isVisualGuideDocument(vd)) {
        return NextResponse.json({ error: 'Invalid visualDocument payload.' }, { status: 400 })
      }
      if (isVisualGuideDocument(vd)) {
        const derived = sitePagePayloadSectionsForValidation({ visualDocument: vd })
        const unsafe = firstUnsafeSectionUrl(derived as Parameters<typeof firstUnsafeSectionUrl>[0])
        if (unsafe) {
          return NextResponse.json({ error: unsafe }, { status: 400 })
        }
        sectionsToSave = derived
        visualToSave = vd
      } else if (vd === null) {
        visualToSave = null
        if (content.sections !== undefined) {
          const normalized = normalizeSections(content.sections)
          const unsafe = firstUnsafeSectionUrl(normalized as Parameters<typeof firstUnsafeSectionUrl>[0])
          if (unsafe) {
            return NextResponse.json({ error: unsafe }, { status: 400 })
          }
          sectionsToSave = normalized
        }
      }
    } else if (content.sections !== undefined) {
      const normalized = normalizeSections(content.sections)
      const unsafe = firstUnsafeSectionUrl(normalized as Parameters<typeof firstUnsafeSectionUrl>[0])
      if (unsafe) {
        return NextResponse.json({ error: unsafe }, { status: 400 })
      }
      sectionsToSave = normalized
    }
  }

  try {
    const updated = await updateSitePage(slug, {
      newSlug: nextSlug !== slug ? nextSlug : undefined,
      title: body.data.title?.trim(),
      intro: content?.intro,
      alert:
        body.data.content !== undefined && 'alert' in body.data.content
          ? body.data.content.alert
          : undefined,
      sections: sectionsToSave,
      visualDocument: visualToSave,
    })
    return NextResponse.json(updated)
  } catch (error) {
    logApiError('admin-site-pages-update', error)
    return serverErrorResponse('Unable to update site page.')
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireMutableSitePages()
  if (!auth.ok) return auth.response
  const limiter = checkRateLimit(`admin-site-pages-delete:${getRequestIp(request)}`, {
    limit: 120,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const { slug: rawSlug } = await context.params
  const slug = decodeURIComponent(rawSlug)

  try {
    const existing = await getSitePageAdmin(slug)
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await deleteSitePage(slug)
    return NextResponse.json({ ok: true })
  } catch (error) {
    logApiError('admin-site-pages-delete', error)
    return serverErrorResponse('Unable to delete site page.')
  }
}
