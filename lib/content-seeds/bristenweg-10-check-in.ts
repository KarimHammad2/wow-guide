import type { ContentSection } from '@/lib/data'
import type { JSONContent } from '@tiptap/core'

/** Category display title for the check-in page header. */
export const BRISTENWEG_10_CHECK_IN_CATEGORY_TITLE = 'CHECK IN'

export const BRISTENWEG_10_CHECK_IN_INTRO =
  'Welcome to your new WOW Apartment! It is our highest goal to make your stay as perfect as possible. Here some useful information for your check in.'

/** Public path for the self check-in photo (entrance / keybox). */
export const BRISTENWEG_10_CHECK_IN_IMAGE_PATHS = {
  entrance: '/guides/bristenweg-10/entrance.png',
} as const

const COOP_LINK_HREF = 'https://www.coop.ch/en'
const LIDL_LINK_HREF = 'https://www.lidl.ch/en'
const POST_OFFICE_LINK_HREF = 'https://www.post.ch/en/pages/suche-poststellen-filialen'

export const shoppingRichText: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'A couple of walking minutes away is a grocery store called ' },
        {
          type: 'text',
          text: 'Coop',
          marks: [
            {
              type: 'link',
              attrs: { href: COOP_LINK_HREF, rel: 'noopener noreferrer', target: '_blank' },
            },
          ],
        },
        {
          type: 'text',
          text: '. Here you can buy all kinds of food and everyday consumer goods.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Slightly less expensive and smaller is the grocery shop ' },
        {
          type: 'text',
          text: 'Lidl',
          marks: [
            {
              type: 'link',
              attrs: { href: LIDL_LINK_HREF, rel: 'noopener noreferrer', target: '_blank' },
            },
          ],
        },
        {
          type: 'text',
          text: ', another shopping possibility in the immediate proximity of your flat.',
        },
      ],
    },
  ],
}

export const lettersParcelsRichText: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Your letterbox is labeled and located in the entrance area. You can open and close it with your apartment key. We kindly ask you to empty the letterbox from time to time.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'The postman always arrives in the morning in Switzerland. Parcels can sometimes also be delivered later in the afternoon. If you are not at home, the postman will either leave the parcel next to the letterbox or deposit it at the ',
        },
        {
          type: 'text',
          text: 'post office',
          marks: [
            {
              type: 'link',
              attrs: { href: POST_OFFICE_LINK_HREF, rel: 'noopener noreferrer', target: '_blank' },
            },
          ],
        },
        {
          type: 'text',
          text: ' close by (8min walk).',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'If you need to pick up the parcel you will get a notification paper in the letterbox.',
        },
      ],
    },
  ],
}

export function getBristenweg10CheckInSections(
  imagePaths: { entrance: string } = BRISTENWEG_10_CHECK_IN_IMAGE_PATHS
): ContentSection[] {
  return [
    {
      id: 'bw10-self-checkin-heading',
      blockId: 'bw10-self-checkin-heading',
      type: 'text',
      title: 'SELF CHECK IN',
      content: '',
    },
    {
      id: 'bw10-checkin-steps',
      blockId: 'bw10-checkin-steps',
      type: 'steps',
      items: [
        {
          id: 'bw10-s1',
          title: 'Code for key by email (3 days before arrival)',
        },
        {
          id: 'bw10-s2',
          title: 'Get key from keybox with the code',
        },
        {
          id: 'bw10-s3',
          title: 'Key works for letter box, main door and apartment',
        },
        {
          id: 'bw10-s4',
          title: 'Apartment number and floor is dated on the contract',
        },
      ],
    },
    {
      id: 'bw10-personal-welcome',
      blockId: 'bw10-personal-welcome',
      type: 'text',
      content:
        'Despite the self check in, we would like to welcome you personally on the next working day, so we can answer all your questions and give you the most important information about the apartment and the building.',
    },
    {
      id: 'bw10-entrance-photo',
      blockId: 'bw10-entrance-photo',
      type: 'image',
      title: 'Building entrance and keybox',
      mediaUrl: imagePaths.entrance,
      caption: 'Entrance',
    },
    {
      id: 'bw10-restaurants',
      blockId: 'bw10-restaurants',
      type: 'card',
      title: 'RESTAURANTS / CAFÉ',
      content:
        'Here is our top 5 list of the best cafes and restaurants in your area (max 10min) and two food delivery websites',
      items: [
        {
          id: 'bw10-r1',
          title: 'Caffè Vola',
          description: 'Lovely and cozy coffee, good for an afterwork beer',
        },
        {
          id: 'bw10-r2',
          title: 'Pico Pizzeria Neubad',
          description: 'Nice pizza place, good for lunch or dinner',
        },
        {
          id: 'bw10-r3',
          title: 'Bohrerhof Restaurant',
          description: 'Traditional and delicious cuisine, good for lunch or dinner',
        },
        {
          id: 'bw10-r4',
          title: 'Pavillon im Park',
          description: 'Pleasent and a nice place to relax, in the middle of the park',
        },
        {
          id: 'bw10-r5',
          title: 'eat.ch',
          description: 'In case you just like to order something online',
        },
        {
          id: 'bw10-r6',
          title: 'Uber Eats',
          description: 'In case you just like to order something online from uber',
        },
      ],
    },
    {
      id: 'bw10-shopping',
      blockId: 'bw10-shopping',
      type: 'text',
      title: 'SHOPPING',
      richText: shoppingRichText,
    },
    {
      id: 'bw10-house-rules',
      blockId: 'bw10-house-rules',
      type: 'card',
      title: 'HOUSE RULES',
      content: 'To make living together a pleasure for everyone, there are a few house rules.',
      items: [
        { id: 'bw10-h1', title: 'General night rest is at 10 pm' },
        { id: 'bw10-h2', title: 'Please respect your neighbors' },
        { id: 'bw10-h3', title: 'Please keep the hallway and common areas free of personal belongings' },
        { id: 'bw10-h4', title: 'Please ventilate the apartment twice a day' },
        { id: 'bw10-h5', title: 'Please use the kitchen ventilation while cooking' },
        { id: 'bw10-h6', title: 'Please leave the door open after using the oven so the steam can escape' },
        {
          id: 'bw10-h7',
          title:
            'In order to prevent burn marks, please do not put any hot pans on the kitchen tray or dining table',
        },
      ],
    },
    {
      id: 'bw10-letters-parcels',
      blockId: 'bw10-letters-parcels',
      type: 'text',
      title: 'LETTERS & PARCELS',
      richText: lettersParcelsRichText,
    },
  ]
}
