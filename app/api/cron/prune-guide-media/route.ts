import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { logApiError, serverErrorResponse } from '@/lib/api-route-utils'
import { pruneExpiredGuideMediaOrphans } from '@/lib/guide-media-orphans'

export const dynamic = 'force-dynamic'

export function isCronRequestAuthorized(request: Request, secret = process.env.CRON_SECRET): boolean {
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isCronRequestAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createSupabaseAdmin()
    const result = await pruneExpiredGuideMediaOrphans(admin)
    return NextResponse.json(result)
  } catch (error) {
    logApiError('cron-prune-guide-media', error)
    return serverErrorResponse('Prune failed.')
  }
}
