import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Category } from '@/lib/data'

interface SectionListPanelProps {
  sections: Array<{ category: Category }>
  activeSlug: string | null
  onSelect: (slug: string) => void
  onReorder: (slug: string, direction: 'up' | 'down') => void
  onDropMove: (sourceSlug: string, targetSlug: string) => void
  newSectionName: string
  onNewSectionNameChange: (value: string) => void
  onCreateSection: () => void
}

export function SectionListPanel({
  sections,
  activeSlug,
  onSelect,
  onReorder,
  onDropMove,
  newSectionName,
  onNewSectionNameChange,
  onCreateSection,
}: SectionListPanelProps) {
  return (
    <aside className="rounded-2xl border border-border p-4 space-y-3">
      <p className="text-sm font-semibold">Sections</p>
      <div className="space-y-2">
        {sections.map((item, index) => (
          <div
            key={item.category.slug}
            className={`rounded-xl border p-2 ${activeSlug === item.category.slug ? 'border-primary bg-primary/5' : 'border-border'}`}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/section-slug', item.category.slug)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const sourceSlug = event.dataTransfer.getData('text/section-slug')
              if (sourceSlug && sourceSlug !== item.category.slug) {
                onDropMove(sourceSlug, item.category.slug)
              }
            }}
          >
            <button
              type="button"
              className="text-left w-full text-sm font-medium"
              onClick={() => onSelect(item.category.slug)}
            >
              {item.category.title}
            </button>
            <div className="mt-2 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => onReorder(item.category.slug, 'up')}
              >
                Up
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={index === sections.length - 1}
                onClick={() => onReorder(item.category.slug, 'down')}
              >
                Down
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-border space-y-2">
        <Input
          placeholder="New section title"
          value={newSectionName}
          onChange={(event) => onNewSectionNameChange(event.target.value)}
        />
        <Button size="sm" className="w-full" onClick={onCreateSection}>
          Add Section
        </Button>
      </div>
    </aside>
  )
}
