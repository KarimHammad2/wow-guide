import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { requireMutableBuildings } from '@/lib/admin-api'
import {
  getRequestIp,
  logApiError,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

const extByMime: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableBuildings()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-building-image-upload:${getRequestIp(request)}`, {
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
    return NextResponse.json({ error: 'File too large (max 5MB).' }, { status: 400 })
  }

  const type = file.type || 'application/octet-stream'
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: 'Unsupported image type.' }, { status: 400 })
  }

  const ext = extByMime[type] ?? 'bin'
  const path = `uploads/${crypto.randomUUID()}.${ext}`

  try {
    const admin = createSupabaseAdmin()
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await admin.storage.from('building-images').upload(path, buffer, {
      contentType: type,
      upsert: false,
    })

    if (uploadError) {
      logApiError('admin-building-image-upload-storage', uploadError)
      return serverErrorResponse('Upload failed.')
    }

    const { data: pub } = admin.storage.from('building-images').getPublicUrl(path)
    if (!pub?.publicUrl) {
      return serverErrorResponse('Could not resolve public URL.')
    }

    return NextResponse.json({ url: pub.publicUrl })
  } catch (err) {
    logApiError('admin-building-image-upload', err)
    return serverErrorResponse('Upload failed.')
  }
}
