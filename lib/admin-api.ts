import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminAccessFromRequest } from '@/lib/admin-auth'

export function requireAdmin(request: NextRequest) {
  const access = getAdminAccessFromRequest(request)
  if (!access) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true as const, access }
}

export function requireFullAccess(request: NextRequest) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth
  if (auth.access !== 'full-access') {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return auth
}

export function requireMutableAdmin(request: NextRequest) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IN_MEMORY_ADMIN_WRITES !== 'true') {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            'Admin mutations are disabled in production for in-memory storage. Configure persistence or set ALLOW_IN_MEMORY_ADMIN_WRITES=true.',
        },
        { status: 503 },
      ),
    }
  }
  return auth
}
