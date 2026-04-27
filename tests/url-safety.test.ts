import { describe, expect, it } from 'vitest'
import {
  isSafeHttpUrl,
  isSafeNavigationTarget,
  isSafeRelativePath,
  normalizeSafeEmbedUrl,
  normalizeSafeNavigationTarget,
} from '../lib/url-safety'

describe('url safety helpers', () => {
  it('accepts safe relative paths', () => {
    expect(isSafeRelativePath('/admin/team')).toBe(true)
    expect(isSafeRelativePath('//evil.example')).toBe(false)
  })

  it('accepts only http(s) absolute URLs', () => {
    expect(isSafeHttpUrl('https://example.com')).toBe(true)
    expect(isSafeHttpUrl('http://example.com')).toBe(true)
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeHttpUrl('data:text/html;base64,abc')).toBe(false)
  })

  it('normalizes unsafe navigation targets to fallback', () => {
    expect(normalizeSafeNavigationTarget('javascript:alert(1)')).toBe('#')
    expect(normalizeSafeNavigationTarget('https://example.com')).toBe(
      new URL('https://example.com').href
    )
    expect(normalizeSafeNavigationTarget('/safe/path')).toBe('/safe/path')
  })

  it('accepts scheme-less host URLs and normalizes to https', () => {
    const raw = 'stadtzug.ch/vereinsliste#Liste%20von%20'
    expect(isSafeNavigationTarget(raw)).toBe(true)
    expect(normalizeSafeNavigationTarget(raw)).toBe(new URL(`https://${raw}`).href)
    expect(isSafeNavigationTarget('//stadtzug.ch/foo')).toBe(true)
  })

  it('keeps only safe embed URLs', () => {
    expect(normalizeSafeEmbedUrl('https://www.youtube.com/watch?v=1')).toBe(
      'https://www.youtube.com/watch?v=1'
    )
    expect(normalizeSafeEmbedUrl('/relative')).toBeNull()
  })

  it('supports route validation for admin login redirects', () => {
    expect(isSafeNavigationTarget('/admin', { allowRelative: true })).toBe(true)
    expect(isSafeNavigationTarget('https://evil.example', { allowRelative: true })).toBe(true)
    expect(isSafeRelativePath('https://evil.example')).toBe(false)
  })
})
