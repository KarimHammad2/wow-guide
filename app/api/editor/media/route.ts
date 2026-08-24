import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireEditorSession } from '@/lib/editor-api'
import {
  ensureGuideMediaBucket,
  GUIDE_MEDIA_BUCKET,
  GUIDE_MEDIA_MAX_BYTES,
  resolveGuideMediaContentType,
  resolveGuideMediaPath,
} from '@/lib/editor-media'
import {
  getRequestIp,
  logApiError,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { parseSignMediaUploadInput, signMediaUpload } from '@/lib/signed-media-upload'
import {
  clearGuideMediaOrphan,
  loadGuideMediaReferenceScan,
  orphanGuideMediaIfUnreferenced,
  isMissingOrphansTableError,
} from '@/lib/guide-media-orphans'
import { isVisualGuideDocument, type VisualGuideDocument } from '@/lib/visual-builder-schema'

const extByMime: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

const guideMediaSignConfig = {
  bucket: GUIDE_MEDIA_BUCKET,
  maxBytes: GUIDE_MEDIA_MAX_BYTES,
  extByMime,
  resolveType: (input: { fileName: string; contentType: string }) =>
    resolveGuideMediaContentType(new File([], input.fileName, { type: input.contentType })),
  buildObjectPath: ({ ext, userId }: { ext: string; userId?: string }) =>
    `${userId ?? 'anonymous'}/${crypto.randomUUID()}.${ext}`,
  ensureBucket: ensureGuideMediaBucket,
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorSession()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`editor-media-upload:${getRequestIp(request)}`, {
    limit: 30,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Expected JSON body with file metadata.' }, { status: 400 })
  }

  const input = parseSignMediaUploadInput(body)
  if (!input) {
    return NextResponse.json({ error: 'Invalid upload metadata.' }, { status: 400 })
  }

  const signed = await signMediaUpload(guideMediaSignConfig, input, { userId: auth.auth.userId })
  if ('error' in signed) {
    return NextResponse.json({ error: signed.error }, { status: signed.status })
  }

  try {
    const admin = createSupabaseAdmin()
    const cleared = await clearGuideMediaOrphan(admin, signed.path)
    if (cleared.error) {
      logApiError('editor-media-upload-clear-orphan', cleared.error)
    }
  } catch (error) {
    logApiError('editor-media-upload-clear-orphan', error)
  }

  return NextResponse.json(signed)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireEditorSession()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`editor-media-delete:${getRequestIp(request)}`, {
    limit: 30,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  let body: {
    url?: unknown
    path?: unknown
    excludeBuildingId?: unknown
    excludeCategorySlug?: unknown
    excludeSitePageSlug?: unknown
    currentDocument?: unknown
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Expected JSON body.' }, { status: 400 })
  }

  const candidate = typeof body.url === 'string' ? body.url : typeof body.path === 'string' ? body.path : ''
  const path = resolveGuideMediaPath(candidate)
  if (!path) {
    return NextResponse.json({ error: 'Invalid media URL.' }, { status: 400 })
  }

  const excludeBuildingId = typeof body.excludeBuildingId === 'string' ? body.excludeBuildingId : undefined
  const excludeCategorySlug = typeof body.excludeCategorySlug === 'string' ? body.excludeCategorySlug : undefined
  const excludeSitePageSlug = typeof body.excludeSitePageSlug === 'string' ? body.excludeSitePageSlug : undefined
  const currentDocument =
    body.currentDocument && isVisualGuideDocument(body.currentDocument)
      ? (body.currentDocument as VisualGuideDocument)
      : undefined

  try {
    const admin = createSupabaseAdmin()
    await ensureGuideMediaBucket(admin)

    const loaded = await loadGuideMediaReferenceScan(admin)
    if ('error' in loaded) {
      logApiError(
        loaded.source === 'categories' ? 'editor-media-delete-categories' : 'editor-media-delete-site-pages',
        loaded.error
      )
      return serverErrorResponse('Delete failed.')
    }

    const result = await orphanGuideMediaIfUnreferenced(admin, {
      path,
      url: candidate,
      requestedBy: auth.auth.userId,
      scan: loaded.scan,
      exclude: {
        buildingId: excludeBuildingId,
        categorySlug: excludeCategorySlug,
        sitePageSlug: excludeSitePageSlug,
        currentDocument,
      },
      categoryRef: {
        buildingId: excludeBuildingId,
        categorySlug: excludeCategorySlug,
        sitePageSlug: excludeSitePageSlug,
      },
    })

    if (result.error) {
      logApiError('editor-media-orphan', result.error)
      if (isMissingOrphansTableError(result.error)) {
        return NextResponse.json({ deleted: true, stillReferenced: false })
      }
      return serverErrorResponse('Delete failed.')
    }

    return NextResponse.json({ deleted: result.deleted, stillReferenced: result.stillReferenced })
  } catch (error) {
    logApiError('editor-media-delete', error)
    return serverErrorResponse('Delete failed.')
  }
}
