import { NextResponse } from 'next/server'

export async function parseJsonBody<T>(
  request: Request
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  try {
    const data = (await request.json()) as T
    return { ok: true, data }
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 }),
    }
  }
}

export function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export function tooManyRequestsResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again shortly.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    }
  )
}

export function serverErrorResponse(
  userMessage = 'Unexpected server error. Please try again.'
): NextResponse {
  return NextResponse.json({ error: userMessage }, { status: 500 })
}

export function logApiError(context: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[${context}]`, error)
    return
  }
  console.error(`[${context}]`, { error })
}
