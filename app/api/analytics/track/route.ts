import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequestIp, logApiError, parseJsonBody, serverErrorResponse, tooManyRequestsResponse } from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { recordBuildingPageVisit } from '@/lib/analytics-repository'
import { COOKIE_CONSENT_ACCEPTED, readConsentFromCookieString } from '@/lib/cookie-consent'

const visitPayloadSchema = z.object({
  buildingId: z.string().trim().min(1),
  visitorId: z.string().trim().uuid(),
  pathname: z.string().trim().min(1).refine((value) => value.startsWith('/'), 'Pathname must be a relative path.'),
  pageTitle: z.string().trim().min(1).max(200),
  pageType: z.enum(['building_home', 'category']),
  categorySlug: z.string().trim().min(1).max(120).nullable().optional(),
  referrer: z.string().trim().max(500).optional(),
})

export async function POST(request: Request) {
  const consent = readConsentFromCookieString(request.headers.get('cookie') ?? '')
  if (consent !== COOKIE_CONSENT_ACCEPTED) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const limiter = checkRateLimit(`analytics-track:${getRequestIp(request)}`, {
    limit: 240,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response

  const body = visitPayloadSchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid analytics payload.' }, { status: 400 })
  }

  try {
    await recordBuildingPageVisit({
      buildingId: body.data.buildingId,
      visitorId: body.data.visitorId,
      pathname: body.data.pathname,
      pageTitle: body.data.pageTitle,
      pageType: body.data.pageType,
      categorySlug: body.data.categorySlug ?? null,
      referrer: body.data.referrer ?? '',
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    logApiError('analytics-track', error)
    return serverErrorResponse('Unable to record analytics event.')
  }
}
