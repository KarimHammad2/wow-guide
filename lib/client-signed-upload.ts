'use client'

import { createClient } from '@/lib/supabase/client'
import { resolveGuideMediaContentType, sniffGuideMediaContentType } from '@/lib/editor-media'

function parseJsonBody(text: string): unknown {
  if (!text.trim()) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

export async function uploadFileViaSignedUrl(
  signEndpoint: string,
  file: File
): Promise<{ url: string }> {
  let contentType = resolveGuideMediaContentType(file)
  if (!contentType) {
    const head = new Uint8Array(await file.slice(0, 32).arrayBuffer())
    contentType = sniffGuideMediaContentType(head)
  }
  if (!contentType) {
    throw new Error('Unsupported file type. Use PNG, JPEG, WebP, GIF, MP4, or WebM.')
  }

  const signResponse = await fetch(signEndpoint, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType,
      size: file.size,
    }),
  })

  const signText = await signResponse.text()
  const signData = parseJsonBody(signText)

  if (!signResponse.ok) {
    const err =
      signData && typeof signData === 'object' && signData !== null && 'error' in signData
        ? (signData as { error?: unknown }).error
        : undefined
    if (signResponse.status === 413) {
      throw new Error('File is too large for this upload method. Try a smaller image or compress it first.')
    }
    throw new Error(typeof err === 'string' && err ? err : 'Upload failed')
  }

  if (
    !signData ||
    typeof signData !== 'object' ||
    !('url' in signData) ||
    !('path' in signData) ||
    !('token' in signData) ||
    !('bucket' in signData) ||
    typeof (signData as { url: unknown }).url !== 'string' ||
    typeof (signData as { path: unknown }).path !== 'string' ||
    typeof (signData as { token: unknown }).token !== 'string' ||
    typeof (signData as { bucket: unknown }).bucket !== 'string'
  ) {
    throw new Error('Upload failed')
  }

  const { url, path, token, bucket } = signData as {
    url: string
    path: string
    token: string
    bucket: string
  }

  const supabase = createClient()
  const { error: uploadError } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
    contentType,
  })

  if (uploadError) {
    throw new Error(uploadError.message || 'Upload failed')
  }

  const check = await fetch(url, { cache: 'no-store' })
  if (!check.ok) {
    throw new Error(`Upload did not persist (server returned ${check.status}). Please try again.`)
  }

  return { url }
}
