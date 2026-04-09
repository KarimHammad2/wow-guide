'use client'

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

/** Multipart upload for category icon images (not JSON). */
export async function adminUploadCategoryIcon(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/admin/categories/icon', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    body: formData,
  })
  const text = await response.text()
  const data = parseJsonBody(text)
  if (!response.ok) {
    const err =
      data && typeof data === 'object' && data !== null && 'error' in data
        ? (data as { error?: unknown }).error
        : undefined
    throw new Error(typeof err === 'string' && err ? err : 'Upload failed')
  }
  return data as { url: string }
}
