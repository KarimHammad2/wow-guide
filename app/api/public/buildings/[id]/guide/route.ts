import { NextResponse } from 'next/server'
import {
  getBuildingById,
  getBuildingCategories,
  getBuildingCategoryContent,
} from '@/lib/admin-store'
import { popularTopics } from '@/lib/data'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params
  const building = getBuildingById(id)
  if (!building) {
    return NextResponse.json({ error: 'Building not found' }, { status: 404 })
  }

  const categories = getBuildingCategories(id)
  const categoryContent = categories.reduce<Record<string, unknown>>((acc, category) => {
    acc[category.slug] = getBuildingCategoryContent(id, category.slug)
    return acc
  }, {})

  return NextResponse.json({
    building,
    categories,
    categoryContent,
    popularTopics,
  })
}
