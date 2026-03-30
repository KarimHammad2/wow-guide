import { FileText, Play, Download, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ManualCardProps {
  title: string
  description?: string
  subtitle?: string
  fileType?: 'pdf' | 'video'
  fileUrl?: string
  href?: string
  className?: string
}

export function ManualCard({
  title,
  description,
  subtitle,
  fileType = 'pdf',
  fileUrl,
  href,
  className,
}: ManualCardProps) {
  const resolvedUrl = fileUrl ?? href ?? '#'
  const resolvedDescription = description ?? subtitle
  const isPdf = fileType === 'pdf'

  return (
    <a
      href={resolvedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-md transition-all active:scale-[0.98]',
        className
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          isPdf ? 'bg-destructive/10' : 'bg-primary/10'
        )}
      >
        {isPdf ? (
          <FileText className="w-6 h-6 text-destructive" />
        ) : (
          <Play className="w-6 h-6 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{title}</h4>
        {resolvedDescription && (
          <p className="text-sm text-muted-foreground truncate">{resolvedDescription}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1 uppercase">
          {isPdf ? 'PDF Manual' : 'Video Guide'}
        </p>
      </div>
      <div className="text-muted-foreground">
        {isPdf ? (
          <Download className="w-5 h-5" />
        ) : (
          <ExternalLink className="w-5 h-5" />
        )}
      </div>
    </a>
  )
}
