import { describe, expect, it } from 'vitest'
import {
  isCategorySlugConflictError,
  isValidCategorySlugPath,
  normalizeCategorySlug,
} from '../lib/category-slug'

describe('normalizeCategorySlug', () => {
  it('accepts slash-prefixed paths', () => {
    expect(normalizeCategorySlug('/wifi', 'Internet')).toBe('wifi')
  })

  it('accepts bare slugs', () => {
    expect(normalizeCategorySlug('e-scooter', 'E-Scooter')).toBe('e-scooter')
  })

  it('falls back to slugified title when blank', () => {
    expect(normalizeCategorySlug('', 'Check In')).toBe('check-in')
  })

  it('rejects reserved slugs', () => {
    expect(() => normalizeCategorySlug('/new', 'New')).toThrow('reserved')
  })
})

describe('isValidCategorySlugPath', () => {
  it('allows blank optional input', () => {
    expect(isValidCategorySlugPath('')).toBe(true)
  })

  it('allows valid paths', () => {
    expect(isValidCategorySlugPath('/internet')).toBe(true)
    expect(isValidCategorySlugPath('internet')).toBe(true)
  })

  it('rejects invalid paths', () => {
    expect(isValidCategorySlugPath('/bad slug')).toBe(false)
  })
})

describe('isCategorySlugConflictError', () => {
  it('detects duplicate slug errors', () => {
    expect(isCategorySlugConflictError(new Error('Section slug already exists for this building'))).toBe(true)
  })
})
