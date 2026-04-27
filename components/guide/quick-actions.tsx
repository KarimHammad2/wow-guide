import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/data'
import { CategoryIconDisplay } from '@/components/guide/category-icon'

const iconCircle: Record<
  Category['color'],
  string
> = {
  primary: 'bg-primary text-primary-foreground',
  accent: 'bg-accent text-accent-foreground',
  muted: 'bg-secondary text-foreground border border-border',
}

interface QuickActionsProps {
  className?: string
  buildingSlug?: string
  /** Guide categories with `quick_access_order` set (from `getBuildingQuickAccessCategories`). */
  categories: Category[]
}

export function QuickActions({ className, buildingSlug, categories }: QuickActionsProps) {
  if (categories.length === 0) return null

  return (
    <section className={cn('space-y-4', className)}>
      <h2 className="text-lg md:text-xl font-semibold text-foreground">Quick Access</h2>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {categories.map((category) => {
          const href = buildingSlug
            ? `/${buildingSlug}/category/${category.slug}`
            : `/category/${category.slug}`
          const circle = iconCircle[category.color] ?? iconCircle.primary
          return (
            <Link
              key={category.id}
              href={href}
              className="group flex flex-col p-4 rounded-2xl bg-card border border-border hover:border-primary/25 hover:shadow-[0_22px_40px_-32px_rgba(101,40,67,0.7)] transition-all active:scale-[0.98]"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center mb-3 overflow-hidden shrink-0',
                  circle
                )}
              >
                <CategoryIconDisplay
                  icon={category.icon}
                  className="w-5 h-5"
                  imgClassName="w-full h-full min-h-10 min-w-10 object-cover"
                />
              </div>
              <h3 className="font-semibold text-foreground text-sm md:text-[0.95rem]">
                {category.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {category.subtitle}
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
