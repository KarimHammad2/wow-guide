import {
  buildings as seedBuildings,
  categoryContent as seedCategoryContent,
  type Building,
  type Category,
  type ContentSection,
} from '@/lib/data'
import type {
  AdminStoreShape,
  BuildingGuideCategory,
  City,
  EmergencyInfo,
  GuideContent,
  TeamAccess,
  TeamMember,
} from '@/lib/admin-types'

const DEFAULT_GUIDE_SECTIONS: Array<{
  slug: string
  title: string
  subtitle: string
  icon: string
  color: Category['color']
}> = [
  { slug: 'wifi', title: 'WiFi', subtitle: 'Network and connectivity', icon: 'Wifi', color: 'accent' },
  { slug: 'check-in', title: 'Check-In', subtitle: 'Arrival and access', icon: 'Key', color: 'primary' },
  { slug: 'parking', title: 'Parking', subtitle: 'Parking and access', icon: 'Car', color: 'muted' },
  { slug: 'security', title: 'Security', subtitle: 'Safety and building rules', icon: 'ShieldAlert', color: 'primary' },
  { slug: 'emergency', title: 'Emergency', subtitle: 'Urgent support contacts', icon: 'AlertTriangle', color: 'primary' },
  { slug: 'cleaning', title: 'Cleaning', subtitle: 'Cleaning services and rules', icon: 'Sparkles', color: 'accent' },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function cloneSections(sections: ContentSection[]): ContentSection[] {
  return JSON.parse(JSON.stringify(sections)) as ContentSection[]
}

function getSeedGuideContent(slug: string): GuideContent {
  const mappedSlug = slug === 'wifi' ? 'internet-tv' : slug === 'check-in' ? 'check-in-out' : slug
  const seed = seedCategoryContent[mappedSlug]

  if (seed) {
    return {
      intro: seed.intro,
      alert: seed.alert,
      sections: cloneSections(seed.sections),
    }
  }

  return {
    intro: 'Add your guide information here.',
    sections: [],
  }
}

function makeGuideCategory(
  buildingId: string,
  config: (typeof DEFAULT_GUIDE_SECTIONS)[number]
): BuildingGuideCategory {
  return {
    category: {
      id: `${buildingId}-${config.slug}`,
      slug: config.slug,
      title: config.title,
      subtitle: config.subtitle,
      icon: config.icon,
      color: config.color,
      order: DEFAULT_GUIDE_SECTIONS.findIndex((item) => item.slug === config.slug) + 1,
    },
    content: getSeedGuideContent(config.slug),
  }
}

function createDefaultGuidesForBuilding(buildingId: string) {
  return DEFAULT_GUIDE_SECTIONS.reduce<Record<string, BuildingGuideCategory>>((acc, config) => {
    acc[config.slug] = makeGuideCategory(buildingId, config)
    return acc
  }, {})
}

const initialCitiesMap = new Map<string, City>()
seedBuildings.forEach((building) => {
  const key = `${building.city}-${building.country}`
  if (!initialCitiesMap.has(key)) {
    initialCitiesMap.set(key, {
      id: slugify(key),
      name: building.city,
      country: building.country,
    })
  }
})

const store: AdminStoreShape = {
  emergencyInfos: [
    {
      id: 'primary-emergency',
      label: 'Primary Emergency',
      phone: '+41 61 000 00 00',
      email: 'emergency@wowliving.ch',
    },
  ],
  teamMembers: [
    {
      id: 'team-owner',
      name: 'Admin Owner',
      email: 'admin@wowliving.ch',
      access: 'full-access',
    },
  ],
  cities: Array.from(initialCitiesMap.values()),
  buildings: seedBuildings.map((building) => ({ ...building })),
  buildingGuides: seedBuildings.reduce<AdminStoreShape['buildingGuides']>((acc, building) => {
    acc[building.id] = createDefaultGuidesForBuilding(building.id)
    return acc
  }, {}),
}

function ensureBuildingExists(buildingId: string) {
  if (!store.buildings.some((building) => building.id === buildingId)) {
    throw new Error('Building not found')
  }
}

export function getEmergencyInfos() {
  return [...store.emergencyInfos]
}

export function createEmergencyInfo(input: Omit<EmergencyInfo, 'id'>) {
  const created: EmergencyInfo = { ...input, id: uid('emergency') }
  store.emergencyInfos.push(created)
  return created
}

export function updateEmergencyInfo(input: EmergencyInfo) {
  const index = store.emergencyInfos.findIndex((item) => item.id === input.id)
  if (index === -1) throw new Error('Emergency info not found')
  store.emergencyInfos[index] = input
  return input
}

export function deleteEmergencyInfo(id: string) {
  const index = store.emergencyInfos.findIndex((item) => item.id === id)
  if (index === -1) throw new Error('Emergency info not found')
  store.emergencyInfos.splice(index, 1)
}

export function getTeamMembers() {
  return [...store.teamMembers]
}

export function createTeamMember(input: Omit<TeamMember, 'id'>) {
  const created: TeamMember = { ...input, id: uid('team') }
  store.teamMembers.push(created)
  return created
}

export function updateTeamMember(input: TeamMember) {
  const index = store.teamMembers.findIndex((item) => item.id === input.id)
  if (index === -1) throw new Error('Team member not found')
  store.teamMembers[index] = input
  return input
}

export function deleteTeamMember(id: string) {
  const index = store.teamMembers.findIndex((item) => item.id === id)
  if (index === -1) throw new Error('Team member not found')
  store.teamMembers.splice(index, 1)
}

export function getCities() {
  return [...store.cities]
}

export function createCity(input: Omit<City, 'id'>) {
  const created: City = {
    id: slugify(`${input.name}-${input.country}-${Date.now().toString(36)}`),
    ...input,
  }
  store.cities.push(created)
  return created
}

export function updateCity(input: City) {
  const index = store.cities.findIndex((item) => item.id === input.id)
  if (index === -1) throw new Error('City not found')
  store.cities[index] = input
  return input
}

export function deleteCity(id: string) {
  const index = store.cities.findIndex((item) => item.id === id)
  if (index === -1) throw new Error('City not found')
  store.cities.splice(index, 1)
}

export function getBuildings() {
  return [...store.buildings]
}

export function getBuildingById(id: string) {
  return store.buildings.find((building) => building.id === id)
}

export function createBuilding(input: Omit<Building, 'id'>) {
  const baseSlug = slugify(input.name)
  const existing = new Set(store.buildings.map((building) => building.id))
  let id = baseSlug
  let suffix = 2
  while (existing.has(id)) {
    id = `${baseSlug}-${suffix}`
    suffix += 1
  }

  const created: Building = { ...input, id }
  store.buildings.push(created)
  store.buildingGuides[id] = createDefaultGuidesForBuilding(id)
  return created
}

export function updateBuilding(input: Building) {
  const index = store.buildings.findIndex((building) => building.id === input.id)
  if (index === -1) throw new Error('Building not found')
  store.buildings[index] = input
  return input
}

export function deleteBuilding(id: string) {
  const index = store.buildings.findIndex((building) => building.id === id)
  if (index === -1) throw new Error('Building not found')
  store.buildings.splice(index, 1)
  delete store.buildingGuides[id]
}

export function getBuildingCategories(buildingId: string): Category[] {
  ensureBuildingExists(buildingId)
  const guides = store.buildingGuides[buildingId] ?? {}
  return Object.values(guides)
    .map((entry) => entry.category)
    .sort((a, b) => a.order - b.order)
}

export function getBuildingCategoryContent(buildingId: string, categorySlug: string) {
  ensureBuildingExists(buildingId)
  const guides = store.buildingGuides[buildingId] ?? {}
  return guides[categorySlug]?.content
}

export function getBuildingGuideCategory(buildingId: string, categorySlug: string) {
  ensureBuildingExists(buildingId)
  return store.buildingGuides[buildingId]?.[categorySlug]
}

export function createBuildingGuideCategory(
  buildingId: string,
  input: {
    slug: string
    title: string
    subtitle: string
    icon: string
    color: Category['color']
    intro: string
    alert?: GuideContent['alert']
    sections: ContentSection[]
  }
) {
  ensureBuildingExists(buildingId)
  if (!store.buildingGuides[buildingId]) {
    store.buildingGuides[buildingId] = {}
  }
  const categorySlug = slugify(input.slug)
  if (store.buildingGuides[buildingId][categorySlug]) {
    throw new Error('Section slug already exists for this building')
  }

  const order = Object.keys(store.buildingGuides[buildingId]).length + 1
  const created: BuildingGuideCategory = {
    category: {
      id: `${buildingId}-${categorySlug}`,
      slug: categorySlug,
      title: input.title,
      subtitle: input.subtitle,
      icon: input.icon,
      color: input.color,
      order,
    },
    content: {
      intro: input.intro,
      alert: input.alert,
      sections: cloneSections(input.sections),
    },
  }
  store.buildingGuides[buildingId][categorySlug] = created
  return created
}

export function updateBuildingGuideCategory(
  buildingId: string,
  categorySlug: string,
  input: {
    title: string
    subtitle: string
    icon: string
    color: Category['color']
    intro: string
    alert?: GuideContent['alert']
    sections: ContentSection[]
  }
) {
  ensureBuildingExists(buildingId)
  const existing = store.buildingGuides[buildingId]?.[categorySlug]
  if (!existing) {
    throw new Error('Guide section not found')
  }

  store.buildingGuides[buildingId][categorySlug] = {
    category: {
      ...existing.category,
      title: input.title,
      subtitle: input.subtitle,
      icon: input.icon,
      color: input.color,
    },
    content: {
      intro: input.intro,
      alert: input.alert,
      sections: cloneSections(input.sections),
    },
  }

  return store.buildingGuides[buildingId][categorySlug]
}

export function deleteBuildingGuideCategory(buildingId: string, categorySlug: string) {
  ensureBuildingExists(buildingId)
  const existing = store.buildingGuides[buildingId]?.[categorySlug]
  if (!existing) {
    throw new Error('Guide section not found')
  }
  delete store.buildingGuides[buildingId][categorySlug]
}

export function getEffectiveSupportContact() {
  const emergency = store.emergencyInfos[0]
  return {
    phone: emergency?.phone ?? '+41 61 000 00 00',
    email: emergency?.email ?? 'emergency@wowliving.ch',
  }
}

export function hasFullAccess(access: TeamAccess) {
  return access === 'full-access'
}
