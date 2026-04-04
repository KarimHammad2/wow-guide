import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdminSession, requireOwnerSession } from '@/lib/admin-api'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import type { TeamMember } from '@/lib/admin-types'

function mapRow(row: {
  user_id: string
  email: string
  display_name: string | null
  is_owner: boolean
}): TeamMember {
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    isOwner: row.is_owner,
  }
}

async function teamMemberWithEmail(
  admin: ReturnType<typeof createSupabaseAdmin>,
  profile: { user_id: string; display_name: string | null; is_owner: boolean }
): Promise<TeamMember | null> {
  const { data, error } = await admin.auth.admin.getUserById(profile.user_id)
  if (error || !data.user?.email) {
    return null
  }
  return mapRow({
    user_id: profile.user_id,
    email: data.user.email,
    display_name: profile.display_name,
    is_owner: profile.is_owner,
  })
}

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response

  const admin = createSupabaseAdmin()
  const { data: profiles, error } = await admin
    .from('staff_profiles')
    .select('user_id, display_name, is_owner')
    .order('user_id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const members: TeamMember[] = []
  for (const p of profiles ?? []) {
    const row = await teamMemberWithEmail(admin, p)
    if (row) {
      members.push(row)
    }
  }
  members.sort((a, b) => a.email.localeCompare(b.email))

  return NextResponse.json(members)
}

export async function POST(request: NextRequest) {
  const auth = await requireOwnerSession()
  if (!auth.ok) return auth.response

  const body = (await request.json()) as { email?: string; displayName?: string }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  const displayName =
    typeof body.displayName === 'string' && body.displayName.trim() ? body.displayName.trim() : null

  const accountPassword = randomBytes(24).toString('base64url')
  const admin = createSupabaseAdmin()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: accountPassword,
    email_confirm: true,
  })

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Unable to create user.' },
      { status: 400 }
    )
  }

  const { error: upsertError } = await admin.from('staff_profiles').upsert(
    {
      user_id: created.user.id,
      display_name: displayName,
      is_owner: false,
    },
    { onConflict: 'user_id' }
  )

  if (upsertError) {
    await admin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  const payload: TeamMember & { password: string } = {
    ...mapRow({
      user_id: created.user.id,
      email,
      display_name: displayName,
      is_owner: false,
    }),
    password: accountPassword,
  }

  return NextResponse.json(payload)
}

export async function PUT(request: NextRequest) {
  const auth = await requireOwnerSession()
  if (!auth.ok) return auth.response

  const body = (await request.json()) as { userId?: string; displayName?: string | null }
  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  if (!userId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
  }

  const displayName =
    typeof body.displayName === 'string' ? (body.displayName.trim() || null) : body.displayName ?? null

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('staff_profiles').update({ display_name: displayName }).eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: profile } = await admin
    .from('staff_profiles')
    .select('user_id, display_name, is_owner')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: 'Team member not found.' }, { status: 404 })
  }

  const updated = await teamMemberWithEmail(admin, profile)
  if (!updated) {
    return NextResponse.json({ error: 'Team member not found.' }, { status: 404 })
  }

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireOwnerSession()
  if (!auth.ok) return auth.response

  const body = (await request.json()) as { userId?: string }
  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  if (!userId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
  }

  if (userId === auth.auth.userId) {
    return NextResponse.json({ error: 'You cannot remove your own account.' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: target } = await admin
    .from('staff_profiles')
    .select('is_owner')
    .eq('user_id', userId)
    .maybeSingle()

  if (!target) {
    return NextResponse.json({ error: 'Team member not found.' }, { status: 404 })
  }

  if (target.is_owner) {
    return NextResponse.json({ error: 'Cannot remove an owner account.' }, { status: 400 })
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
