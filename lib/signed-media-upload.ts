import { createSupabaseAdmin } from '@/lib/supabase/admin'

export type SignMediaUploadInput = {
  fileName: string
  contentType: string
  size: number
}

export type SignMediaUploadResult = {
  url: string
  path: string
  token: string
  bucket: string
}

export type MediaUploadBucketConfig = {
  bucket: string
  maxBytes: number
  extByMime: Record<string, string>
  resolveType: (input: SignMediaUploadInput) => string | null
  buildObjectPath: (context: { ext: string; userId?: string }) => string
  ensureBucket?: (admin: ReturnType<typeof createSupabaseAdmin>) => Promise<void>
}

export function parseSignMediaUploadInput(body: unknown): SignMediaUploadInput | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  if (typeof record.fileName !== 'string' || typeof record.contentType !== 'string') return null
  if (typeof record.size !== 'number' || !Number.isFinite(record.size) || record.size < 0) return null
  return {
    fileName: record.fileName,
    contentType: record.contentType,
    size: record.size,
  }
}

export async function signMediaUpload(
  config: MediaUploadBucketConfig,
  input: SignMediaUploadInput,
  context: { userId?: string }
): Promise<SignMediaUploadResult | { error: string; status: number }> {
  if (input.size > config.maxBytes) {
    const maxMb = Math.round(config.maxBytes / (1024 * 1024))
    return { error: `File too large (max ${maxMb}MB).`, status: 400 }
  }

  const type = config.resolveType(input)
  if (!type) {
    return { error: 'Unsupported file type.', status: 400 }
  }

  const ext = config.extByMime[type] ?? 'bin'
  const path = config.buildObjectPath({ ext, userId: context.userId })

  try {
    const admin = createSupabaseAdmin()
    if (config.ensureBucket) {
      await config.ensureBucket(admin)
    }

    const { data, error } = await admin.storage.from(config.bucket).createSignedUploadUrl(path)
    if (error || !data?.token) {
      return { error: 'Could not prepare upload.', status: 500 }
    }

    const { data: pub } = admin.storage.from(config.bucket).getPublicUrl(path)
    if (!pub?.publicUrl) {
      return { error: 'Could not resolve public URL.', status: 500 }
    }

    return {
      url: pub.publicUrl,
      path: data.path,
      token: data.token,
      bucket: config.bucket,
    }
  } catch {
    return { error: 'Could not prepare upload.', status: 500 }
  }
}
