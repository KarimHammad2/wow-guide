import Image from 'next/image'
import { getLucideIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import type { ContentItem } from '@/lib/data'

const DEFAULT_BG = '#9b5d72'
const DEFAULT_FG = '#ffffff'

export interface CatalogBandProps {
  title?: string
  items?: ContentItem[]
  backgroundColor?: string
  textColor?: string
  className?: string
}

export function CatalogBand({ title, items, backgroundColor, textColor, className }: CatalogBandProps) {
  const bg = backgroundColor?.trim() || DEFAULT_BG
  const fg = textColor?.trim() || DEFAULT_FG
  const rows = items ?? []

  return (
    <section
      className={cn(
        'catalog-band overflow-hidden rounded-3xl px-5 py-8 shadow-md sm:px-8 sm:py-10 md:px-10 md:py-12',
        className
      )}
      style={{ backgroundColor: bg, color: fg }}
    >
      {title ? (
        <h1 className="mb-8 text-2xl font-bold uppercase leading-tight tracking-wide text-balance md:mb-10 md:text-3xl lg:text-4xl">
          {title}
        </h1>
      ) : null}

      <div className="flex flex-col gap-10 sm:gap-12 md:gap-14">
        {rows.map((item) => {
          const Icon = item.icon ? getLucideIcon(item.icon) : null
          const hasImage = Boolean(item.image?.trim())

          return (
            <div
              key={item.id}
              className={cn(
                'grid gap-6',
                hasImage
                  ? 'grid-cols-1 sm:grid-cols-[minmax(3rem,4.5rem)_minmax(0,1fr)_minmax(10rem,18rem)] sm:items-center sm:gap-6 md:grid-cols-[minmax(3.5rem,5.5rem)_minmax(0,1fr)_minmax(11rem,22rem)] md:gap-8 lg:grid-cols-[minmax(4rem,6rem)_minmax(0,1fr)_minmax(12rem,24rem)]'
                  : 'grid-cols-1 sm:grid-cols-[minmax(3rem,4.5rem)_minmax(0,1fr)] sm:items-start sm:gap-6 md:gap-8'
              )}
            >
              <div
                className={cn(
                  'flex shrink-0 justify-center sm:justify-start',
                  hasImage && 'sm:self-center'
                )}
                style={{ color: fg }}
              >
                {Icon ? (
                  <Icon
                    className={cn(
                      'h-14 w-14 sm:h-20 sm:w-20 md:h-24 md:w-24',
                      hasImage && 'md:h-28 md:w-28'
                    )}
                    strokeWidth={1}
                    aria-hidden
                  />
                ) : (
                  <span
                    className="block h-14 w-14 sm:h-20 sm:w-20 md:h-24 md:w-24"
                    aria-hidden
                  />
                )}
              </div>

              <p
                className="min-w-0 text-center text-base font-light leading-relaxed sm:text-left sm:text-lg md:text-xl [&_a]:underline [&_a]:underline-offset-4"
                style={{ color: fg, opacity: 0.98 }}
              >
                {item.title}
              </p>

              {hasImage ? (
                <figure className="relative mx-auto aspect-3/4 w-full max-w-[min(100%,18rem)] overflow-hidden rounded-2xl bg-transparent sm:mx-0 sm:max-w-none sm:justify-self-end md:max-w-88">
                  <Image
                    src={item.image as string}
                    alt={item.description?.trim() || 'Guide panel photo'}
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 280px, 360px"
                  />
                </figure>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
