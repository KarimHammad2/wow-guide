import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOwnerDirectorySession } from '@/lib/admin-api'
import {
  getRequestIp,
  logApiError,
  parseJsonBody,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

/**
 * Sets a new random password for a staff user (owner only).
 * The generated credential is never returned in API responses.
 */
export async function POST(request: Request) {
  const auth = await requireOwnerDirectorySession()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-teams-reset-password:${getRequestIp(request)}`, {
    limit: 20,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = z.object({ userId: z.string().trim().min(1) }).safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const userId = body.data.userId

  const admin = createSupabaseAdmin()
  const { data: profile } = await admin.from('staff_profiles').select('user_id').eq('user_id', userId).maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: 'Team member not found.' }, { status: 404 })
  }

  const newPassword = randomBytes(24).toString('base64url')
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
    email_confirm: true,
  })

  if (error) {
    logApiError('admin-reset-password', error)
    return NextResponse.json({ error: 'Unable to reset password.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
