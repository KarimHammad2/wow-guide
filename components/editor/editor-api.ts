'use client'

import { uploadFileViaSignedUrl } from '@/lib/client-signed-upload'
import type { ContentInheritance } from '@/lib/admin-types'
import type { VisualGuideDocument } from '@/lib/visual-builder-schema'
import type { Category } from '@/lib/data'

function parseJsonBody(text: string): unknown {
  if (!text.trim()) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

/** Same origin as the page; avoids issues when a browser extension patches `window.fetch`. */
function editorMediaUrl(): string {
  if (typeof window !== 'undefined') {
    return new URL('/api/editor/media', window.location.origin).toString()
  }
  return '/api/editor/media'
}

function xhrJsonDelete(pathOrUrl: string, body: unknown): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('DELETE', pathOrUrl)
    xhr.withCredentials = true
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText })
    xhr.onerror = () => reject(new TypeError('Failed to connect'))
    xhr.onabort = () => reject(new TypeError('Failed to connect'))
    xhr.send(JSON.stringify(body))
  })
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
  /** Catalog heading + icons as updated in Categories admin. */
  category: Category
  document: VisualGuideDocument
  contentInheritance: ContentInheritance | null
  sourceInheritanceAvailable: boolean
}

export async function getEditorDocument(buildingId: string, categorySlug: string) {
  return editorRequest<EditorDocumentResponse>(`/api/editor/categories/${buildingId}/${categorySlug}`)
}

export async function saveEditorDocument(
  buildingId: string,
  categorySlug: string,
  document: VisualGuideDocument,
  contentInheritance?: ContentInheritance | null
) {
  const body: { document: VisualGuideDocument; contentInheritance?: ContentInheritance | null } = { document }
  if (contentInheritance !== undefined) {
    body.contentInheritance = contentInheritance
  }
  return editorRequest<{
    ownerUserId: string | null
    isPublished: boolean
    document: VisualGuideDocument
    contentInheritance: ContentInheritance | null
    sourceInheritanceAvailable: boolean
  }>(`/api/editor/categories/${buildingId}/${categorySlug}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function publishEditorDocument(buildingId: string, categorySlug: string) {
  return editorRequest<{
    ownerUserId: string | null
    isPublished: boolean
    document: VisualGuideDocument
    contentInheritance: ContentInheritance | null
    sourceInheritanceAvailable: boolean
  }>(`/api/editor/categories/${buildingId}/${categorySlug}`, { method: 'POST' })
}

export async function uploadEditorMedia(file: File): Promise<{ url: string }> {
  try {
    return await uploadFileViaSignedUrl(editorMediaUrl(), file)
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        'Could not reach media upload service. If this keeps happening, try a private window or turn off browser extensions (some break file uploads on localhost).'
      )
    }
    throw err instanceof Error ? err : new Error('Upload failed')
  }
}

export type EditorMediaDeleteOptions = {
  excludeBuildingId?: string
  excludeCategorySlug?: string
  excludeSitePageSlug?: string
  currentDocument?: VisualGuideDocument
}

export type EditorMediaDeleteResult = {
  deleted: boolean
  stillReferenced: boolean
}

export async function deleteEditorMedia(
  url: string,
  options?: EditorMediaDeleteOptions
): Promise<EditorMediaDeleteResult> {
  let text: string
  let status: number
  try {
    ;({ status, text } = await xhrJsonDelete(editorMediaUrl(), {
      url,
      excludeBuildingId: options?.excludeBuildingId,
      excludeCategorySlug: options?.excludeCategorySlug,
      excludeSitePageSlug: options?.excludeSitePageSlug,
      currentDocument: options?.currentDocument,
    }))
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        'Could not reach media delete service. If this keeps happening, try a private window or turn off browser extensions (some break requests on localhost).'
      )
    }
    throw new Error('Could not reach media delete service.')
  }
  const data = parseJsonBody(text)
  if (status < 200 || status >= 300) {
    const err =
      data && typeof data === 'object' && data !== null && 'error' in data
        ? (data as { error?: unknown }).error
        : undefined
    throw new Error(typeof err === 'string' && err ? err : 'Delete failed')
  }
  if (
    data &&
    typeof data === 'object' &&
    'deleted' in data &&
    typeof (data as { deleted: unknown }).deleted === 'boolean'
  ) {
    const result = data as { deleted: boolean; stillReferenced?: boolean }
    return {
      deleted: result.deleted,
      stillReferenced: result.stillReferenced === true,
    }
  }
  return { deleted: true, stillReferenced: false }
}
