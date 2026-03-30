import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageCardProps {
  src?: string
  alt: string
  caption?: string
  aspectRatio?: 'square' | 'video' | 'wide'
  className?: string
}

export function ImageCard({
  src,
  alt,
  caption,
  aspectRatio = 'video',
  className,
}: ImageCardProps) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  }

  return (
    <figure className={cn('rounded-2xl overflow-hidden', className)}>
      <div
        className={cn(
          'relative bg-secondary',
          aspectClasses[aspectRatio]
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-sm">{alt}</span>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="text-sm text-muted-foreground mt-2 px-1">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
