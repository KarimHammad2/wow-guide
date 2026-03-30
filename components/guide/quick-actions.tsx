import Link from 'next/link'
import { Key, Wifi, Sparkles, Car, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const actions = [
  {
    id: 'checkin',
    title: 'Check-In Info',
    description: 'Access codes & arrival',
    icon: Key,
    slug: 'check-in-out',
    color: 'bg-primary text-primary-foreground',
  },
  {
    id: 'wifi',
    title: 'WiFi Password',
    description: 'Get connected',
    icon: Wifi,
    slug: 'internet-tv',
    color: 'bg-accent text-accent-foreground',
  },
  {
    id: 'cleaning',
    title: 'Cleaning Schedule',
    description: 'Upcoming visits',
    icon: Sparkles,
    slug: 'cleaning',
    color: 'bg-primary text-primary-foreground',
  },
  {
    id: 'parking',
    title: 'Parking Access',
    description: 'Garage & codes',
    icon: Car,
    slug: 'parking',
    color: 'bg-accent text-accent-foreground',
  },
]

interface QuickActionsProps {
  className?: string
  buildingSlug?: string
}

export function QuickActions({ className, buildingSlug }: QuickActionsProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <h2 className="text-lg md:text-xl font-semibold text-foreground">Quick Access</h2>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon
          const href = buildingSlug 
            ? `/building/${buildingSlug}/category/${action.slug}`
            : `/category/${action.slug}`
          return (
            <Link
              key={action.id}
              href={href}
              className="group flex flex-col p-4 rounded-2xl bg-card border border-border hover:border-primary/25 hover:shadow-[0_22px_40px_-32px_rgba(101,40,67,0.7)] transition-all active:scale-[0.98]"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                  action.color
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground text-sm md:text-[0.95rem]">
                {action.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {action.description}
              </p>
              <div className="mt-auto pt-3 flex items-center text-primary text-xs font-medium">
                <span>View</span>
                <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
