import type { ContentSection } from '@/lib/data'
import type { JSONContent } from '@tiptap/core'

export const BRISTENWEG_10_SPORT_ACTIVITY_CATEGORY_TITLE = 'SPORT & ACTIVITIES'

export const BRISTENWEG_10_SPORT_ACTIVITY_INTRO =
  'Basel has a lot to offer in terms of sports and activities. Here is a small selection of what we would do in Basel.'

export const BRISTENWEG_10_SPORT_IMAGE_PATHS = {
  slide1: '/guides/bristenweg-10/sport-slide-1.png',
  slide2: '/guides/bristenweg-10/sport-slide-2.png',
  slide3: '/guides/bristenweg-10/sport-slide-3.png',
} as const

const LINK_BASEL_SPORT = 'https://www.baselstadt.ch/sport'
const LINK_ALT_LIGA_BASEL = 'https://www.ligabasel.ch/'
const LINK_KOMOOT_BASEL = 'https://www.komoot.com/explore/basel/basel/running'
const LINK_KOERPERFORMEN_BASEL = 'https://xn--krperformen-rfb.com/en/studios/koerperformen-basel/'
const LINK_PUREGYM_BASEL = 'https://www.puregym.com/ch/gyms/?query=basel'
const LINK_MARKTHALLE = 'https://www.markthallebasel.ch/'
const LINK_MESSE_BASEL = 'https://www.messebasel.com/en/'
const LINK_BASEL_COMEDY = 'https://www.baselcomedy.com/'
const LINK_BREAKOUT_BASEL = 'https://www.breakoutbasel.ch/en/'
const LINK_FC_BASEL = 'https://www.fcb.ch/en/'

function linkMark(text: string, href: string): JSONContent {
  return {
    type: 'text',
    text,
    marks: [{ type: 'link', attrs: { href, rel: 'noopener noreferrer', target: '_blank' } }],
  }
}

/** Sport: clubs directory + Alternative League Basel. */
export const sportClubsRichText: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Do you want to become active in sports in an association? Basel has over 200 sports clubs that would be happy to have another member in their ranks. ',
        },
        linkMark('Here', LINK_BASEL_SPORT),
        {
          type: 'text',
          text: ' you can find a complete list with contact details (in German).',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Do you like playing football? With Basel, you\'ve chosen the football city of choice. For people who are a little less ambitious but still enjoy a good football game we recommend to contact the ',
        },
        linkMark('Alternative League Basel', LINK_ALT_LIGA_BASEL),
        {
          type: 'text',
          text: '. The amateur league has a league of 8 teams that compete 11 against 11.',
        },
      ],
    },
  ],
}

/** Running (Komoot) + gyms (Körperformen, Puregym). */
export const sportFitnessRichText: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Although you are in a big city, there are plenty of green spaces in Basel that invite you for a running round. On ',
        },
        linkMark('Komoot', LINK_KOMOOT_BASEL),
        {
          type: 'text',
          text: ' you can find the most beautiful running routes in Basel, some of them start very close to your apartment.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'You want to switch off the head after work? No problem, either you go to the EMS training 5 minutes from your apartment. The team of ',
        },
        linkMark('Körperformen', LINK_KOERPERFORMEN_BASEL),
        {
          type: 'text',
          text: ' trains with the EMS system — with the latest technology, your muscles are electrically stimulated and you achieve maximum performance efficiently and completely.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'If you prefer the classic fitness then check out the guys from ' },
        linkMark('Puregym Basel', LINK_PUREGYM_BASEL),
        {
          type: 'text',
          text: ". Here you'll find everything from group workouts to weight benches.",
        },
      ],
    },
  ],
}

/** Activities: Markthalle, Messe, comedy, escape room, FC Basel. */
export const activitiesRichText: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Anyone who has ever lived in Basel must have visited the ',
        },
        linkMark('Markthalle', LINK_MARKTHALLE),
        {
          type: 'text',
          text: '. The cultural meeting place near the train station offers everything from culinary delicacies to the local Saturday market and music concerts.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'With the ' },
        linkMark('exhibition center', LINK_MESSE_BASEL),
        {
          type: 'text',
          text: ', Basel has a location where innovations from all sectors are presented or young talents are given a platform. Both, people interested in business and those with an affinity for culture will find the right event. But if you prefer to laugh, then check out ',
        },
        linkMark('Basel Comedy', LINK_BASEL_COMEDY),
        { type: 'text', text: ' (also for English speakers).' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Dive into the exciting world of escape rooms at ' },
        linkMark('Breakout Basel', LINK_BREAKOUT_BASEL),
        {
          type: 'text',
          text: '. Work together with friends or family to solve challenging puzzles, uncover hidden clues, and experience thrilling adventures – perfect for team building and fun!',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'And of course, the home football club ' },
        linkMark('FC Basel', LINK_FC_BASEL),
        {
          type: 'text',
          text: ' must not be missing here. Even for non-football fans, a visit to the affectionately named Joggeli Stadium is worth the trip.',
        },
      ],
    },
  ],
}

export function getBristenweg10SportActivitySections(
  paths: typeof BRISTENWEG_10_SPORT_IMAGE_PATHS = BRISTENWEG_10_SPORT_IMAGE_PATHS
): ContentSection[] {
  return [
    {
      id: 'bw10-sport-text',
      blockId: 'bw10-sport-text',
      type: 'text',
      title: 'SPORT',
      richText: sportClubsRichText,
    },
    {
      id: 'bw10-sport-slide-1',
      blockId: 'bw10-sport-slide-1',
      type: 'image',
      title: 'Sport & activities overview',
      mediaUrl: paths.slide1,
      caption: 'Sport in Basel — overview',
    },
    {
      id: 'bw10-sport-fitness-text',
      blockId: 'bw10-sport-fitness-text',
      type: 'text',
      title: 'Running & fitness',
      richText: sportFitnessRichText,
    },
    {
      id: 'bw10-sport-slide-2',
      blockId: 'bw10-sport-slide-2',
      type: 'image',
      title: 'Football, running & fitness',
      mediaUrl: paths.slide2,
      caption: 'More sport ideas in Basel',
    },
    {
      id: 'bw10-activities-text',
      blockId: 'bw10-activities-text',
      type: 'text',
      title: 'ACTIVITIES',
      richText: activitiesRichText,
    },
    {
      id: 'bw10-sport-slide-3',
      blockId: 'bw10-sport-slide-3',
      type: 'image',
      title: 'Activities in Basel',
      mediaUrl: paths.slide3,
      caption: 'Markthalle, culture, comedy, escape rooms & FC Basel',
    },
  ]
}
