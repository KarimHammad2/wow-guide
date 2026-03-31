import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ContentSection } from '@/lib/data'
import { LinkField } from '@/components/admin/builder/link-field'
import { MediaEmbedField } from '@/components/admin/builder/media-embed-field'

interface BlockInspectorProps {
  block: ContentSection | null
  onUpdate: (patch: Partial<ContentSection>) => void
}

export function BlockInspector({ block, onUpdate }: BlockInspectorProps) {
  if (!block) {
    return (
      <div className="rounded-2xl border border-border p-4">
        <p className="text-sm text-muted-foreground">Select a block to edit.</p>
      </div>
    )
  }

  const firstItem = block.items?.[0]

  return (
    <div className="rounded-2xl border border-border p-4 space-y-3">
      <p className="text-sm font-semibold">Block Inspector</p>
      <Input
        value={block.title ?? ''}
        placeholder="Block title"
        onChange={(event) => onUpdate({ title: event.target.value })}
      />
      <Textarea
        value={block.content ?? ''}
        rows={4}
        placeholder="Block content"
        onChange={(event) => onUpdate({ content: event.target.value })}
      />

      {(block.type === 'media' || block.type === 'image') && (
        <MediaEmbedField
          label="Image URL"
          value={block.mediaUrl}
          onChange={(value) => onUpdate({ mediaUrl: value })}
          placeholder="https://.../image.jpg"
        />
      )}

      {block.type === 'video' && (
        <MediaEmbedField
          label="Video URL"
          value={block.videoUrl}
          onChange={(value) => onUpdate({ videoUrl: value })}
          placeholder="https://youtube.com/..."
        />
      )}

      {(block.type === 'links' || block.type === 'manual') && (
        <LinkField
          value={firstItem?.link}
          onChange={(value) =>
            onUpdate({
              items: [{ id: firstItem?.id ?? 'link-1', title: firstItem?.title ?? 'Open link', link: value }],
            })
          }
        />
      )}
    </div>
  )
}
