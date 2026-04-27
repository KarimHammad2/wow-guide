import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminSession, requireMutableSitePages } from '@/lib/admin-api'
import { firstUnsafeSectionUrl, sitePageContentPayloadSchema } from '@/lib/admin-content-sections-validation'
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
import { getSitePageAdmin, insertSitePage, listSitePagesAdmin } from '@/lib/site-pages-repository'
import { assertSitePageSlugAllowed, normalizeSitePageSlug } from '@/lib/site-page-slug'

const createBodySchema = z.object({
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: sitePageContentPayloadSchema.optional(),
})

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  try {
    const pages = await listSitePagesAdmin()
    return NextResponse.json(pages)
  } catch (error) {
    logApiError('admin-site-pages-list', error)
    return serverErrorResponse('Unable to list site pages.')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableSitePages()
  if (!auth.ok) return auth.response
  const limiter = checkRateLimit(`admin-site-pages-create:${getRequestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = createBodySchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const slug = normalizeSitePageSlug(body.data.slug)
  const reserved = await getBuildingReservedUrlSegments()
  const slugCheck = assertSitePageSlugAllowed(slug, { reservedBuildingSegments: reserved })
  if (!slugCheck.ok) {
    return NextResponse.json({ error: slugCheck.error }, { status: 400 })
  }

  const existing = await getSitePageAdmin(slug)
  if (existing) {
    return NextResponse.json({ error: 'A page with this URL already exists.' }, { status: 409 })
  }

  const content = body.data.content
  if (content?.visualDocument !== undefined && !isVisualGuideDocument(content.visualDocument)) {
    return NextResponse.json({ error: 'Invalid visualDocument payload.' }, { status: 400 })
  }
  const sections = sitePagePayloadSectionsForValidation({
    sections: content?.sections,
    visualDocument: content?.visualDocument,
  })
  const unsafe = firstUnsafeSectionUrl(sections as Parameters<typeof firstUnsafeSectionUrl>[0])
  if (unsafe) {
    return NextResponse.json({ error: unsafe }, { status: 400 })
  }

  try {
    const created = await insertSitePage({
      slug,
      title: body.data.title.trim(),
      intro: content?.intro ?? '',
      alert: content?.alert,
      sections,
      visualDocument: isVisualGuideDocument(content?.visualDocument) ? content.visualDocument : null,
    })
    return NextResponse.json(created)
  } catch (error) {
    logApiError('admin-site-pages-create', error)
    return serverErrorResponse('Unable to create site page.')
  }
}
