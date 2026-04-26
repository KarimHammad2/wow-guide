// WOW Living Guide 2.0 - Mock Data Structure
// This can later be connected to a CMS or database

export interface Building {
  id: string
  name: string
  address: string
  city: string
  appPath: string
  country: string
  imageUrl: string
  emergencyPhone: string
  supportEmail: string
  welcomeMessage: string
  /** Direct Google Maps link (hero + admin); empty uses generated search URL */
  googleMapsUrl: string
  /** Noise / curfew hours shown in Building Information */
  quietHours: string
  /** Short tips for residents (Building Information) */
  goodToKnow: string
}

export interface Category {
  id: string
  slug: string
  title: string
  subtitle: string
  icon: string
  color: 'primary' | 'accent' | 'muted'
  order: number
  /** Per-building flag used by admin/workflows to denote required sections. */
  isRequired?: boolean
}

export interface ContentSection {
  id: string
  blockId?: string
  type:
    | 'text'
    | 'steps'
    | 'alert'
    | 'card'
    | 'accordion'
    | 'schedule'
    | 'contact'
    | 'manual'
    | 'image'
    | 'tabs'
    | 'hero'
    | 'checklist'
    | 'media'
    | 'video'
    | 'links'
    | 'gallery'
    | 'list'
    | 'button'
    /** Mauve-style catalog hero: heading + rows with optional Lucide icon and side image. */
    | 'catalogBand'
  title?: string
  content?: string
  items?: ContentItem[]
  variant?: 'info' | 'warning' | 'success' | 'danger'
  mediaUrl?: string
  videoUrl?: string
  buttonUrl?: string
  textLinkUrl?: string
  /** Tiptap ProseMirror JSON for `text` blocks; takes precedence over plain `content` when rendering. */
  richText?: unknown
  caption?: string
  layout?: 'default' | 'split' | 'full-bleed'
  styleVariant?: 'default' | 'highlighted' | 'minimal'
  textColor?: string
  backgroundColor?: string
  fontSize?: number
  fontFamily?: string
  blockWidth?: number
  blockHeight?: number
  /** Horizontal placement of the block in the canvas column (editor) / layout. */
  blockAlign?: 'left' | 'center' | 'right'
  /** Vertical placement of the block content when it has extra height. */
  blockVerticalAlign?: 'top' | 'center' | 'bottom'
  /** Extra space above / below the block (pixels). */
  blockMarginTop?: number
  blockMarginBottom?: number
  rowId?: string
  /** In-block image beside body text (text / list / steps / checklist). */
  blockMediaUrl?: string
  blockMediaPosition?: 'left' | 'right'
  /** In-block side-image fit behavior: auto prefers full image visibility. */
  blockMediaFit?: 'auto' | 'contain' | 'cover'
  /** Main media fit behavior for image/media blocks. */
  mediaFit?: 'auto' | 'contain' | 'cover'
}

export interface ContentItem {
  id: string
  title: string
  /** Tiptap JSON for list/checklist rows: format text and add links without markdown. */
  richText?: unknown
  description?: string
  icon?: string
  image?: string
  link?: string
  items?: ContentItem[]
}

export interface FAQ {
  id: string
  question: string
  answer: string
  categoryId: string
}

export interface Manual {
  id: string
  title: string
  description: string
  fileUrl: string
  fileType: 'pdf' | 'video'
  categoryId: string
}

export interface Schedule {
  id: string
  title: string
  dates: string[]
  categoryId: string
  type: 'weekly' | 'monthly' | 'yearly'
}

