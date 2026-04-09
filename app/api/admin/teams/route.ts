import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminDirectorySession, requireOwnerDirectorySession } from '@/lib/admin-api'
import {
  getRequestIp,
  logApiError,
  parseJsonBody,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import type { TeamMember } from '@/lib/admin-types'

function mapRow(row: {
  user_id: string
  email: string
  display_name: string | null
  is_owner: boolean
}): TeamMember {
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    isOwner: row.is_owner,
  }
}

const createTeamMemberSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().max(120).optional(),
})

const updateTeamMemberSchema = z.object({
  userId: z.string().trim().min(1),
  displayName: z.string().trim().max(120).nullable().optional(),
})

const deleteTeamMemberSchema = z.object({
  userId: z.string().trim().min(1),
})

export async function GET() {
  const auth = await requireAdminDirectorySession()
  if (!auth.ok) return auth.response

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('staff_directory')
    .select('user_id, email, display_name, is_owner')
    .order('email')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data ?? []).map(mapRow))
}

export async function POST(request: NextRequest) {
  const auth = await requireOwnerDirectorySession()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-teams-create:${getRequestIp(request)}`, { limit: 20, windowMs: 60_000 })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = createTeamMemberSchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = body.data.email.trim()
  const displayName = body.data.displayName?.trim() ? body.data.displayName.trim() : null

  const accountPassword = randomBytes(24).toString('base64url')
  const admin = createSupabaseAdmin()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: accountPassword,
    email_confirm: true,
  })

  if (createError || !created.user) {
    logApiError('admin-teams-create-user', createError)
    return NextResponse.json(
      { error: 'Unable to create user.' },
      { status: 400 }
    )
  }

  const { error: upsertError } = await admin.from('staff_profiles').upsert(
    {
      user_id: created.user.id,
      display_name: displayName,
      is_owner: false,
    },
    { onConflict: 'user_id' }
  )

  if (upsertError) {
    await admin.auth.admin.deleteUser(created.user.id)
    logApiError('admin-teams-upsert-profile', upsertError)
    return serverErrorResponse('Unable to create team member.')
  }

  const payload: TeamMember = {
    ...mapRow({
      user_id: created.user.id,
      email,
      display_name: displayName,
      is_owner: false,
    }),
  }

  return NextResponse.json(payload)
}

export async function PUT(request: NextRequest) {
  const auth = await requireOwnerDirectorySession()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-teams-update:${getRequestIp(request)}`, { limit: 40, windowMs: 60_000 })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = updateTeamMemberSchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const userId = body.data.userId

  const displayName =
    typeof body.data.displayName === 'string'
      ? (body.data.displayName.trim() || null)
      : body.data.displayName ?? null

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('staff_profiles').update({ display_name: displayName }).eq('user_id', userId)

  if (error) {
    logApiError('admin-teams-update-profile', error)
    return serverErrorResponse('Unable to update team member.')
  }

  const { data: profile } = await admin
    .from('staff_directory')
    .select('user_id, email, display_name, is_owner')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: 'Team member not found.' }, { status: 404 })
  }

  return NextResponse.json(mapRow(profile))
}

export async function DELETE(request: NextRequest) {
  const auth = await requireOwnerDirectorySession()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-teams-delete:${getRequestIp(request)}`, { limit: 30, windowMs: 60_000 })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = deleteTeamMemberSchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const userId = body.data.userId

  if (userId === auth.auth.userId) {
    return NextResponse.json({ error: 'You cannot remove your own account.' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: target } = await admin
    .from('staff_profiles')
    .select('is_owner')
    .eq('user_id', userId)
    .maybeSingle()

  if (!target) {
    return NextResponse.json({ error: 'Team member not found.' }, { status: 404 })
  }

  if (target.is_owner) {
    return NextResponse.json({ error: 'Cannot remove an owner account.' }, { status: 400 })
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    logApiError('admin-teams-delete-user', error)
    return NextResponse.json({ error: 'Unable to remove team member.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
