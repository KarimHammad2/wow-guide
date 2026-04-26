import type { ContentSection } from '@/lib/data'
import type { JSONContent } from '@tiptap/core'

/** Page header (category title in DB). */
export const BRISTENWEG_10_INTERNET_CATEGORY_TITLE = 'INTERNET & ENTERTAINMENT'

/** Internet paragraph (shown in the catalog band Wi‑Fi row). */
export const BRISTENWEG_10_INTERNET_INTRO =
  "Speed is our friend. We know how important a stable and fast internet connection is. That's why we provide you with a high-speed internet connection. You will find the login information for the internet on the panel near the kitchen."

export const BRISTENWEG_10_INTERNET_TV_INTRO =
  'Your smart TV offers the use of various apps. The streaming app Zattoo is pre-installed and offers you access to an unlimited subscription.'

export const BRISTENWEG_10_INTERNET_IMAGE_PATHS = {
  qrPanels: '/guides/bristenweg-10/internet-qr-panels.png',
  slide2: '/guides/bristenweg-10/internet-slide-2.png',
  spotify1: '/guides/bristenweg-10/spotify-playlists-1.png',
  spotify2: '/guides/bristenweg-10/spotify-playlists-2.png',
} as const

const ZATTOO_LINK = 'https://zattoo.com/en'

/** Zattoo + Frame TV paragraph; “channels” links to Zattoo. */
export const zattooDetailRichText: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'With Zattoo you have access to an unlimited TV offer. Through the Zattoo app you access over 250 TV ',
        },
        {
          type: 'text',
          text: 'channels',
          marks: [
            {
              type: 'link',
              attrs: { href: ZATTOO_LINK, rel: 'noopener noreferrer', target: '_blank' },
            },
          ],
        },
        {
          type: 'text',
          text: ' from BBC One to euronews to bloomberg, enjoy the whole range in HD. You access the Zattoo app through the start menu of your Frame TV.',
        },
      ],
    },
  ],
}

const SYMFONISK_IKEA_SUPPORT_URL =
  'https://www.ikea.com/ch/en/customer-service/product-support/symfonisk/how-to-use-symfonisk-pub180e00a9/'
const SYMFONISK_YOUTUBE_SEARCH_URL =
  'https://www.youtube.com/results?search_query=How+to+use+your+IKEA+SYMFONISK+bookshelf+speaker+IKEA+Canada'

export function getBristenweg10InternetSections(
  paths: typeof BRISTENWEG_10_INTERNET_IMAGE_PATHS = BRISTENWEG_10_INTERNET_IMAGE_PATHS
): ContentSection[] {
  return [
    {
      id: 'bw10-net-catalog-hero',
      blockId: 'bw10-net-catalog-hero',
      type: 'catalogBand',
      title: BRISTENWEG_10_INTERNET_CATEGORY_TITLE,
      backgroundColor: '#9b5d72',
      textColor: '#ffffff',
      items: [
        {
          id: 'bw10-net-row-wifi',
          icon: 'Wifi',
          title: BRISTENWEG_10_INTERNET_INTRO,
          image: paths.qrPanels,
          description: 'WOW Guide and Internet login QR codes on purple panels near the kitchen.',
        },
        {
          id: 'bw10-net-row-tv',
          icon: 'Tv',
          title: BRISTENWEG_10_INTERNET_TV_INTRO,
        },
      ],
    },
    {
      id: 'bw10-net-slide-2',
      blockId: 'bw10-net-slide-2',
      type: 'image',
      title: 'TV, Zattoo & Sonos',
      mediaUrl: paths.slide2,
      caption: 'Zattoo, Sonos, and speaker help.',
    },
    {
      id: 'bw10-zattoo-detail',
      blockId: 'bw10-zattoo-detail',
      type: 'text',
      title: 'Zattoo',
      richText: zattooDetailRichText,
    },
    {
      id: 'bw10-sonos-steps',
      blockId: 'bw10-sonos-steps',
      type: 'steps',
      title: 'Sonos',
      items: [
        { id: 'bw10-sonos-1', title: 'Connect yourself with the wifi' },
        { id: 'bw10-sonos-2', title: 'Open your favorite music-player' },
        {
          id: 'bw10-sonos-3',
          title: 'Select the Sonos box for your apartment (name shown in the Sonos app)',
        },
        { id: 'bw10-sonos-4', title: 'Enjoy one of our WOW playlists' },
      ],
    },
    {
      id: 'bw10-symfonisk-help',
      blockId: 'bw10-symfonisk-help',
      type: 'links',
      title: 'How to use your IKEA SYMFONISK bookshelf speaker',
      items: [
        {
          id: 'bw10-sym-1',
          title: 'IKEA: How to use SYMFONISK (official guide)',
          link: SYMFONISK_IKEA_SUPPORT_URL,
        },
        {
          id: 'bw10-sym-2',
          title: 'Find the IKEA Canada video on YouTube',
          link: SYMFONISK_YOUTUBE_SEARCH_URL,
        },
      ],
    },
    {
      id: 'bw10-spotify-heading',
      blockId: 'bw10-spotify-heading',
      type: 'text',
      title: 'ENJOY OUR WOW LIVING PLAYLIST ON SPOTIFY',
      content: '',
    },
    {
      id: 'bw10-spotify-steps',
      blockId: 'bw10-spotify-steps',
      type: 'steps',
      items: [
        { id: 'bw10-sp-1', title: 'Open Spotify' },
        { id: 'bw10-sp-2', title: 'Go to search' },
        { id: 'bw10-sp-3', title: 'Scan the code' },
        { id: 'bw10-sp-4', title: 'Enjoy the music' },
      ],
    },
    {
      id: 'bw10-spotify-sheet-1',
      blockId: 'bw10-spotify-sheet-1',
      type: 'image',
      title: 'WOW Living playlists on Spotify',
      mediaUrl: paths.spotify1,
      caption: 'WOW LIVING // APÉRO, YOGA, EXPLORE THE CITY, DANCE LIKE NOBODY IS WATCHING',
    },
    {
      id: 'bw10-spotify-sheet-2',
      blockId: 'bw10-spotify-sheet-2',
      type: 'image',
      title: 'More WOW Living playlists',
      mediaUrl: paths.spotify2,
      caption:
        'WOW LIVING // APÉRO, YOGA, EXPLORE THE CITY, DANCE LIKE NOBODY IS WATCHING, COOKING, AFTER WORKS CALM',
    },
  ]
}
