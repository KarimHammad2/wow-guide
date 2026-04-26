import { createSupabaseAdmin } from '@/lib/supabase/admin'

export const GUIDE_MEDIA_BUCKET = 'guide-media'
export const GUIDE_MEDIA_MAX_BYTES = 25 * 1024 * 1024
export const GUIDE_MEDIA_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
] as const

const GUIDE_MEDIA_EXT_TO_MIME: Record<string, (typeof GUIDE_MEDIA_ALLOWED_MIME_TYPES)[number]> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpe: 'image/jpeg',
  jfif: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
}

const MIME_ALIASES: Record<string, (typeof GUIDE_MEDIA_ALLOWED_MIME_TYPES)[number]> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
}

/**
 * First bytes of the file — catches OneDrive / drag-drop cases where both `Blob.type` and
 * the file name are missing or wrong.
 */
export function sniffGuideMediaContentType(head: Uint8Array): string | null {
  if (head.length < 4) return null

  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) {
    return 'image/png'
  }
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    head.length >= 6 &&
    head[0] === 0x47 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x38 &&
    (head[4] === 0x37 || head[4] === 0x39) &&
    head[5] === 0x61
  ) {
    return 'image/gif'
  }
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    return 'image/webp'
  }
  if (head.length >= 12 && head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) {
    return 'video/mp4'
  }
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) {
    return 'video/webm'
  }

  return null
}

/**
 * Resolves a canonical allowed MIME type for uploads. Some browsers (notably on Windows)
 * omit `Blob.type` or send `application/octet-stream` for valid images; we then infer from
 * the file name extension. Also normalizes legacy JPEG / PNG MIME variants to canonical types.
 */
export function resolveGuideMediaContentType(file: Blob & { name?: string }): string | null {
  const allowed = new Set<string>(GUIDE_MEDIA_ALLOWED_MIME_TYPES)

  const rawFull = (file.type ?? '').trim().toLowerCase()
  const raw = rawFull.split(';')[0]?.trim() ?? ''
  const canonical = MIME_ALIASES[raw] ?? raw

  if (canonical && raw !== 'application/octet-stream' && allowed.has(canonical as (typeof GUIDE_MEDIA_ALLOWED_MIME_TYPES)[number])) {
    return canonical as (typeof GUIDE_MEDIA_ALLOWED_MIME_TYPES)[number]
  }

  const fileName = typeof file.name === 'string' ? file.name : ''
  const extMatch = fileName.match(/\.([a-z0-9]+)$/i)
  const ext = extMatch?.[1]?.toLowerCase()
  if (!ext) return null

  const fromExt = GUIDE_MEDIA_EXT_TO_MIME[ext]
  if (fromExt && allowed.has(fromExt)) return fromExt
  return null
}

let guideMediaBucketReady: Promise<void> | null = null

function pathSegments(input: string): string[] {
  return input
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
}

function resolveFromPath(pathname: string): string | null {
  const segments = pathSegments(pathname)
  const bucketIndex = segments.indexOf(GUIDE_MEDIA_BUCKET)
  if (bucketIndex < 0 || bucketIndex >= segments.length - 1) return null
  return segments.slice(bucketIndex + 1).join('/')
}

/**
 * Resolves a guide-media object path from either a public Supabase URL or a raw bucket-relative path.
 */
export function resolveGuideMediaPath(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) {
    try {
      return resolveFromPath(new URL(trimmed).pathname)
    } catch {
      return null
    }
  }

  return resolveFromPath(trimmed)
}

export async function ensureGuideMediaBucket(admin: ReturnType<typeof createSupabaseAdmin>) {
  if (!guideMediaBucketReady) {
    guideMediaBucketReady = (async () => {
      const { data: buckets, error } = await admin.storage.listBuckets()
      if (error) throw error

      if (!buckets?.some((bucket) => bucket.id === GUIDE_MEDIA_BUCKET)) {
        const { error: createError } = await admin.storage.createBucket(GUIDE_MEDIA_BUCKET, {
          public: true,
          fileSizeLimit: GUIDE_MEDIA_MAX_BYTES,
          allowedMimeTypes: [...GUIDE_MEDIA_ALLOWED_MIME_TYPES],
        })
        if (createError) throw createError
      }
    })().catch((error: unknown) => {
      guideMediaBucketReady = null
      throw error
    })
  }

  return guideMediaBucketReady
}
