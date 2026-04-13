import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type EditorAuthContext = {
  userId: string
  email: string
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
