import { Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ContactCardProps {
  variant?: 'default' | 'emergency'
  phone?: string
  email?: string
  hours?: string
  title?: string
  className?: string
}

export function ContactCard({
  variant = 'default',
  phone,
  email,
  hours,
  title,
  className,
}: ContactCardProps) {
  const isEmergency = variant === 'emergency'

  return (
    <div
      className={cn(
        'rounded-2xl p-5 border',
        isEmergency
          ? 'bg-destructive/10 border-destructive/30'
          : 'bg-primary text-primary-foreground border-primary',
        className
      )}
    >
      {title && (
        <h3
          className={cn(
            'font-semibold text-lg mb-4',
            isEmergency ? 'text-foreground' : 'text-primary-foreground'
          )}
        >
          {title}
        </h3>
      )}

      <div className="space-y-3">
        {phone && (
          <div className="flex items-center gap-3">
            <Phone
              className={cn(
                'w-5 h-5',
                isEmergency ? 'text-destructive' : 'text-accent'
              )}
            />
            <span className={cn('font-medium', isEmergency ? 'text-foreground' : '')}>
              {phone}
            </span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-3">
            <Mail
              className={cn(
                'w-5 h-5',
                isEmergency ? 'text-destructive' : 'text-accent'
              )}
            />
            <span className={isEmergency ? 'text-foreground' : ''}>{email}</span>
          </div>
        )}
        {hours && (
          <div className="flex items-center gap-3">
            <Clock
              className={cn(
                'w-5 h-5',
                isEmergency ? 'text-destructive' : 'text-accent'
              )}
            />
            <span
              className={cn(
                'text-sm',
                isEmergency ? 'text-muted-foreground' : 'text-primary-foreground/80'
              )}
            >
              {hours}
            </span>
          </div>
        )}
      </div>

      {phone && (
        <div className="mt-5 flex gap-3">
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex-1">
            <Button
              className={cn(
                'w-full gap-2',
                isEmergency
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-accent text-accent-foreground hover:bg-accent/90'
              )}
            >
              <Phone className="w-4 h-4" />
              Call Now
            </Button>
          </a>
          {!isEmergency && (
            <Button
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
