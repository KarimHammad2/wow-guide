import { describe, expect, it } from 'vitest'
import { checkRateLimit } from '../lib/rate-limit'

describe('checkRateLimit', () => {
  it('allows requests within the configured window', () => {
    const key = `unit-allow-${Date.now()}`
    const first = checkRateLimit(key, { limit: 2, windowMs: 10_000 })
    const second = checkRateLimit(key, { limit: 2, windowMs: 10_000 })

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
  })

  it('blocks requests above the configured limit', () => {
    const key = `unit-block-${Date.now()}`
    checkRateLimit(key, { limit: 1, windowMs: 10_000 })
    const blocked = checkRateLimit(key, { limit: 1, windowMs: 10_000 })

    expect(blocked.allowed).toBe(false)
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    }
  })
})
