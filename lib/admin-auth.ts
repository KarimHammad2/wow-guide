import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-constants'

export type AdminAccess = 'read-only' | 'full-access'

function parseAccess(raw: string | undefined): AdminAccess | null {
  if (raw === 'read-only' || raw === 'full-access') {
    return raw
  }
  return null
}

export function getAdminAccessFromRequest(request: NextRequest): AdminAccess | null {
  const raw = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return parseAccess(raw)
}

export async function getAdminAccessFromServerCookies(): Promise<AdminAccess | null> {
  const cookieStore = await cookies()
  return parseAccess(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
}
