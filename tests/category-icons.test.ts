import { describe, expect, it } from 'vitest'
import { isCategoryIconImageUrl } from '../lib/icons'

describe('isCategoryIconImageUrl', () => {
  it('detects http(s) URLs for uploaded category icons', () => {
    expect(isCategoryIconImageUrl('https://example.com/x.png')).toBe(true)
    expect(isCategoryIconImageUrl('http://localhost:54321/storage/v1/object/public/category-icons/a.png')).toBe(
      true
    )
  })

  it('treats relative paths as image targets', () => {
    expect(isCategoryIconImageUrl('/images/foo.png')).toBe(true)
  })

  it('treats Lucide icon names as not image URLs', () => {
    expect(isCategoryIconImageUrl('Wifi')).toBe(false)
    expect(isCategoryIconImageUrl('BookOpen')).toBe(false)
  })

  it('rejects empty or invalid input', () => {
    expect(isCategoryIconImageUrl('')).toBe(false)
    expect(isCategoryIconImageUrl(null)).toBe(false)
    expect(isCategoryIconImageUrl(undefined)).toBe(false)
  })
})
