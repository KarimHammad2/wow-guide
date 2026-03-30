import { NextResponse } from 'next/server'
import { getAdminAccessFromRequest } from '@/lib/admin-auth'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const access = getAdminAccessFromRequest(request)
  return NextResponse.json({
    loggedIn: Boolean(access),
    access,
  })
}
