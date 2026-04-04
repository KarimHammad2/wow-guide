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

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const buildingMatch = pathname.match(/^\/building\/([^/]+)/)
  if (buildingMatch?.[1]) {
    response.cookies.set(GUEST_BUILDING_COOKIE, buildingMatch[1], guestBuildingCookieOptions)
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
  matcher: ['/admin/:path*', '/api/admin/:path*', '/building/:path*'],
}
