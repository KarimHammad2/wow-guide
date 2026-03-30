import { cn } from '@/lib/utils'
import type { ContentItem } from '@/lib/data'

interface InfoCardProps {
  title?: string
  content?: string
  description?: string
  items?: ContentItem[]
  variant?: 'default' | 'highlighted' | 'highlight'
  className?: string
}

export function InfoCard({
  title,
  content,
  description,
  items,
  variant = 'default',
  className,
}: InfoCardProps) {
  const normalizedVariant = variant === 'highlight' ? 'highlighted' : variant
  const textContent = content ?? description

  return (
    <div
      className={cn(
        'rounded-2xl p-5 border',
        normalizedVariant === 'highlighted'
          ? 'bg-accent/30 border-accent/50'
          : 'bg-card border-border',
        className
      )}
    >
      {title && (
        <h3 className="font-semibold text-lg mb-3 text-foreground">{title}</h3>
      )}
      {textContent && (
        <p className="text-muted-foreground leading-relaxed">{textContent}</p>
      )}
      {items && items.length > 0 && (
        <ul className={cn('space-y-3', textContent && 'mt-4')}>
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              {item.description ? (
                <div className="flex-1">
                  <span className="font-medium text-foreground block">
                    {item.title}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {item.description}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-muted-foreground">{item.title}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
