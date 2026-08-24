import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type EditorAuthContext = {
  userId: string
  email: string
}

/** For server-rendered draft preview: same identity check as editor APIs, without returning an HTTP response. */
export async function getEditorSessionUser(): Promise<EditorAuthContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user?.email) return null
  return { userId: user.id, email: user.email }
}

/** Staff-only draft preview: requires Supabase session and a `staff_profiles` row. */
export async function getStaffDraftPreviewUser(): Promise<EditorAuthContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user?.email) return null

  const { data: profile, error: profileError } = await supabase
    .from('staff_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError || !profile) return null

  return { userId: user.id, email: user.email }
}

export async function requireEditorSession(): Promise<
  { ok: true; auth: EditorAuthContext } | { ok: false; response: NextResponse }
> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return {
    ok: true,
    auth: {
      userId: user.id,
      email: user.email,
    },
  }
}
