'use client'

import { Plus, Trash2 } from 'lucide-react'
import { RichTextBlockEditor } from '@/components/editor/rich-text-block-editor'
import { Button } from '@/components/ui/button'
import { EMPTY_RICH_TEXT_DOC } from '@/lib/tiptap/empty-doc'
import type { VisualListEditorRow } from '@/lib/visual-builder-schema'

export type ListBlockItemRow = VisualListEditorRow

function newRowId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `item-${crypto.randomUUID()}`
  }
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

interface ListBlockItemsFieldProps {
  items: ListBlockItemRow[]
  onChange: (items: ListBlockItemRow[]) => void
}

export function ListBlockItemsField({ items, onChange }: ListBlockItemsFieldProps) {
  function updateRow(index: number, patch: Partial<ListBlockItemRow>) {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeRow(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Type normally. Select words and use{' '}
        <span className="font-medium text-foreground">Link</span> or <span className="font-medium text-foreground">Icon</span>{' '}
        to add a web address or inline icon—no special code.
      </p>
      {items.map((row, index) => (
        <div key={row.id} className="space-y-2 rounded-lg border border-border bg-muted/20 p-2.5">
          <div className="flex items-start gap-2">
            <RichTextBlockEditor
              toolbar="essential"
              className="min-w-0 flex-1 text-sm"
              value={row.richText}
              plainFallback={row.title}
              editorScrollMaxClassName="max-h-[min(42vh,280px)]"
              immediatelyRender={false}
              onChange={(json, plain) => updateRow(index, { richText: json, title: plain })}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              title="Remove item"
              aria-label="Remove item"
              onClick={() => removeRow(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full gap-1.5"
        onClick={() => onChange([...items, { id: newRowId(), title: '', richText: EMPTY_RICH_TEXT_DOC }])}
      >
        <Plus className="h-3.5 w-3.5" />
        Add item
      </Button>
    </div>
  )
}
