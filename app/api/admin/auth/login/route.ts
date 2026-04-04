import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthConfigured, isValidAdminLogin } from '@/lib/admin-auth-config'
import { ensureEnvAdminInSupabase } from '@/lib/ensure-env-admin'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null

  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  const email = body.email.trim()
  const password = body.password

  const supabase = await createClient()

  async function completeLoginAfterPasswordOk() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user?.id) {
      return NextResponse.json({ error: 'Unable to complete sign-in.' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('user_id')
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (!profile) {
      if (isAdminAuthConfigured() && isValidAdminLogin(email, password)) {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          await supabase.auth.signOut()
          return NextResponse.json(
            { error: 'Missing staff profile. Set SUPABASE_SERVICE_ROLE_KEY to allow env admin bootstrap.' },
            { status: 503 }
          )
        }
        try {
          await ensureEnvAdminInSupabase(email, password)
        } catch (err) {
          await supabase.auth.signOut()
          const message = err instanceof Error ? err.message : 'Bootstrap failed'
          return NextResponse.json({ error: message }, { status: 500 })
        }
        return NextResponse.json({ ok: true })
      }

      await supabase.auth.signOut()
      return NextResponse.json({ error: 'This account is not authorized for admin access.' }, { status: 403 })
    }

    return NextResponse.json({ ok: true })
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (!signInError) {
    return completeLoginAfterPasswordOk()
  }

  if (isAdminAuthConfigured() && isValidAdminLogin(email, password)) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Env admin login requires SUPABASE_SERVICE_ROLE_KEY to sync the account in Supabase.' },
        { status: 503 }
      )
    }
    try {
      await ensureEnvAdminInSupabase(email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to set up admin account'
      return NextResponse.json({ error: message }, { status: 500 })
    }

    const { error: retryError } = await supabase.auth.signInWithPassword({ email, password })
    if (retryError) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    return completeLoginAfterPasswordOk()
  }

  return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
}
