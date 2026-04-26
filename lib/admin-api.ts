import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type StaffRole = 'owner' | 'member'

export type AdminAuthContext = {
  userId: string
  email: string
  role: StaffRole
  isOwner: boolean
}

function serviceRoleUnavailable(message: string) {
  return {
    ok: false as const,
    response: NextResponse.json({ error: message }, { status: 503 }),
  }
}

export async function requireAdminSession(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user?.email) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('staff_profiles')
    .select('is_owner')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const role: StaffRole = profile.is_owner ? 'owner' : 'member'
  return {
    ok: true,
    auth: {
      userId: user.id,
      email: user.email,
      role,
      isOwner: profile.is_owner,
    },
  }
}

export async function requireOwnerSession(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const session = await requireAdminSession()
  if (!session.ok) return session
  if (!session.auth.isOwner) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return session
}

export async function requireMutableAdmin(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_IN_MEMORY_ADMIN_WRITES !== 'true') {
    return {
      ok: false,
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

/** Emergency CRUD persists to Supabase (requires service role on server). */
export async function requireMutableEmergency(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Saving emergency contacts requires SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 503 },
      ),
    }
  }
  return auth
}

/** City CRUD persists to Supabase (requires service role on server). */
export async function requireMutableCities(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return serviceRoleUnavailable('Saving cities requires SUPABASE_SERVICE_ROLE_KEY.')
  }
  return auth
}

/** Building CRUD persists to Supabase (requires service role on server). */
export async function requireMutableBuildings(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const auth = await requireMutableAdmin()
  if (!auth.ok) return auth
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return serviceRoleUnavailable('Saving buildings requires SUPABASE_SERVICE_ROLE_KEY.')
  }
  return auth
}

/** Building guide sections CRUD persists to Supabase (requires service role on server). */
export async function requireMutableBuildingSections(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const auth = await requireMutableAdmin()
  if (!auth.ok) return auth
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return serviceRoleUnavailable('Saving building sections requires SUPABASE_SERVICE_ROLE_KEY.')
  }
  return auth
}

/** Reusable guide categories + assignments persist to Supabase (requires service role on server). */
export async function requireMutableGuideCategories(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const auth = await requireMutableAdmin()
  if (!auth.ok) return auth
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return serviceRoleUnavailable('Saving guide categories requires SUPABASE_SERVICE_ROLE_KEY.')
  }
  return auth
}

/** Team directory reads/writes rely on Supabase Admin APIs (requires service role). */
export async function requireAdminDirectorySession(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return serviceRoleUnavailable('Team management requires SUPABASE_SERVICE_ROLE_KEY.')
  }
  return auth
}

/** Analytics dashboard reads rely on Supabase Admin APIs (requires service role). */
export async function requireAnalyticsDashboardSession(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return serviceRoleUnavailable('Analytics requires SUPABASE_SERVICE_ROLE_KEY.')
  }
  return auth
}

export async function requireOwnerDirectorySession(): Promise<
  { ok: true; auth: AdminAuthContext } | { ok: false; response: NextResponse }
> {
  const auth = await requireOwnerSession()
  if (!auth.ok) return auth
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return serviceRoleUnavailable('Team management requires SUPABASE_SERVICE_ROLE_KEY.')
  }
  return auth
}
