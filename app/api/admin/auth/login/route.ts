import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-constants'
import { isValidAdminLogin, isAdminAuthConfigured } from '@/lib/admin-auth-config'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as
    | { email?: string; password?: string; access?: 'read-only' | 'full-access' }
    | null

  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: 'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD.' },
      { status: 503 },
    )
  }

  if (!isValidAdminLogin(body.email, body.password)) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, body.access ?? 'full-access', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  return response
}
