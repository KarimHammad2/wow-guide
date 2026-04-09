type RateLimitState = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitState>()

function nowMs() {
  return Date.now()
}

function cleanupExpiredBuckets(timestamp: number) {
  for (const [key, state] of buckets) {
    if (state.resetAt <= timestamp) {
      buckets.delete(key)
    }
  }
}

export function checkRateLimit(
  key: string,
  options: {
    limit: number
    windowMs: number
  }
): { allowed: true; remaining: number } | { allowed: false; retryAfterSeconds: number } {
  const timestamp = nowMs()
  cleanupExpiredBuckets(timestamp)

  const state = buckets.get(key)
  if (!state || state.resetAt <= timestamp) {
    buckets.set(key, { count: 1, resetAt: timestamp + options.windowMs })
    return { allowed: true, remaining: Math.max(options.limit - 1, 0) }
  }

  if (state.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(Math.ceil((state.resetAt - timestamp) / 1000), 1),
    }
  }

  state.count += 1
  buckets.set(key, state)
  return { allowed: true, remaining: Math.max(options.limit - state.count, 0) }
}
