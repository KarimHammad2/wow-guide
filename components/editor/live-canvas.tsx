'use client'

import { Plus } from 'lucide-react'
import { GuideBlockRenderer } from '@/components/guide/blocks/guide-block-renderer'
import { Button } from '@/components/ui/button'
import type { ContentSection } from '@/lib/data'
import type { VisualBlock } from '@/lib/visual-builder-schema'

interface LiveCanvasProps {
  sections: ContentSection[]
  activeBlockId: string | null
  onSelectBlock: (blockId: string) => void
  onInlinePatch: (blockId: string, patch: Partial<ContentSection>) => void
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void
  onDeleteBlock: (blockId: string) => void
  onDuplicateBlock: (blockId: string) => void
  onReorderToIndex: (sourceBlockId: string, targetIndex: number) => void
  onInsertBlock: (index: number, type: VisualBlock['type']) => void
  onResizeBlock: (blockId: string, next: { width: number; height: number }) => void
  onDropBlockOnBlock: (sourceBlockId: string, targetBlockId: string) => void
}

const QUICK_TYPES: Array<{ type: VisualBlock['type']; label: string }> = [
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'video', label: 'Video' },
  { type: 'list', label: 'List' },
  { type: 'link', label: 'Link' },
  { type: 'button', label: 'Button' },
]

export function LiveCanvas({
  sections,
  activeBlockId,
  onSelectBlock,
  onInlinePatch,
  onMoveBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onReorderToIndex,
  onInsertBlock,
  onResizeBlock,
  onDropBlockOnBlock,
}: LiveCanvasProps) {
  function renderInsertionZone(index: number) {
    return (
      <div
        key={`zone-${index}`}
        className="rounded-lg border border-dashed border-border bg-muted/20 p-2"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const sourceBlockId = event.dataTransfer.getData('text/guide-block-id')
          if (!sourceBlockId) return
          onReorderToIndex(sourceBlockId, index)
        }}
      >
        <div className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Add block here</div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TYPES.map((preset) => (
            <Button
              key={`${index}-${preset.type}`}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => onInsertBlock(index, preset.type)}
            >
              <Plus className="mr-1 h-3 w-3" />
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {renderInsertionZone(0)}
      {sections.map((section, index) => {
        const blockId = section.blockId ?? section.id
        return (
          <div key={blockId} className="space-y-3">
            <GuideBlockRenderer
              sections={[section]}
              editable
              activeBlockId={activeBlockId}
              onSelectBlock={onSelectBlock}
              onInlinePatch={onInlinePatch}
              onMoveBlock={onMoveBlock}
              onDeleteBlock={onDeleteBlock}
              onDuplicateBlock={onDuplicateBlock}
              onDragStartBlock={(id, event) => {
                event.dataTransfer.setData('text/guide-block-id', id)
              }}
              onResizeBlock={onResizeBlock}
              onDropBlockOnBlock={onDropBlockOnBlock}
            />
            {renderInsertionZone(index + 1)}
          </div>
        )
      })}
    </div>
  )
}
