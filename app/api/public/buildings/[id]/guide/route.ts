import { NextResponse } from 'next/server'
import { getBuildingById } from '@/lib/buildings-repository'
import {
  listBuildingGuideSections,
} from '@/lib/building-guides-repository'
import { popularTopics } from '@/lib/data'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params
  const building = await getBuildingById(id)
  if (!building) {
    return NextResponse.json({ error: 'Building not found' }, { status: 404 })
  }

  const sections = await listBuildingGuideSections(building.id)
  const categories = sections.map((entry) => entry.category)
  const categoryContent: Record<string, unknown> = {}
  for (const entry of sections) {
    categoryContent[entry.category.slug] = entry.content
  }

  return NextResponse.json({
    building,
    categories,
    categoryContent,
    popularTopics,
  })
}
