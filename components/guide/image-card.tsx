'use client'

import { useEffect, useState } from 'react'
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
  const [loadFailed, setLoadFailed] = useState(false)
  const normalizedSrc = src?.trim() || undefined

  useEffect(() => {
    setLoadFailed(false)
  }, [normalizedSrc])

  const showImage = Boolean(normalizedSrc) && !loadFailed

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  }

  const fitClass =
    fitMode === 'cover' ? 'object-cover' : fitMode === 'contain' ? 'object-contain' : 'object-contain'

  const emptyState = (
    <div
      className={cn(
        'relative bg-secondary',
        !fitEditorFrame && aspectClasses[aspectRatio]
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-muted-foreground">
        <ImageIcon className="mb-2 h-12 w-12 opacity-50" />
        <span className="text-sm">{loadFailed ? 'Image failed to load' : alt}</span>
        {loadFailed && normalizedSrc ? (
          <span className="mt-2 line-clamp-2 text-xs opacity-80">{normalizedSrc}</span>
        ) : !normalizedSrc ? (
          <span className="mt-2 text-xs opacity-80">Upload an image using the inspector panel.</span>
        ) : null}
      </div>
    </div>
  )

  const figure = (
    <figure className={cn('flex flex-col justify-center rounded-2xl overflow-hidden', className)}>
      {showImage ? (
        <div className="bg-transparent">
          <img
            src={normalizedSrc}
            alt={alt}
            className="w-full"
            style={{ width: '100%', height: 'auto' }}
            loading="lazy"
            decoding="async"
            onError={() => setLoadFailed(true)}
          />
        </div>
      ) : (
        emptyState
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
        {showImage ? (
          <img
            src={normalizedSrc}
            alt={alt}
            className={cn('absolute inset-0 h-full w-full', fitClass)}
            loading="lazy"
            decoding="async"
            onError={() => setLoadFailed(true)}
          />
        ) : (
          emptyState
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

  if (href && showImage) {
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
