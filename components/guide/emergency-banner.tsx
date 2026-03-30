import { AlertTriangle, Phone } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmergencyBannerProps {
  phone: string
  className?: string
}

export function EmergencyBanner({ phone, className }: EmergencyBannerProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-destructive/10 border border-destructive/20 p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/20 flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">Emergency?</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Available 24/7 for urgent issues
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <a
          href={`tel:${phone.replace(/\s/g, '')}`}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-medium text-sm hover:bg-destructive/90 transition-colors"
        >
          <Phone className="w-4 h-4" />
          Call {phone}
        </a>
        <Link
          href="/category/emergency"
          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-card border border-border font-medium text-sm hover:bg-secondary transition-colors"
        >
          View Emergency Info
        </Link>
      </div>
    </div>
  )
}
