import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireMutableBuildings } from '@/lib/admin-api'
import {
  getRequestIp,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { parseSignMediaUploadInput, signMediaUpload } from '@/lib/signed-media-upload'

const MAX_BYTES = 5 * 1024 * 1024
const BUCKET = 'building-images'
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

const extByMime: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const extFromFileName = (fileName: string): string | null => {
  const match = fileName.match(/\.([a-z0-9]+)$/i)
  const ext = match?.[1]?.toLowerCase()
  if (!ext) return null
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return null
}

const buildingImageSignConfig = {
  bucket: BUCKET,
  maxBytes: MAX_BYTES,
  extByMime,
  resolveType: (input: { fileName: string; contentType: string }) => {
    const type = (input.contentType || 'application/octet-stream').trim().toLowerCase()
    if (ALLOWED_TYPES.has(type)) return type
    return extFromFileName(input.fileName)
  },
  buildObjectPath: ({ ext }: { ext: string }) => `uploads/${crypto.randomUUID()}.${ext}`,
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableBuildings()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-building-image-upload:${getRequestIp(request)}`, {
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

  const signed = await signMediaUpload(buildingImageSignConfig, input, {})
  if ('error' in signed) {
    return NextResponse.json({ error: signed.error }, { status: signed.status })
  }

  return NextResponse.json(signed)
}