// Mock Buildings
export const buildings: Building[] = [
  {
    id: 'kannenfeldstrasse-12',
    name: 'Kannenfeldstrasse 12',
    address: 'Kannenfeldstrasse 12',
    city: 'Basel',
    appPath: '/kannenfeldstrasse-12',
    country: 'Switzerland',
    imageUrl: '/images/buildings/kannenfeldstrasse.jpg',
    emergencyPhone: '+41 41 552 33 33',
    supportEmail: 'mail@wowliving.ch',
    welcomeMessage:
      'Welcome to your digital WOW Guide. Here you can find all the information you need for your stay. Living with a wow!',
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Kannenfeldstrasse%2012%2C%20Basel%2C%20Switzerland',
    quietHours: '22:00–07:00',
    goodToKnow: 'Recycling room is on the ground floor; bikes in the courtyard rack.',
  },
  {
    id: 'industriestrasse-70',
    name: 'Industriestrasse 70',
    address: 'Industriestrasse 70',
    city: 'Zug',
    appPath: '/industriestrasse-70',
    country: 'Switzerland',
    imageUrl: '/images/buildings/industriestrasse.jpg',
    emergencyPhone: '+41 41 552 33 33',
    supportEmail: 'mail@wowliving.ch',
    welcomeMessage:
      'Welcome to your digital WOW Guide. Here you can find all the information you need for your stay. Living with a wow!',
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Industriestrasse%2070%2C%20Zug%2C%20Switzerland',
    quietHours: '22:00–07:00',
    goodToKnow: 'Parcel lockers at the entrance; guest WiFi on the info sheet in your flat.',
  },
  {
    id: 'strassburgerallee-1',
    name: 'Strassburgerallee 1',
    address: 'Strassburgerallee 1',
    city: 'Basel',
    appPath: '/strassburgerallee-1',
    country: 'Switzerland',
    imageUrl: '/images/buildings/strassburgerallee.jpg',
    emergencyPhone: '+41 41 552 33 33',
    supportEmail: 'mail@wowliving.ch',
    welcomeMessage:
      'Welcome to your digital WOW Guide. Here you can find all the information you need for your stay. Living with a wow!',
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Strassburgerallee%201%2C%20Basel%2C%20Switzerland',
    quietHours: '22:00–07:00',
    goodToKnow: 'Underground parking: use your fob at the gate; visitors register at reception.',
  },
  {
    id: 'huobli-7',
    name: 'Hüöbli 7',
    address: 'Hüöbli 7',
    city: 'Pfäffikon SZ',
    appPath: '/huobli-7',
    country: 'Switzerland',
    imageUrl: '/images/buildings/huobli.jpg',
    emergencyPhone: '+41 41 552 33 33',
    supportEmail: 'mail@wowliving.ch',
    welcomeMessage:
      'Welcome to your digital WOW Guide. Here you can find all the information you need for your stay. Living with a wow!',
    googleMapsUrl:
      'https://www.google.com/maps/search/?api=1&query=H%C3%BC%C3%B6bli%207%2C%20Pf%C3%A4ffikon%20SZ%2C%20Switzerland',
    quietHours: '22:00–07:00',
    goodToKnow: 'Lake and shops are a short walk; quiet courtyard—please respect neighbors.',
  },
]

// Mock Categories
export const categories: Category[] = [
  {
    id: 'check-in-out',
    slug: 'check-in-out',
    title: 'Check-In / Check-Out',
    subtitle: 'Arrival and departure info',
    icon: 'Key',
    color: 'primary',
    order: 1,
  },
  {
    id: 'internet-tv',
    slug: 'internet-tv',
    title: 'Internet & TV',
    subtitle: 'WiFi, streaming & entertainment',
    icon: 'Wifi',
    color: 'accent',
    order: 2,
  },
  {
    id: 'e-scooter',
    slug: 'e-scooter',
    title: 'E-Scooter',
    subtitle: 'Electric mobility options',
    icon: 'Bike',
    color: 'muted',
    order: 3,
  },
  {
    id: 'home-devices',
    slug: 'home-devices',
    title: 'Home Devices',
    subtitle: 'Appliances & equipment',
    icon: 'Lightbulb',
    color: 'primary',
    order: 4,
  },
  {
    id: 'cleaning',
    slug: 'cleaning',
    title: 'Cleaning',
    subtitle: 'Cleaning schedule & services',
    icon: 'Sparkles',
    color: 'accent',
    order: 5,
  },
  {
    id: 'laundry',
    slug: 'laundry',
    title: 'Laundry',
    subtitle: 'Washing & drying facilities',
    icon: 'WashingMachine',
    color: 'muted',
    order: 6,
  },
  {
    id: 'waste-plan',
    slug: 'waste-plan',
    title: 'Waste Plan',
    subtitle: 'Recycling & disposal',
    icon: 'Trash2',
    color: 'primary',
    order: 7,
  },
  {
    id: 'sports-activities',
    slug: 'sports-activities',
    title: 'Sports & Activities',
    subtitle: 'Fitness & recreation',
    icon: 'Dumbbell',
    color: 'accent',
    order: 8,
  },
  {
    id: 'emergency',
    slug: 'emergency',
    title: 'Emergency?',
    subtitle: 'Urgent issues outside office hours',
    icon: 'AlertTriangle',
    color: 'primary',
    order: 9,
  },
  {
    id: 'cellar',
    slug: 'cellar',
    title: 'Cellar',
    subtitle: 'Storage information',
    icon: 'Archive',
    color: 'muted',
    order: 10,
  },
  {
    id: 'parking',
    slug: 'parking',
    title: 'Parking Space',
    subtitle: 'Garage & parking info',
    icon: 'Car',
    color: 'primary',
    order: 11,
  },
  {
    id: 'meet-greet',
    slug: 'meet-greet',
    title: 'Meet & Greet',
    subtitle: 'Personal welcome service',
    icon: 'Users',
    color: 'accent',
    order: 12,
  },
]

