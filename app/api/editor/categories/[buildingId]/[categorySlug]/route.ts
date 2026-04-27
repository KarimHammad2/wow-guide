import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireEditorSession } from '@/lib/editor-api'
import {
  getEditorCategoryContent,
  publishEditorCategoryDraft,
  saveEditorCategoryDraft,
  setCategoryContentInheritance,
} from '@/lib/building-guides-repository'
import { contentInheritancePayloadSchema } from '@/lib/content-inheritance'
import {
  validateVisualDocumentUrls,
  visualFromGuideContent,
  visualGuideDocumentSchema,
} from '@/lib/visual-builder-schema'
import {
  getRequestIp,
  logApiError,
  parseJsonBody,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'

interface RouteContext {
  params: Promise<{ buildingId: string; categorySlug: string }>
}

const savePayloadSchema = z.object({
  document: visualGuideDocumentSchema,
  contentInheritance: contentInheritancePayloadSchema.optional(),
})

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireEditorSession()
  if (!auth.ok) return auth.response
  const { buildingId, categorySlug } = await context.params
  try {
    const row = await getEditorCategoryContent(buildingId, categorySlug)
    if (!row) {
      return NextResponse.json({ error: 'Category content not found.' }, { status: 404 })
    }
    if (row.ownerUserId && row.ownerUserId !== auth.auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const resolvedDocument = row.content.visualDocument ?? visualFromGuideContent(row.content)
    return NextResponse.json({
      buildingId: row.buildingId,
      categorySlug: row.categorySlug,
      ownerUserId: row.ownerUserId,
      isPublished: row.isPublished,
      /** Merged (inheritance + draft/local), not raw `draft_content` — that would hide inherited blocks. */
      document: resolvedDocument,
      publishedSections: row.content.sections,
      contentInheritance: row.contentStored.contentInheritance ?? null,
      sourceInheritanceAvailable: row.sourceInheritanceAvailable,
    })
  } catch (error) {
    logApiError('editor-categories-get', error)
    return serverErrorResponse('Failed to load editor content.')
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireEditorSession()
  if (!auth.ok) return auth.response
  const limiter = checkRateLimit(`editor-category-save:${getRequestIp(request)}`, {
    limit: 120,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const payload = savePayloadSchema.safeParse(parsedBody.data)
  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid visual document payload.' }, { status: 400 })
  }
  const unsafeUrl = validateVisualDocumentUrls(payload.data.document)
  if (unsafeUrl) return NextResponse.json({ error: unsafeUrl }, { status: 400 })

  const { buildingId, categorySlug } = await context.params
  try {
    if (payload.data.contentInheritance !== undefined) {
      await setCategoryContentInheritance(
        buildingId,
        categorySlug,
        payload.data.contentInheritance,
        auth.auth.userId
      )
    }
    const row = await saveEditorCategoryDraft(buildingId, categorySlug, auth.auth.userId, payload.data.document)
    const resolvedAfterSave = row.content.visualDocument ?? visualFromGuideContent(row.content)
    return NextResponse.json({
      ownerUserId: row.ownerUserId,
      isPublished: row.isPublished,
      document: resolvedAfterSave,
      contentInheritance: row.contentStored.contentInheritance ?? null,
      sourceInheritanceAvailable: row.sourceInheritanceAvailable,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save draft.'
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (
      message === 'A category cannot inherit from itself.' ||
      message === 'Inheritance would create a cycle.' ||
      message === 'Inheritance chain is too long or would create a cycle.' ||
      message === 'Source category was not found.' ||
      message === 'Invalid inheritance: missing source building or category.'
    ) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    logApiError('editor-categories-save', error)
    return serverErrorResponse('Failed to save draft.')
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireEditorSession()
  if (!auth.ok) return auth.response
  const limiter = checkRateLimit(`editor-category-publish:${getRequestIp(request)}`, {
    limit: 30,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const { buildingId, categorySlug } = await context.params
  try {
    const row = await publishEditorCategoryDraft(buildingId, categorySlug, auth.auth.userId)
    const resolvedAfterPublish = row.content.visualDocument ?? visualFromGuideContent(row.content)
    return NextResponse.json({
      ownerUserId: row.ownerUserId,
      isPublished: row.isPublished,
      document: resolvedAfterPublish,
      contentInheritance: row.contentStored.contentInheritance ?? null,
      sourceInheritanceAvailable: row.sourceInheritanceAvailable,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to publish.'
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    logApiError('editor-categories-publish', error)
    return serverErrorResponse('Failed to publish category content.')
  }
}
