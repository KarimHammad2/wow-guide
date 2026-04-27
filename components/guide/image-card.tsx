import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageCardProps {
  src?: string
  alt: string
  caption?: string
  href?: string
  aspectRatio?: 'square' | 'video' | 'wide'
  className?: string
  /**
   * When the visual editor sets a fixed block height, scale the image to fill that frame
   * (`object-cover`) so there are no empty side bands; edges may crop if aspect ratios differ.
   */
  fitEditorFrame?: boolean
  fitMode?: 'auto' | 'contain' | 'cover'
}

export function ImageCard({
  src,
  alt,
  caption,
  href,
  aspectRatio = 'video',
  className,
  fitEditorFrame = false,
  fitMode = 'auto',
}: ImageCardProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  }

  const fitClass =
    fitMode === 'cover' ? 'object-cover' : fitMode === 'contain' ? 'object-contain' : 'object-contain'

  const figure = (
    <figure className={cn('flex flex-col justify-center rounded-2xl overflow-hidden', className)}>
      {src ? (
        <div className="bg-transparent">
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={1067}
            sizes="(max-width: 768px) 100vw, (max-width: 1400px) 90vw, 1200px"
            className="w-full"
            style={{ width: '100%', height: 'auto' }}
            unoptimized
          />
        </div>
      ) : (
        <div
          className={cn(
            'relative bg-secondary',
            aspectClasses[aspectRatio]
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-sm">{alt}</span>
          </div>
        </div>
      )}
      {caption && (
        <figcaption className="mt-2 px-1 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )

  const framedFigure = fitEditorFrame ? (
    <figure
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 flex-col justify-center overflow-hidden rounded-2xl',
        className
      )}
    >
      <div className="relative min-h-0 w-full flex-1 bg-transparent">
        {src ? (
          <Image src={src} alt={alt} fill className={fitClass} unoptimized />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="mb-2 h-12 w-12 opacity-50" />
            <span className="text-sm">{alt}</span>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="shrink-0 px-1 pt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  ) : (
    figure
  )

  if (href && src) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('block w-full', fitEditorFrame && 'h-full')}
      >
        {framedFigure}
      </a>
    )
  }

  return framedFigure
}
