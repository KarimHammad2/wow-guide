import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { EmergencyInfo } from '@/lib/admin-types'
import { DEFAULT_SUPPORT_EMAIL, DEFAULT_SUPPORT_PHONE } from '@/lib/emergency-defaults'

export { DEFAULT_SUPPORT_EMAIL, DEFAULT_SUPPORT_PHONE } from '@/lib/emergency-defaults'

function rowToEmergency(row: {
  id: string
  label: string
  phone: string
  email: string
}): EmergencyInfo {
  return {
    id: row.id,
    label: row.label,
    phone: row.phone,
    email: row.email,
  }
}

/** Uses the server/anon client — RLS allows `select`; no service role required to load the list. */
export async function listEmergencyContacts(): Promise<EmergencyInfo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('id, label, phone, email')
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []).map(rowToEmergency)
}

export async function insertEmergencyContact(input: Omit<EmergencyInfo, 'id'>): Promise<EmergencyInfo> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('emergency_contacts')
    .insert({
      label: input.label,
      phone: input.phone,
      email: input.email,
      sort_order: 0,
    })
    .select('id, label, phone, email')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Insert failed')
  }
  return rowToEmergency(data)
}

export async function updateEmergencyContact(input: EmergencyInfo): Promise<EmergencyInfo> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('emergency_contacts')
    .update({
      label: input.label,
      phone: input.phone,
      email: input.email,
    })
    .eq('id', input.id)
    .select('id, label, phone, email')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Update failed')
  }
  return rowToEmergency(data)
}

export async function deleteEmergencyContact(id: string): Promise<void> {
  const admin = createSupabaseAdmin()
  const { error } = await admin.from('emergency_contacts').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }
}

/** First emergency row — used for new buildings and fallbacks. */
export async function getPrimarySupportContact(): Promise<{ phone: string; email: string }> {
  try {
    const list = await listEmergencyContacts()
    const first = list[0]
    if (first) {
      return { phone: first.phone, email: first.email }
    }
  } catch {
    // service role missing or table missing
  }
  return { phone: DEFAULT_SUPPORT_PHONE, email: DEFAULT_SUPPORT_EMAIL }
}
