import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { requireEditorSession } from '@/lib/editor-api'
import {
  ensureGuideMediaBucket,
  GUIDE_MEDIA_BUCKET,
  GUIDE_MEDIA_MAX_BYTES,
  resolveGuideMediaContentType,
  resolveGuideMediaPath,
  sniffGuideMediaContentType,
} from '@/lib/editor-media'
import {
  getRequestIp,
  logApiError,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_BYTES = GUIDE_MEDIA_MAX_BYTES

const extByMime: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

export async function POST(request: NextRequest) {
  const auth = await requireEditorSession()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`editor-media-upload:${getRequestIp(request)}`, {
    limit: 30,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file field.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 25MB).' }, { status: 400 })
  }
  let type = resolveGuideMediaContentType(file)
  if (!type) {
    const head = new Uint8Array(await file.slice(0, 32).arrayBuffer())
    type = sniffGuideMediaContentType(head)
  }
  if (!type) {
    return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 })
  }

  const ext = extByMime[type] ?? 'bin'
  const path = `${auth.auth.userId}/${crypto.randomUUID()}.${ext}`

  try {
    const admin = createSupabaseAdmin()
    await ensureGuideMediaBucket(admin)
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await admin.storage.from(GUIDE_MEDIA_BUCKET).upload(path, buffer, {
      contentType: type,
      upsert: false,
    })
    if (uploadError) {
      logApiError('editor-media-upload-storage', uploadError)
      return serverErrorResponse('Upload failed.')
    }
    const { data: pub } = admin.storage.from(GUIDE_MEDIA_BUCKET).getPublicUrl(path)
    if (!pub?.publicUrl) {
      return serverErrorResponse('Could not resolve public URL.')
    }
    return NextResponse.json({ url: pub.publicUrl })
  } catch (error) {
    logApiError('editor-media-upload', error)
    return serverErrorResponse('Upload failed.')
  }
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
