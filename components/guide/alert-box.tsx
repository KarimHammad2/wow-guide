import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertBoxProps {
  type: 'info' | 'warning' | 'success' | 'danger'
  title?: string
  message: string
  className?: string
}

const alertConfig = {
  info: {
    icon: Info,
    className: 'bg-primary/5 border-primary/20 text-foreground',
    iconClassName: 'text-primary',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-accent/30 border-accent/50 text-accent-foreground',
    iconClassName: 'text-accent-foreground',
  },
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-900',
    iconClassName: 'text-green-600',
  },
  danger: {
    icon: XCircle,
    className: 'bg-destructive/10 border-destructive/30 text-foreground',
    iconClassName: 'text-destructive',
  },
}

export function AlertBox({ type, title, message, className }: AlertBoxProps) {
  const config = alertConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border',
        config.className,
        className
      )}
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconClassName)} />
      <div className="space-y-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  )
}
