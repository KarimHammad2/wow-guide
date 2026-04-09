import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminSession, requireMutableEmergency } from '@/lib/admin-api'
import {
  getRequestIp,
  logApiError,
  parseJsonBody,
  serverErrorResponse,
  tooManyRequestsResponse,
} from '@/lib/api-route-utils'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  deleteEmergencyContact,
  insertEmergencyContact,
  listEmergencyContacts,
  updateEmergencyContact,
} from '@/lib/emergency-repository'

const emergencyMutationSchema = z.object({
  id: z.string().trim().uuid().optional(),
  label: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(50).default(''),
  email: z.string().trim().email().or(z.literal('')).default(''),
})

const emergencyDeleteSchema = z.object({
  id: z.string().trim().uuid(),
})

export async function GET() {
  const auth = await requireAdminSession()
  if (!auth.ok) return auth.response
  try {
    const rows = await listEmergencyContacts()
    return NextResponse.json(rows)
  } catch (err) {
    logApiError('admin-emergency-list', err)
    return serverErrorResponse('Failed to load emergency contacts.')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMutableEmergency()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-emergency-create:${getRequestIp(request)}`, {
    limit: 30,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = emergencyMutationSchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid emergency contact payload.' }, { status: 400 })
  }

  try {
    const created = await insertEmergencyContact({
      label: body.data.label,
      phone: body.data.phone,
      email: body.data.email,
    })
    return NextResponse.json(created)
  } catch (err) {
    logApiError('admin-emergency-create', err)
    return serverErrorResponse('Failed to create emergency contact.')
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireMutableEmergency()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-emergency-update:${getRequestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = emergencyMutationSchema.safeParse(parsedBody.data)
  if (!body.success || !body.data.id) {
    return NextResponse.json({ error: 'Invalid emergency contact payload.' }, { status: 400 })
  }

  try {
    const updated = await updateEmergencyContact({
      id: body.data.id,
      label: body.data.label,
      phone: body.data.phone,
      email: body.data.email,
    })
    return NextResponse.json(updated)
  } catch (err) {
    logApiError('admin-emergency-update', err)
    return serverErrorResponse('Failed to update emergency contact.')
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireMutableEmergency()
  if (!auth.ok) return auth.response

  const limiter = checkRateLimit(`admin-emergency-delete:${getRequestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limiter.allowed) return tooManyRequestsResponse(limiter.retryAfterSeconds)

  const parsedBody = await parseJsonBody<unknown>(request)
  if (!parsedBody.ok) return parsedBody.response
  const body = emergencyDeleteSchema.safeParse(parsedBody.data)
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid emergency contact payload.' }, { status: 400 })
  }
  try {
    await deleteEmergencyContact(body.data.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logApiError('admin-emergency-delete', err)
    return serverErrorResponse('Failed to delete emergency contact.')
  }
}
