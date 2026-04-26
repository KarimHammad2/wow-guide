import { describe, expect, test } from 'vitest'
import {
  resolveGuideMediaContentType,
  resolveGuideMediaPath,
  sniffGuideMediaContentType,
} from '../lib/editor-media'

describe('resolveGuideMediaPath', () => {
  test('extracts the object path from a Supabase public url', () => {
    expect(
      resolveGuideMediaPath(
        'https://example.supabase.co/storage/v1/object/public/guide-media/user-123/folder/image.png'
      )
    ).toBe('user-123/folder/image.png')
  })

  test('accepts raw bucket-relative paths', () => {
    expect(resolveGuideMediaPath('guide-media/user-123/image.png')).toBe('user-123/image.png')
  })

  test('rejects unrelated urls and empty input', () => {
    expect(resolveGuideMediaPath('https://example.com/image.png')).toBeNull()
    expect(resolveGuideMediaPath('')).toBeNull()
  })
})

describe('resolveGuideMediaContentType', () => {
  test('uses browser-reported MIME when allowed', () => {
    const blob = new Blob([], { type: 'image/png' })
    expect(resolveGuideMediaContentType(blob)).toBe('image/png')
  })

  test('normalizes legacy JPEG MIME types', () => {
    expect(resolveGuideMediaContentType(new Blob([], { type: 'image/jpg' }))).toBe('image/jpeg')
    expect(resolveGuideMediaContentType(new Blob([], { type: 'image/pjpeg' }))).toBe('image/jpeg')
  })

  test('strips MIME parameters before matching allowlist', () => {
    expect(resolveGuideMediaContentType(new Blob([], { type: 'image/png; charset=binary' }))).toBe('image/png')
  })

  test('maps image/x-png to image/png', () => {
    expect(resolveGuideMediaContentType(new Blob([], { type: 'image/x-png' }))).toBe('image/png')
  })

  test('infers from file name when type is empty or octet-stream', () => {
    const empty = new File([], 'photo.jfif', { type: '' })
    expect(resolveGuideMediaContentType(empty)).toBe('image/jpeg')

    const octet = new File([], 'clip.mp4', { type: 'application/octet-stream' })
    expect(resolveGuideMediaContentType(octet)).toBe('video/mp4')
  })

  test('returns null for unknown extension or disallowed types', () => {
    expect(resolveGuideMediaContentType(new File([], 'x.bmp', { type: '' }))).toBeNull()
    expect(resolveGuideMediaContentType(new Blob([], { type: 'image/bmp' }))).toBeNull()
  })
})

describe('sniffGuideMediaContentType', () => {
  test('detects PNG signature without relying on file metadata', () => {
    const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(sniffGuideMediaContentType(sig)).toBe('image/png')
  })

  test('detects JPEG SOI', () => {
    expect(sniffGuideMediaContentType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
  })

  test('returns null for unrelated bytes', () => {
    expect(sniffGuideMediaContentType(new Uint8Array([0, 1, 2, 3]))).toBeNull()
  })
})
