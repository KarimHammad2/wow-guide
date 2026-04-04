import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { StaffRole } from '@/lib/admin-api'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({
      loggedIn: false,
      role: null,
      canEdit: false,
      canManageTeam: false,
    })
  }

  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('is_owner')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({
      loggedIn: false,
      role: null,
      canEdit: false,
      canManageTeam: false,
    })
  }

  const role: StaffRole = profile.is_owner ? 'owner' : 'member'

  return NextResponse.json({
    loggedIn: true,
    role,
    canEdit: true,
    canManageTeam: profile.is_owner,
    email: user.email,
  })
}
