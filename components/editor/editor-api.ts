'use client'

import type { VisualGuideDocument } from '@/lib/visual-builder-schema'

function parseJsonBody(text: string): unknown {
  if (!text.trim()) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

async function editorRequest<T>(url: string, init?: RequestInit): Promise<T> {
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

export interface EditorDocumentResponse {
  buildingId: string
  categorySlug: string
  ownerUserId: string | null
  isPublished: boolean
  document: VisualGuideDocument
}

export async function getEditorDocument(buildingId: string, categorySlug: string) {
  return editorRequest<EditorDocumentResponse>(`/api/editor/categories/${buildingId}/${categorySlug}`)
}

export async function saveEditorDocument(buildingId: string, categorySlug: string, document: VisualGuideDocument) {
  return editorRequest<{ ownerUserId: string | null; isPublished: boolean; document: VisualGuideDocument }>(
    `/api/editor/categories/${buildingId}/${categorySlug}`,
    {
      method: 'PUT',
      body: JSON.stringify({ document }),
    }
  )
}

export async function publishEditorDocument(buildingId: string, categorySlug: string) {
  return editorRequest<{ ownerUserId: string | null; isPublished: boolean; document: VisualGuideDocument }>(
    `/api/editor/categories/${buildingId}/${categorySlug}`,
    { method: 'POST' }
  )
}

export async function uploadEditorMedia(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  let response: Response
  try {
    response = await fetch('/api/editor/media', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      body: formData,
    })
  } catch {
    throw new Error('Could not reach media upload service.')
  }
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

export async function deleteEditorMedia(url: string): Promise<{ ok: true }> {
  let response: Response
  try {
    response = await fetch('/api/editor/media', {
      method: 'DELETE',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })
  } catch {
    throw new Error('Could not reach media delete service.')
  }
  const text = await response.text()
  const data = parseJsonBody(text)
  if (!response.ok) {
    const err =
      data && typeof data === 'object' && data !== null && 'error' in data
        ? (data as { error?: unknown }).error
        : undefined
    throw new Error(typeof err === 'string' && err ? err : 'Delete failed')
  }
  return (data as { ok: true }) ?? { ok: true }
}
