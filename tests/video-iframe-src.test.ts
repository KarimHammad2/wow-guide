import { describe, expect, it } from 'vitest'
import { safeVideoElementSrc, safeVideoIframeSrc } from '../lib/video-iframe-src'

describe('safeVideoIframeSrc', () => {
  it('rewrites youtu.be share links to embed', () => {
    expect(safeVideoIframeSrc('https://youtu.be/VVfPD4TVCbk?si=bhECm3')).toBe(
      'https://www.youtube.com/embed/VVfPD4TVCbk'
    )
  })

  it('rewrites watch URLs to embed', () => {
    expect(safeVideoIframeSrc('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })

  it('keeps valid embed URLs', () => {
    expect(safeVideoIframeSrc('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })

  it('rewrites shorts URLs', () => {
    expect(safeVideoIframeSrc('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })

  it('preserves youtube-nocookie embed origin', () => {
    expect(safeVideoIframeSrc('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    )
  })

  it('returns null for invalid schemes', () => {
    expect(safeVideoIframeSrc('javascript:alert(1)')).toBeNull()
  })

  it('passes through non-YouTube https URLs', () => {
    expect(safeVideoIframeSrc('https://example.com/video.mp4')).toBe('https://example.com/video.mp4')
  })
})

describe('safeVideoElementSrc', () => {
  it('accepts https public file URLs', () => {
    expect(
      safeVideoElementSrc('https://xxx.supabase.co/storage/v1/object/public/guide-media/u/v.mp4')
    ).toBe('https://xxx.supabase.co/storage/v1/object/public/guide-media/u/v.mp4')
  })

  it('accepts query strings on the URL', () => {
    expect(safeVideoElementSrc('https://cdn.example.com/v.webm?token=abc')).toBe(
      'https://cdn.example.com/v.webm?token=abc'
    )
  })

  it('returns null for invalid schemes', () => {
    expect(safeVideoElementSrc('javascript:alert(1)')).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(safeVideoElementSrc('')).toBeNull()
    expect(safeVideoElementSrc(undefined)).toBeNull()
  })
})
