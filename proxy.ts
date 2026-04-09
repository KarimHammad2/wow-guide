import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-constants'
import {
  GUEST_BUILDING_COOKIE,
  guestBuildingCookieOptions,
} from '@/lib/guest-building-cookie'

function isPublicAdminPath(pathname: string) {
  return pathname === '/admin/login' || pathname === '/api/admin/auth/login'
}

/** First path segments that must not be treated as a building slug (guest cookie). */
const RESERVED_BUILDING_SEGMENTS = new Set([
  'admin',
  'api',
  'search',
  'buildings',
  'category',
  '_next',
])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Never run auth/cookie proxy logic for static assets.
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let user: { id: string } | null = null

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      })

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      user = authUser ? { id: authUser.id } : null
    } catch (error) {
      console.error('Proxy Supabase initialization failed:', error)
      user = null
    }
  } else {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in proxy.')
  }

  const legacyBuilding = pathname.match(/^\/building\/([^/]+)/)
  if (legacyBuilding?.[1]) {
    response.cookies.set(GUEST_BUILDING_COOKIE, legacyBuilding[1], guestBuildingCookieOptions)
  } else {
    const firstSegment = pathname.match(/^\/([^/]+)/)?.[1]
    if (
      firstSegment &&
      !RESERVED_BUILDING_SEGMENTS.has(firstSegment) &&
      !firstSegment.includes('.')
    ) {
      response.cookies.set(GUEST_BUILDING_COOKIE, firstSegment, guestBuildingCookieOptions)
    }
  }

  if (request.cookies.has(ADMIN_SESSION_COOKIE)) {
    response.cookies.delete(ADMIN_SESSION_COOKIE)
  }

  if (!user && pathname.startsWith('/admin')) {
    if (!isPublicAdminPath(pathname)) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      const redirectResponse = NextResponse.redirect(loginUrl)
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value)
      })
      return redirectResponse
    }
  }

  if (!user && pathname.startsWith('/api/admin')) {
    if (!isPublicAdminPath(pathname)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (user && pathname === '/admin/login') {
    const home = new URL('/admin', request.url)
    const redirectResponse = NextResponse.redirect(home)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/building/:path*',
    '/:slug',
    '/:slug/search',
    '/:slug/search/:path*',
    '/:slug/category/:path*',
  ],
}
