import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

let adminClient: ReturnType<typeof createClient<Database>> | null = null

/**
 * Service role client — server-only. Used for staff directory queries and user admin APIs.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  if (!adminClient) {
    adminClient = createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return adminClient
}
