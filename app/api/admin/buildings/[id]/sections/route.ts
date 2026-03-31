import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin, requireFullAccess } from '@/lib/admin-api'
import {
  createBuildingGuideCategory,
  deleteBuildingGuideCategory,
  getBuildingCategories,
  getBuildingGuideCategory,
  getBuildingCategoryContent,
  updateBuildingGuideCategory,
} from '@/lib/admin-store'
import type { Category, ContentSection } from '@/lib/data'

interface RouteContext {
  params: Promise<{ id: string }>
}

const contentItemSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
    link: z.string().optional(),
    items: z.array(contentItemSchema).optional(),
  })
)

const contentSectionSchema = z.object({
  id: z.string().min(1),
  blockId: z.string().optional(),
  type: z.enum([
    'text',
    'steps',
    'alert',
    'card',
    'accordion',
    'schedule',
    'contact',
    'manual',
    'image',
    'tabs',
    'hero',
    'checklist',
    'media',
    'video',
    'links',
    'gallery',
  ]),
  title: z.string().optional(),
  content: z.string().optional(),
  items: z.array(contentItemSchema).optional(),
  variant: z.enum(['info', 'warning', 'success', 'danger']).optional(),
  mediaUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  caption: z.string().optional(),
  layout: z.enum(['default', 'split', 'full-bleed']).optional(),
  styleVariant: z.enum(['default', 'highlighted', 'minimal']).optional(),
})

const sectionMutationSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1).max(120).optional(),
  subtitle: z.string().max(200).optional(),
  icon: z.string().max(80).optional(),
  color: z.enum(['primary', 'accent', 'muted']).optional(),
  intro: z.string().optional(),
  alert: z
    .object({
      type: z.enum(['info', 'warning', 'success', 'danger']),
      message: z.string().min(1),
    })
    .optional(),
  sections: z.array(contentSectionSchema).optional(),
  order: z.number().int().positive().optional(),
})

function normalizeSections(sections: z.infer<typeof contentSectionSchema>[]): ContentSection[] {
  return sections.map((section, index) => ({
    ...section,
    blockId: section.blockId ?? section.id,
    title: section.title ?? `${section.type} block ${index + 1}`,
  })) as ContentSection[]
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
  const body = sectionMutationSchema.safeParse(await request.json())
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid section payload', details: body.error.flatten() }, { status: 400 })
  }
  const payload = body.data
  const created = createBuildingGuideCategory(id, {
    slug: payload.slug ?? payload.title ?? 'section',
    title: payload.title ?? 'New Section',
    subtitle: payload.subtitle ?? 'Guide details',
    icon: payload.icon ?? 'BookOpen',
    color: (payload.color as Category['color']) ?? 'primary',
    intro: payload.intro ?? '',
    alert: payload.alert,
    sections: normalizeSections(payload.sections ?? []),
  })
  return NextResponse.json(created)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = requireFullAccess(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const body = sectionMutationSchema.safeParse(await request.json())
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid section payload', details: body.error.flatten() }, { status: 400 })
  }
  const payload = body.data
  const categorySlug = payload.slug as string
  const existing = getBuildingGuideCategory(id, categorySlug)
  if (!existing) {
    return NextResponse.json({ error: 'Guide section not found' }, { status: 404 })
  }

  const updated = updateBuildingGuideCategory(id, categorySlug, {
    title: payload.title ?? existing.category.title,
    subtitle: payload.subtitle ?? existing.category.subtitle,
    icon: payload.icon ?? existing.category.icon,
    color: (payload.color as Category['color']) ?? existing.category.color,
    order: payload.order ?? existing.category.order,
    intro: payload.intro ?? existing.content.intro,
    alert: payload.alert,
    sections: payload.sections ? normalizeSections(payload.sections) : existing.content.sections,
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
