'use client'

import { uploadFileViaSignedUrl } from '@/lib/client-signed-upload'

function parseJsonBody(text: string): unknown {
  if (!text.trim()) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

export async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const text = await response.text()
  const data = parseJsonBody(text)

  if (!response.ok) {
    const err =
      data && typeof data === 'object' && data !== null && 'error' in data
        ? (data as { error?: unknown }).error
        : undefined
    throw new Error(typeof err === 'string' && err ? err : 'Request failed')
  }

  return data as T
}

/** Signed direct-to-Supabase upload for building list images. */
export async function adminUploadBuildingImage(file: File): Promise<{ url: string }> {
  return uploadFileViaSignedUrl('/api/admin/buildings/image', file)
}

/** Signed direct-to-Supabase upload for category icon images. */
export async function adminUploadCategoryIcon(file: File): Promise<{ url: string }> {
  return uploadFileViaSignedUrl('/api/admin/categories/icon', file)
}
