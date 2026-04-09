import type { Category, ContentSection } from '@/lib/data'

export interface EmergencyInfo {
  id: string
  label: string
  phone: string
  email: string
}

/** Staff row from Supabase (`staff_directory` / API). */
export interface TeamMember {
  userId: string
  email: string
  displayName: string | null
  isOwner: boolean
}

export interface City {
  id: string
  name: string
  country: string
}

export interface GuideContent {
  intro: string
  alert?: {
    type: 'info' | 'warning' | 'success' | 'danger'
    message: string
  }
  sections: ContentSection[]
}

export interface BuildingGuideCategory {
  category: Category
  content: GuideContent
}

/** Building linked to a catalog category (admin list). */
export interface GuideCategoryBuildingRef {
  id: string
  name: string
  city: string
}

/** Reusable catalog row (`guide_categories`). Exactly one of `iconName` or `iconImageUrl` is set. */
export interface GuideCategory {
  id: string
  slug: string
  title: string
  shortDescription: string
  iconName: string | null
  iconImageUrl: string | null
  /** Matches guide category tile styling (`primary` | `accent` | `muted`). */
  categoryColor?: Category['color']
  /** Present on list API: buildings this category is assigned to. */
  assignedBuildings?: GuideCategoryBuildingRef[]
}
