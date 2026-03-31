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
  { slug: 'check-in', title: 'Check-In', subtitle: 'Arrival and access', icon: 'KeyRound', color: 'primary' },
  { slug: 'check-out', title: 'Check-Out', subtitle: 'Departure steps', icon: 'LogOut', color: 'muted' },
  { slug: 'internet', title: 'Internet', subtitle: 'WiFi and connectivity', icon: 'Wifi', color: 'accent' },
  { slug: 'e-scooter', title: 'E-Scooter', subtitle: 'Usage and parking', icon: 'Bike', color: 'muted' },
  { slug: 'home-devices', title: 'Home Devices', subtitle: 'Appliances and controls', icon: 'HousePlug', color: 'primary' },
  { slug: 'cleaning', title: 'Cleaning', subtitle: 'Housekeeping and standards', icon: 'Sparkles', color: 'accent' },
  { slug: 'laundry', title: 'Laundry', subtitle: 'Washer and dryer guidance', icon: 'Shirt', color: 'muted' },
  { slug: 'waste-plan', title: 'Waste Plan', subtitle: 'Waste sorting and pickup', icon: 'Trash2', color: 'primary' },
  { slug: 'sport-activity', title: 'Sport and Activity', subtitle: 'Fitness and outdoor activity', icon: 'Dumbbell', color: 'accent' },
  { slug: 'checkout', title: 'Checkout', subtitle: 'Final verification', icon: 'CheckCircle2', color: 'primary' },
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
  const defaults: Record<string, GuideContent> = {
    'check-in': {
      intro: 'Follow these steps for a smooth and fast arrival.',
      sections: [
        {
          id: 'check-in-hero',
          blockId: 'check-in-hero',
          type: 'hero',
          title: 'Welcome to your building',
          content: 'Your access details are available from 15:00 on your arrival date.',
          styleVariant: 'highlighted',
        },
        {
          id: 'check-in-steps',
          blockId: 'check-in-steps',
          type: 'steps',
          title: 'Arrival steps',
          items: [
            { id: '1', title: 'Open your guest portal link', description: 'Use the secure link sent by email.' },
            { id: '2', title: 'Verify your booking code', description: 'Enter the code exactly as received.' },
            { id: '3', title: 'Collect keys / digital access', description: 'Follow on-screen instructions for entry.' },
          ],
        },
      ],
    },
    'check-out': {
      intro: 'Prepare your departure quickly with this checklist.',
      sections: [
        {
          id: 'check-out-list',
          blockId: 'check-out-list',
          type: 'checklist',
          title: 'Before leaving',
          items: [
            { id: '1', title: 'Close all windows and switch off lights' },
            { id: '2', title: 'Leave used towels in the bathroom' },
            { id: '3', title: 'Place keys/access card at the return point' },
          ],
        },
      ],
    },
    internet: {
      intro: 'Everything you need to get online quickly.',
      sections: [
        {
          id: 'internet-card',
          blockId: 'internet-card',
          type: 'card',
          title: 'WiFi access',
          content: 'Network: WOW_Guest | Password: Provided at check-in.',
          styleVariant: 'highlighted',
        },
      ],
    },
    'e-scooter': {
      intro: 'Use shared mobility safely and responsibly.',
      sections: [
        {
          id: 'escooter-steps',
          blockId: 'escooter-steps',
          type: 'steps',
          title: 'How to use',
          items: [
            { id: '1', title: 'Unlock from app', description: 'Scan the QR code on the scooter.' },
            { id: '2', title: 'Wear protection', description: 'Helmet strongly recommended.' },
            { id: '3', title: 'Park in marked zone', description: 'Avoid blocking doors and walkways.' },
          ],
        },
      ],
    },
    'home-devices': {
      intro: 'Quick references for apartment devices.',
      sections: [
        {
          id: 'home-devices-links',
          blockId: 'home-devices-links',
          type: 'links',
          title: 'Device guides',
          items: [
            { id: '1', title: 'Cooktop Manual', link: 'https://example.com/cooktop' },
            { id: '2', title: 'Heating Thermostat Guide', link: 'https://example.com/thermostat' },
          ],
        },
      ],
    },
    cleaning: {
      intro: 'Cleaning standards and service timing.',
      sections: [
        {
          id: 'cleaning-schedule',
          blockId: 'cleaning-schedule',
          type: 'schedule',
          title: 'Cleaning slots',
          items: [
            { id: '1', title: 'Weekly standard cleaning', description: 'Every Tuesday 09:00 - 12:00' },
            { id: '2', title: 'Additional requests', description: 'Book at least 24h in advance' },
          ],
        },
      ],
    },
    laundry: {
      intro: 'Laundry room usage and etiquette.',
      sections: [
        {
          id: 'laundry-tabs',
          blockId: 'laundry-tabs',
          type: 'tabs',
          title: 'Laundry options',
          items: [
            { id: '1', title: 'In-building machines', description: 'Available 07:00 - 22:00' },
            { id: '2', title: 'Nearby laundromat', description: '3 minutes walk from entrance' },
          ],
        },
      ],
    },
    'waste-plan': {
      intro: 'Please follow local recycling rules.',
      sections: [
        {
          id: 'waste-plan-accordion',
          blockId: 'waste-plan-accordion',
          type: 'accordion',
          title: 'Waste sorting',
          items: [
            { id: '1', title: 'General waste', description: 'Use official city waste bags only.' },
            { id: '2', title: 'Paper & cardboard', description: 'Flatten and place in recycling room.' },
            { id: '3', title: 'Glass', description: 'Use public glass collection points.' },
          ],
        },
      ],
    },
    'sport-activity': {
      intro: 'Discover nearby sport and activity options.',
      sections: [
        {
          id: 'sport-media',
          blockId: 'sport-media',
          type: 'media',
          title: 'Recommended places',
          mediaUrl: '/images/buildings/kannenfeldstrasse.jpg',
          caption: 'Walking routes, gym, and sport fields around the building.',
        },
      ],
    },
    checkout: {
      intro: 'Final handover details for a successful closure.',
      sections: [
        {
          id: 'checkout-links',
          blockId: 'checkout-links',
          type: 'links',
          title: 'Final actions',
          items: [
            { id: '1', title: 'Report issue before leaving', link: 'mailto:mail@wowliving.ch' },
            { id: '2', title: 'Open departure form', link: 'https://example.com/checkout' },
          ],
        },
      ],
    },
  }

  const direct = defaults[slug]
  if (direct) {
    return {
      intro: direct.intro,
      alert: direct.alert,
      sections: cloneSections(direct.sections),
    }
  }

  const seed = seedCategoryContent[slug]
  if (seed) {
    return { intro: seed.intro, alert: seed.alert, sections: cloneSections(seed.sections) }
  }

  return { intro: 'Add your guide information here.', sections: [] }
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

const defaultSwissCities: City[] = [
  { id: 'city-basel', name: 'Basel', country: 'Switzerland' },
  { id: 'city-luzern', name: 'Luzern', country: 'Switzerland' },
  { id: 'city-schwyz', name: 'Schwyz', country: 'Switzerland' },
  { id: 'city-zug', name: 'Zug', country: 'Switzerland' },
  { id: 'city-zurich', name: 'Zürich', country: 'Switzerland' },
]

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
  cities: defaultSwissCities,
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

  const supportContact = getEffectiveSupportContact()
  const created: Building = {
    ...input,
    id,
    appPath: /^\/building\/[a-z0-9-]+$/i.test(input.appPath) ? input.appPath : `/building/${id}`,
    country: 'Switzerland',
    emergencyPhone: supportContact.phone,
    supportEmail: supportContact.email,
  }
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
    order?: number
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
      order: input.order ?? existing.category.order,
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
