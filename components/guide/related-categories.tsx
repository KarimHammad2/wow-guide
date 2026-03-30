import { CategoryTile } from './category-tile'
import { getRelatedCategories, categories as allCategories, type Category } from '@/lib/data'
import { cn } from '@/lib/utils'

interface StaticCategoryLink {
  name: string
  slug: string
}

interface RelatedCategoriesProps {
  currentSlug?: string
  categories?: StaticCategoryLink[]
  categoryObjects?: Category[]
  buildingSlug?: string
  className?: string
}

export function RelatedCategories({
  currentSlug,
  categories,
  categoryObjects,
  buildingSlug,
  className,
}: RelatedCategoriesProps) {
  const relatedCategories = categoryObjects
    ? categoryObjects.filter((category) => category.slug !== currentSlug).slice(0, 3)
    : categories
    ? categories
        .map((item) => allCategories.find((category) => category.slug === item.slug))
        .filter((category): category is (typeof allCategories)[number] => Boolean(category))
    : getRelatedCategories(currentSlug ?? '', 3)

  return (
    <section className={cn('space-y-4', className)}>
      <h3 className="font-semibold text-lg text-foreground">
        Related Topics
      </h3>
      <div className="space-y-3">
        {relatedCategories.map((category) => (
          <CategoryTile 
            key={category.id} 
            category={category} 
            buildingSlug={buildingSlug}
          />
        ))}
      </div>
    </section>
  )
}
