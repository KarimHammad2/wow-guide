import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { EmergencyInfo } from '@/lib/admin-types'
import { DEFAULT_SUPPORT_EMAIL, DEFAULT_SUPPORT_PHONE } from '@/lib/emergency-defaults'

/**
 * Public read of emergency contacts for guest UI (anon key, RLS allows select).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.json({
      contacts: [] as EmergencyInfo[],
      primary: { phone: DEFAULT_SUPPORT_PHONE, email: DEFAULT_SUPPORT_EMAIL },
    })
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('id, label, phone, email')
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({
      contacts: [] as EmergencyInfo[],
      primary: { phone: DEFAULT_SUPPORT_PHONE, email: DEFAULT_SUPPORT_EMAIL },
    })
  }

  const contacts = (data ?? []) as EmergencyInfo[]
  const first = contacts[0]
  return NextResponse.json({
    contacts,
    primary: {
      phone: first?.phone ?? DEFAULT_SUPPORT_PHONE,
      email: first?.email ?? DEFAULT_SUPPORT_EMAIL,
    },
  })
}
