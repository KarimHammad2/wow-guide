import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin, requireFullAccess } from '@/lib/admin-api'
import {
  createBuildingGuideCategory,
  deleteBuildingGuideCategory,
  getBuildingCategories,
  getBuildingGuideCategory,
  getBuildingCategoryContent,
  updateBuildingGuideCategory,
} from '@/lib/admin-store'
import type { Category } from '@/lib/data'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const categories = getBuildingCategories(id)
  const sections = categories.map((category) => ({
    category,
    content: getBuildingCategoryContent(id, category.slug),
  }))
  return NextResponse.json(sections)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const body = await request.json()
  const created = createBuildingGuideCategory(id, {
    slug: body.slug ?? body.title ?? 'section',
    title: body.title ?? 'New Section',
    subtitle: body.subtitle ?? 'Guide details',
    icon: body.icon ?? 'BookOpen',
    color: (body.color as Category['color']) ?? 'primary',
    intro: body.intro ?? '',
    alert: body.alert,
    sections: Array.isArray(body.sections) ? body.sections : [],
  })
  return NextResponse.json(created)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const body = await request.json()
  const categorySlug = body.slug as string
  const existing = getBuildingGuideCategory(id, categorySlug)
  if (!existing) {
    return NextResponse.json({ error: 'Guide section not found' }, { status: 404 })
  }

  const updated = updateBuildingGuideCategory(id, categorySlug, {
    title: body.title ?? existing.category.title,
    subtitle: body.subtitle ?? existing.category.subtitle,
    icon: body.icon ?? existing.category.icon,
    color: (body.color as Category['color']) ?? existing.category.color,
    intro: body.intro ?? existing.content.intro,
    alert: body.alert,
    sections: Array.isArray(body.sections) ? body.sections : existing.content.sections,
  })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const body = await request.json()
  deleteBuildingGuideCategory(id, body.slug)
  return NextResponse.json({ ok: true })
}
