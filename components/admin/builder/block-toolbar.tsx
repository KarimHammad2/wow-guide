import { Button } from '@/components/ui/button'
import type { ContentSection } from '@/lib/data'

const BLOCK_PRESETS: Array<{ type: ContentSection['type']; label: string }> = [
  { type: 'hero', label: 'Hero' },
  { type: 'text', label: 'Text' },
  { type: 'card', label: 'Info Card' },
  { type: 'steps', label: 'Steps' },
  { type: 'checklist', label: 'Checklist' },
  { type: 'accordion', label: 'FAQ Accordion' },
  { type: 'media', label: 'Media' },
  { type: 'video', label: 'Video' },
  { type: 'links', label: 'Links' },
  { type: 'button', label: 'Button' },
  { type: 'list', label: 'List' },
  { type: 'schedule', label: 'Schedule' },
]

interface BlockToolbarProps {
  onAddBlock: (type: ContentSection['type']) => void
}

export function BlockToolbar({ onAddBlock }: BlockToolbarProps) {
  return (
    <div className="rounded-2xl border border-border p-3">
      <p className="text-xs text-muted-foreground mb-2">Add block</p>
      <div className="flex flex-wrap gap-2">
        {BLOCK_PRESETS.map((preset) => (
          <Button
            key={preset.type}
            size="sm"
            variant="outline"
            onClick={() => onAddBlock(preset.type)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
