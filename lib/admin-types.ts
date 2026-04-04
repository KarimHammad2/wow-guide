import type { Building, Category, ContentSection } from '@/lib/data'

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

export interface AdminStoreShape {
  buildings: Building[]
  buildingGuides: Record<string, Record<string, BuildingGuideCategory>>
}