// Category Content Data
export const categoryContent: Record<string, {
  intro: string
  alert?: { type: 'info' | 'warning' | 'success' | 'danger'; message: string }
  sections: ContentSection[]
}> = {
  'check-in-out': {
    intro: 'Everything you need to know about arriving at and departing from your apartment. We have made self check-in easy and seamless.',
    alert: {
      type: 'info',
      message: 'Please ensure you have received your access codes before arrival. Check your email for the welcome message.',
    },
    sections: [
      {
        id: 'arrival-overview',
        type: 'card',
        title: 'Arrival Overview',
        content: 'Check-in is available from 15:00 onwards. For early arrivals, please contact us in advance.',
      },
      {
        id: 'self-checkin-steps',
        type: 'steps',
        title: 'Self Check-In Steps',
        items: [
          {
            id: '1',
            title: 'Locate the Key Box',
            description: 'Find the key box at the main entrance. It is located to the right of the door.',
          },
          {
            id: '2',
            title: 'Enter Your Code',
            description: 'Enter the 6-digit code provided in your welcome email.',
          },
          {
            id: '3',
            title: 'Retrieve Your Keys',
            description: 'Take your apartment keys and the mailbox key from inside.',
          },
          {
            id: '4',
            title: 'Enter the Building',
            description: 'Use the main entrance key or buzzer code to access the building.',
          },
          {
            id: '5',
            title: 'Find Your Apartment',
            description: 'Take the elevator or stairs to your floor. Your apartment number is on the door.',
          },
        ],
      },
      {
        id: 'checkout-checklist',
        type: 'steps',
        title: 'Check-Out Checklist',
        items: [
          {
            id: '1',
            title: 'Remove Personal Belongings',
            description: 'Please ensure all your personal items are packed.',
          },
          {
            id: '2',
            title: 'Dispose of Perishables',
            description: 'Empty the refrigerator and dispose of any food items.',
          },
          {
            id: '3',
            title: 'Close All Windows',
            description: 'Ensure all windows and balcony doors are securely closed.',
          },
          {
            id: '4',
            title: 'Turn Off Appliances',
            description: 'Switch off lights, heating/AC, and unplug non-essential devices.',
          },
          {
            id: '5',
            title: 'Return Keys',
            description: 'Place all keys back in the key box and lock it with the code.',
          },
        ],
      },
    ],
  },
  'internet-tv': {
    intro: 'Stay connected during your stay. Your apartment comes equipped with high-speed WiFi and smart entertainment options.',
    sections: [
      {
        id: 'wifi-info',
        type: 'card',
        title: 'WiFi Connection',
        content: 'Connect to the high-speed WiFi network for seamless internet access throughout your apartment.',
        items: [
          {
            id: 'network',
            title: 'Network Name',
            description: 'WOW-Guest-K12',
          },
          {
            id: 'password',
            title: 'Password',
            description: 'WelcomeHome2024',
          },
        ],
      },
      {
        id: 'tv-info',
        type: 'card',
        title: 'Television',
        content: 'Your apartment includes a smart TV with access to streaming services. Use your own accounts to access Netflix, Disney+, and more.',
      },
      {
        id: 'soundbox',
        type: 'card',
        title: 'Bluetooth Speaker',
        content: 'Connect your phone to the Bluetooth speaker for music. Look for "WOW-Speaker" in your Bluetooth settings.',
      },
      {
        id: 'troubleshooting',
        type: 'accordion',
        title: 'Troubleshooting',
        items: [
          {
            id: 'wifi-slow',
            title: 'WiFi is slow or not working',
            description: 'Try restarting the router by unplugging it for 30 seconds. If issues persist, contact support.',
          },
          {
            id: 'tv-no-signal',
            title: 'TV has no signal',
            description: 'Ensure the TV is set to the correct HDMI input. Check that all cables are securely connected.',
          },
          {
            id: 'speaker-connect',
            title: 'Cannot connect to Bluetooth speaker',
            description: 'Make sure the speaker is turned on and in pairing mode (flashing blue light). Remove old pairings from your device.',
          },
        ],
      },
    ],
  },
  'cleaning': {
    intro: 'Your apartment is professionally cleaned to the highest standards. Here is everything you need to know about our cleaning services.',
    sections: [
      {
        id: 'schedule',
        type: 'card',
        title: 'Cleaning Schedule',
        content: 'Routine cleaning is provided bi-weekly (every two weeks) during your stay. Our team will coordinate access with you in advance.',
      },
      {
        id: 'routine-cleaning',
        type: 'card',
        title: 'What is Included in Routine Cleaning',
        items: [
          { id: '1', title: 'Vacuuming and mopping floors' },
          { id: '2', title: 'Dusting surfaces and furniture' },
          { id: '3', title: 'Cleaning kitchen surfaces and appliances' },
          { id: '4', title: 'Bathroom deep clean' },
          { id: '5', title: 'Fresh bed linens and towels' },
          { id: '6', title: 'Emptying trash bins' },
        ],
      },
      {
        id: 'final-cleaning',
        type: 'card',
        title: 'Final Cleaning (at Check-Out)',
        content: 'A comprehensive final cleaning is included in your booking. You do not need to deep clean before departure, but please leave the apartment in a reasonable condition.',
      },
      {
        id: 'extra-cleaning',
        type: 'card',
        title: 'Want Weekly Cleaning?',
        content: 'We offer additional cleaning services at a reasonable rate. Contact us to arrange weekly cleaning during your stay.',
      },
    ],
  },
  'laundry': {
    intro: 'Laundry facilities are available for your convenience. Please follow the building rules and be considerate of other residents.',
    sections: [
      {
        id: 'laundry-type',
        type: 'tabs',
        title: 'Laundry Access Options',
        items: [
          {
            id: 'first-come',
            title: 'First Come, First Serve',
            description: 'The laundry room is available on a first-come, first-serve basis. Check availability before heading down.',
          },
          {
            id: 'calendar',
            title: 'Calendar Booking',
            description: 'Book your laundry slot using the calendar in the building hallway. Each slot is 2 hours.',
          },
          {
            id: 'app',
            title: 'App Booking',
            description: 'Download the "WashConnect" app to book and pay for laundry slots. Building code: K12-WASH',
          },
        ],
      },
      {
        id: 'machine-instructions',
        type: 'steps',
        title: 'Machine Instructions',
        items: [
          { id: '1', title: 'Sort your laundry', description: 'Separate whites, colors, and delicates.' },
          { id: '2', title: 'Load the machine', description: 'Do not overload. Fill to about 80% capacity.' },
          { id: '3', title: 'Add detergent', description: 'Use the dispenser drawer. Do not exceed recommended amount.' },
          { id: '4', title: 'Select program', description: 'Choose appropriate wash cycle for your garments.' },
          { id: '5', title: 'Start and set timer', description: 'Note when your cycle will end and return promptly.' },
        ],
      },
      {
        id: 'etiquette',
        type: 'card',
        title: 'Laundry Etiquette',
        items: [
          { id: '1', title: 'Remove your laundry promptly when the cycle ends' },
          { id: '2', title: 'Clean the lint filter after using the dryer' },
          { id: '3', title: 'Leave machines and the room clean for the next user' },
          { id: '4', title: 'Report any issues immediately to building management' },
        ],
      },
    ],
  },
  'waste-plan': {
    intro: 'Switzerland has a comprehensive recycling system. Please help us keep our environment clean by following the local waste guidelines.',
    alert: {
      type: 'info',
      message: 'Most household waste requires special "Bebbisagg" bags in Basel. These are available at local supermarkets.',
    },
    sections: [
      {
        id: 'waste-types',
        type: 'card',
        title: 'Recycling Categories',
        items: [
          {
            id: 'household',
            title: 'Household Garbage',
            description: 'Use official Basel garbage bags (Bebbisagg). Place in the designated container.',
            icon: 'Trash2',
          },
          {
            id: 'cardboard',
            title: 'Cardboard',
            description: 'Flatten boxes and bundle with string. Collection every 2nd Tuesday.',
            icon: 'Package',
          },
          {
            id: 'paper',
            title: 'Paper',
            description: 'Newspapers, magazines, office paper. Bundle and place at collection point.',
            icon: 'FileText',
          },
          {
            id: 'glass',
            title: 'Glass',
            description: 'Separate by color. Drop off at the nearest glass container (no collection at building).',
            icon: 'Wine',
          },
          {
            id: 'pet',
            title: 'PET Bottles',
            description: 'Return to any supermarket. Collection points at Migros and Coop.',
            icon: 'Droplet',
          },
          {
            id: 'bulky',
            title: 'Bulky Goods',
            description: 'Large items require special pickup. Contact building management to arrange.',
            icon: 'Sofa',
          },
        ],
      },
      {
        id: 'collection-point',
        type: 'card',
        title: 'Collection Point',
        content: 'The building recycling station is located in the courtyard, accessible through the back entrance. Please keep the area tidy.',
      },
      {
        id: 'pickup-schedule',
        type: 'schedule',
        title: 'Pickup Schedule',
        items: [
          { id: '1', title: 'Household Waste', description: 'Every Tuesday and Friday, before 07:00' },
          { id: '2', title: 'Cardboard', description: 'Every 2nd Tuesday' },
          { id: '3', title: 'Paper', description: 'First Monday of the month' },
        ],
      },
    ],
  },
  'emergency': {
    intro:
      'Please only call for urgent issues, outside The office hours.',
    sections: [],
  },
  'parking': {
    intro: 'Parking is available for residents. Here is everything you need to know about accessing and using the parking facilities.',
    sections: [
      {
        id: 'parking-info',
        type: 'card',
        title: 'Parking Overview',
        items: [
          { id: 'rate', title: 'Monthly Rate', description: 'CHF 150 / month' },
          { id: 'availability', title: 'Availability', description: 'Subject to availability - contact us to reserve' },
          { id: 'location', title: 'Location', description: 'Underground garage, Level -1' },
        ],
      },
      {
        id: 'access-steps',
        type: 'steps',
        title: 'How to Access Parking',
        items: [
          {
            id: '1',
            title: 'Approach the Garage',
            description: 'The garage entrance is on the right side of the building, on Kannenfeldstrasse.',
          },
          {
            id: '2',
            title: 'Enter PIN Code',
            description: 'Use the keypad and enter your 4-digit parking PIN.',
          },
          {
            id: '3',
            title: 'Wait for Gate',
            description: 'The gate will open automatically. Drive in slowly.',
          },
          {
            id: '4',
            title: 'Find Your Space',
            description: 'Your assigned space number is on your parking contract.',
          },
        ],
      },
      {
        id: 'parking-rules',
        type: 'card',
        title: 'Parking Rules',
        items: [
          { id: '1', title: 'Park only in your assigned space' },
          { id: '2', title: 'Speed limit: 10 km/h in the garage' },
          { id: '3', title: 'No storage of items outside your vehicle' },
          { id: '4', title: 'Report any damages immediately' },
          { id: '5', title: 'Electric vehicle charging available on request' },
        ],
      },
    ],
  },
}

// Popular search topics for search suggestions
export const popularTopics = [
  'WiFi password',
  'Check-in time',
  'Parking access',
  'Emergency contact',
  'Cleaning schedule',
  'Laundry booking',
  'Recycling guide',
  'Check-out steps',
]

// Support contacts
export const supportContacts = {
  general: {
    email: 'mail@wowliving.ch',
    phone: '+41 552 33 33',
    hours: 'Monday - Friday, 09:00 - 18:00',
  },
  emergency: {
    phone: '+41 552 33 33',
    available: 'Outside office hours (urgent only)',
  },
}

// Helper function to get building by ID
export function getBuildingById(id: string): Building | undefined {
  return buildings.find(b => b.id === id)
}

// Helper function to get category by slug
export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug)
}

// Helper function to get category content
export function getCategoryContent(slug: string) {
  return categoryContent[slug]
}

// Helper function to get related categories
export function getRelatedCategories(currentSlug: string, count: number = 3): Category[] {
  const current = getCategoryBySlug(currentSlug)
  if (!current) return categories.slice(0, count)
  
  return categories
    .filter(c => c.slug !== currentSlug)
    .slice(0, count)
}
