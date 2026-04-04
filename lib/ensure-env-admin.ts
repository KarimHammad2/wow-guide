import { createSupabaseAdmin } from '@/lib/supabase/admin'

/**
 * Ensures the env-defined admin exists in Supabase Auth with the given password
 * and has an owner row in staff_profiles. Requires SUPABASE_SERVICE_ROLE_KEY.
 */
export async function ensureEnvAdminInSupabase(email: string, password: string) {
  const admin = createSupabaseAdmin()

  const { data: listData, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listError) {
    throw new Error(listError.message)
  }

  const normalized = email.toLowerCase()
  const existing = listData.users.find((u) => u.email?.toLowerCase() === normalized)

  let userId: string
  if (existing) {
    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    })
    if (updateError) {
      throw new Error(updateError.message)
    }
    userId = existing.id
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError || !created.user) {
      throw new Error(createError?.message ?? 'Unable to create admin user')
    }
    userId = created.user.id
  }

  const { error: profileError } = await admin.from('staff_profiles').upsert(
    {
      user_id: userId,
      display_name: null,
      is_owner: true,
    },
    { onConflict: 'user_id' }
  )
  if (profileError) {
    throw new Error(profileError.message)
  }
}
