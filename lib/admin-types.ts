import type { Building, Category, ContentSection } from '@/lib/data'

export type TeamAccess = 'read-only' | 'full-access'

export interface EmergencyInfo {
  id: string
  label: string
  phone: string
  email: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  access: TeamAccess
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
  emergencyInfos: EmergencyInfo[]
  teamMembers: TeamMember[]
  cities: City[]
  buildings: Building[]
  buildingGuides: Record<string, Record<string, BuildingGuideCategory>>
}
