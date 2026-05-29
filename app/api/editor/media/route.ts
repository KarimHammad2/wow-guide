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

  let body: { url?: unknown; path?: unknown }
  try {
    body = (await request.json()) as { url?: unknown; path?: unknown }
  } catch {
    return NextResponse.json({ error: 'Expected JSON body.' }, { status: 400 })
  }

  const candidate = typeof body.url === 'string' ? body.url : typeof body.path === 'string' ? body.path : ''
  const path = resolveGuideMediaPath(candidate)
  if (!path) {
    return NextResponse.json({ error: 'Invalid media URL.' }, { status: 400 })
  }

  try {
    const admin = createSupabaseAdmin()
    await ensureGuideMediaBucket(admin)
    const { error: removeError } = await admin.storage.from(GUIDE_MEDIA_BUCKET).remove([path])
    if (removeError) {
      logApiError('editor-media-delete-storage', removeError)
      return serverErrorResponse('Delete failed.')
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    logApiError('editor-media-delete', error)
    return serverErrorResponse('Delete failed.')
  }
}
