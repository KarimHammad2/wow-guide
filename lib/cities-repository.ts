import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { City } from '@/lib/admin-types'

function rowToCity(row: { id: string; name: string; country: string }): City {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
  }
}

/** Uses the server/anon client — RLS allows `select`; no service role required to load the list. */
export async function listCities(): Promise<City[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('cities').select('id, name, country').order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []).map(rowToCity)
}

async function nextSortOrder(): Promise<number> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('cities')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  return (data?.sort_order ?? -1) + 1
}

export async function insertCity(input: Omit<City, 'id'>): Promise<City> {
  const admin = createSupabaseAdmin()
  const sort_order = await nextSortOrder()
  const { data, error } = await admin
    .from('cities')
    .insert({
      name: input.name,
      country: input.country || 'Switzerland',
      sort_order,
    })
    .select('id, name, country')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Insert failed')
  }
  return rowToCity(data)
}

export async function updateCity(input: City): Promise<City> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('cities')
    .update({
      name: input.name,
      country: input.country,
    })
    .eq('id', input.id)
    .select('id, name, country')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Update failed')
  }
  return rowToCity(data)
}

export async function deleteCity(id: string): Promise<void> {
  const admin = createSupabaseAdmin()
  const { error } = await admin.from('cities').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }
}
