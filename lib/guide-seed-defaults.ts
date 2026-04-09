import { categoryContent as seedCategoryContent, type Category, type ContentSection } from '@/lib/data'
import type { BuildingGuideCategory, GuideContent } from '@/lib/admin-types'

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

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function cloneSections(sections: ContentSection[]): ContentSection[] {
  return JSON.parse(JSON.stringify(sections)) as ContentSection[]
}

function getSeedGuideContent(slug: string): GuideContent {
  const defaults: Record<string, GuideContent> = {
    'check-in': {
      intro:
        'Welcome at your new WOW Apartment! It is our highest goal to make your stay as perfect as possible. Here is some useful information for your check in.',
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
          title: 'Self Check In',
          items: [
            {
              id: '1',
              title: 'Code access for front door and apartment',
              description: 'The front door and the apartment can be opened by code.',
            },
            {
              id: '2',
              title: 'Receive your entry code',
              description: 'You will receive the entry code minimum 24 hours before arrival.',
            },
            {
              id: '3',
              title: 'Enter code and access the building',
              description: 'After entering the code, the front door and the apartment can be opened.',
            },
            {
              id: '4',
              title: 'Check your contract details',
              description: 'The apartment number and floor are specified in the contract.',
            },
          ],
        },
        {
          id: 'check-in-personal-welcome',
          blockId: 'check-in-personal-welcome',
          type: 'text',
          title: 'Personal welcome after arrival',
          content:
            'Despite the self check in, we would like to welcome you personally after your arrival so we can answer your questions and give you the most important information about the apartment and the building.',
        },
        {
          id: 'check-in-restaurants-cafe',
          blockId: 'check-in-restaurants-cafe',
          type: 'card',
          title: 'Restaurants / Cafe',
          content:
            'Here is our top 5 list of the best cafes and restaurants in your area (max 10 min) and two food delivery websites.',
          items: [
            {
              id: '1',
              title: 'Cafe Bar Rosenkranz',
              description: 'Lovely and cozy coffee, good for an afterwork beer.',
            },
            {
              id: '2',
              title: 'Restaurant Milchhuesli',
              description: 'Swiss and European kitchen, good for lunch or dinner.',
            },
            {
              id: '3',
              title: 'Taverne Johann',
              description: 'Fancy and delicious kitchen, good for lunch or dinner.',
            },
            {
              id: '4',
              title: 'Sun kitchen',
              description: 'Authentic Thai food for lunch, take away also available.',
            },
            {
              id: '5',
              title: 'eat.ch',
              description: 'In case you just like to order something online.',
            },
            {
              id: '6',
              title: 'Uber Eats',
              description: 'In case you just like to order something online from Uber.',
            },
          ],
        },
        {
          id: 'check-in-shopping',
          blockId: 'check-in-shopping',
          type: 'card',
          title: 'Shopping',
          items: [
            {
              id: '1',
              title: 'Migros',
              description:
                'Directly across the street is the Migros grocery store. Here you can buy all kinds of food and everyday consumer goods.',
            },
            {
              id: '2',
              title: 'Denner',
              description:
                'A little cheaper and smaller is the grocery shop Denner, another shopping possibility in the immediate proximity of your flat.',
            },
          ],
        },
        {
          id: 'check-in-house-rules',
          blockId: 'check-in-house-rules',
          type: 'checklist',
          title: 'House Rules',
          items: [
            { id: '1', title: 'General night rest is at 10 pm.' },
            { id: '2', title: 'Please respect your neighbours.' },
            { id: '3', title: 'Please keep the hallway and common areas free of personal belongings.' },
            { id: '4', title: 'Please ventilate the apartment twice a day.' },
            { id: '5', title: 'Please use the kitchen ventilation while cooking.' },
            { id: '6', title: 'Please leave the door open after using the oven so the steam can escape.' },
            {
              id: '7',
              title:
                'In order to prevent burn marks, please do not put any hot pans on the kitchen tray or the dining table.',
            },
          ],
        },
        {
          id: 'check-in-letters-parcels',
          blockId: 'check-in-letters-parcels',
          type: 'text',
          title: 'Letters & Parcels',
          content:
            'Your letterbox is labelled and located in the entrance area. You can open and close it with the designated key placed in your apartment. We kindly ask you to empty the letterbox from time to time.\n\nThe postman always arrives usually in the morning in Switzerland. Parcels can sometimes also be delivered later in the afternoon. If you are not at home, the postman will either leave the parcel next to the postbox or you will get a notification letter to pick it up at the post office close by (3 min walk).',
        },
        {
          id: 'check-in-storage',
          blockId: 'check-in-storage',
          type: 'card',
          title: 'Storage',
          items: [
            {
              id: '1',
              title: 'Common cellar (free)',
              description:
                'We offer you the possibility to store your luggage in a common cellar. This cellar can be used by every guest in the house and is free of charge.',
            },
            {
              id: '2',
              title: 'Private cellar (CHF 50)',
              description:
                'Should you wish to have a private cellar, we can provide you with one for a fee of CHF 50. Please contact us.',
            },
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

export function createDefaultGuidesForBuilding(buildingId: string) {
  return DEFAULT_GUIDE_SECTIONS.reduce<Record<string, BuildingGuideCategory>>((acc, config) => {
    acc[config.slug] = makeGuideCategory(buildingId, config)
    return acc
  }, {})
}
