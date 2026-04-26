import { isSafeHttpUrl } from './url-safety'

function trimInput(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Standard YouTube video IDs are 11 characters from this alphabet. */
function isYoutubeVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

/**
 * Returns a URL safe to use as an iframe `src` for the video block.
 * YouTube watch, share (youtu.be), and shorts links are rewritten to `/embed/<id>`.
 */
export function safeVideoIframeSrc(value: string | null | undefined): string | null {
  const raw = trimInput(value)
  if (!raw || !isSafeHttpUrl(raw)) return null

  const fromYouTube = youtubeUrlToEmbedSrc(raw)
  if (fromYouTube !== undefined) return fromYouTube

  return raw
}

/** `undefined` = not a YouTube URL we handle; `null` = YouTube host but no usable id */
function youtubeUrlToEmbedSrc(raw: string): string | null | undefined {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return undefined
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase()

  const youtubeHosts = new Set([
    'youtube.com',
    'm.youtube.com',
    'music.youtube.com',
    'youtube-nocookie.com',
    'youtu.be',
  ])
  if (!youtubeHosts.has(host)) return undefined

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0] ?? ''
    return isYoutubeVideoId(id) ? `https://www.youtube.com/embed/${id}` : null
  }

  if (url.pathname.startsWith('/embed/')) {
    const rest = url.pathname.slice('/embed/'.length)
    const id = rest.split('/')[0] ?? ''
    const decoded = decodeURIComponent(id)
    if (!isYoutubeVideoId(decoded)) return null
    if (host === 'youtube-nocookie.com') {
      return `${url.origin}/embed/${decoded}${url.search}`
    }
    return `https://www.youtube.com/embed/${decoded}${url.search}`
  }

  const v = url.searchParams.get('v')
  if (v && isYoutubeVideoId(v)) {
    return `https://www.youtube.com/embed/${v}`
  }

  const shorts = url.pathname.match(/^\/shorts\/([^/?#]+)/)
  if (shorts?.[1] && isYoutubeVideoId(shorts[1])) {
    return `https://www.youtube.com/embed/${shorts[1]}`
  }

  return null
}
