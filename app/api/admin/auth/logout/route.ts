import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-constants'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.json({ ok: true })
  response.cookies.delete(ADMIN_SESSION_COOKIE)
  return response
}
