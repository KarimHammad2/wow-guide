import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireOwnerSession } from '@/lib/admin-api'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

/**
 * Sets a new random password for a staff user and returns it once (owner only).
 * Existing passwords cannot be read from Auth — this replaces the password.
 */
export async function POST(request: Request) {
  const auth = await requireOwnerSession()
  if (!auth.ok) return auth.response

  const body = (await request.json()) as { userId?: string }
  const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
  if (!userId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
  }

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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data: userData } = await admin.auth.admin.getUserById(userId)

  return NextResponse.json({
    password: newPassword,
    email: userData.user?.email ?? '',
  })
}
