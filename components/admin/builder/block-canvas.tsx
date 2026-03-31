import { Button } from '@/components/ui/button'
import type { ContentSection } from '@/lib/data'

interface BlockCanvasProps {
  blocks: ContentSection[]
  activeBlockId: string | null
  onSelectBlock: (blockId: string) => void
  onReorderBlock: (blockId: string, direction: 'up' | 'down') => void
  onDropMoveBlock: (sourceBlockId: string, targetBlockId: string) => void
  onDeleteBlock: (blockId: string) => void
}

export function BlockCanvas({
  blocks,
  activeBlockId,
  onSelectBlock,
  onReorderBlock,
  onDropMoveBlock,
  onDeleteBlock,
}: BlockCanvasProps) {
  return (
    <div className="rounded-2xl border border-border p-4 space-y-2">
      <p className="text-sm font-semibold">Block Canvas</p>
      {blocks.length === 0 && (
        <p className="text-sm text-muted-foreground">No blocks yet. Add your first block.</p>
      )}
      {blocks.map((block, index) => {
        const id = block.blockId ?? block.id
        return (
          <div
            key={id}
            className={`rounded-xl border p-3 ${activeBlockId === id ? 'border-primary bg-primary/5' : 'border-border'}`}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/block-id', id)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const sourceBlockId = event.dataTransfer.getData('text/block-id')
              if (sourceBlockId && sourceBlockId !== id) {
                onDropMoveBlock(sourceBlockId, id)
              }
            }}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => onSelectBlock(id)}
            >
              <p className="text-xs uppercase text-muted-foreground">{block.type}</p>
              <p className="text-sm font-medium">{block.title || 'Untitled block'}</p>
            </button>
            <div className="mt-2 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => onReorderBlock(id, 'up')}
              >
                Up
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={index === blocks.length - 1}
                onClick={() => onReorderBlock(id, 'down')}
              >
                Down
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDeleteBlock(id)}>
                Delete
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
