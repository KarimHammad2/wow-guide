import Link from 'next/link'
import type { CSSProperties, DragEvent } from 'react'
import { ArrowDown, ArrowUp, Copy, ExternalLink, GripVertical, Trash2 } from 'lucide-react'
import { FAQAccordion } from '@/components/guide/faq-accordion'
import { ImageCard } from '@/components/guide/image-card'
import { InfoCard } from '@/components/guide/info-card'
import { InstructionStepper } from '@/components/guide/instruction-stepper'
import { ManualCard } from '@/components/guide/manual-card'
import { normalizeSafeEmbedUrl, normalizeSafeNavigationTarget } from '@/lib/url-safety'
import { cn } from '@/lib/utils'
import type { ContentSection } from '@/lib/data'

interface GuideBlockRendererProps {
  sections: ContentSection[]
  editable?: boolean
  activeBlockId?: string | null
  onSelectBlock?: (blockId: string) => void
  onInlinePatch?: (blockId: string, patch: Partial<ContentSection>) => void
  onMoveBlock?: (blockId: string, direction: 'up' | 'down') => void
  onDeleteBlock?: (blockId: string) => void
  onDuplicateBlock?: (blockId: string) => void
  onDragStartBlock?: (blockId: string, event: DragEvent<HTMLDivElement>) => void
  onResizeBlock?: (blockId: string, next: { width: number; height: number }) => void
  onDropBlockOnBlock?: (sourceBlockId: string, targetBlockId: string) => void
}

interface SectionRowGroup {
  rowId: string | null
  sections: ContentSection[]
}

function groupSectionsByRow(sections: ContentSection[]): SectionRowGroup[] {
  const groups: SectionRowGroup[] = []
  for (const section of sections) {
    const rowId = section.rowId ?? null
    const last = groups[groups.length - 1]
    if (last && last.rowId && rowId && last.rowId === rowId) {
      last.sections.push(section)
      continue
    }
    groups.push({ rowId, sections: [section] })
  }
  return groups
}

function renderSchedule(title: string | undefined, items: NonNullable<ContentSection['items']>) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5">
      {title && <h3 className="font-semibold text-lg mb-4 text-foreground">{title}</h3>}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-1.5 rounded-xl bg-secondary/70 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <span className="min-w-0 font-medium text-foreground">{item.title}</span>
            <span className="min-w-0 text-sm text-muted-foreground sm:shrink-0 sm:text-right">{item.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GuideBlockRenderer({
  sections,
  editable = false,
  activeBlockId = null,
  onSelectBlock,
  onInlinePatch,
  onMoveBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onDragStartBlock,
  onResizeBlock,
  onDropBlockOnBlock,
}: GuideBlockRendererProps) {
  const groups = groupSectionsByRow(sections)
  return (
    <div className="space-y-6">
      {groups.map((group, groupIndex) => {
        const isRow = Boolean(group.rowId) && group.sections.length > 1
        const rowKey = group.rowId ?? `row-${groupIndex}`
        return (
          <div
            key={rowKey}
            className={isRow ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-2' : 'space-y-0'}
          >
            {group.sections.map((section) => {
        const key = section.blockId ?? section.id
        const safeVideoUrl = normalizeSafeEmbedUrl(section.videoUrl)
        const isActive = editable && activeBlockId === key
        const renderInlineText = isActive && section.type === 'text'
        const renderInlineList = isActive && section.type === 'list'
        const renderInlineButton = isActive && section.type === 'button'
        const style: CSSProperties = {
          color: section.textColor,
          backgroundColor: section.backgroundColor,
          fontSize: section.fontSize ? `${section.fontSize}px` : undefined,
          fontFamily: section.fontFamily,
          width: section.blockWidth ? `${section.blockWidth}px` : undefined,
          minHeight: section.blockHeight ? `${section.blockHeight}px` : undefined,
        }

        const wrapEditable = (content: React.ReactNode) => {
          if (!editable) return content
          return (
            <div
              key={key}
              className={cn(
                'group relative rounded-2xl border border-transparent transition',
                isActive ? 'border-primary/60 shadow-sm' : 'hover:border-primary/30'
              )}
              draggable
              onDragStart={(event) => onDragStartBlock?.(key, event)}
              onDragOver={(event) => {
                if (!editable) return
                event.preventDefault()
              }}
              onDrop={(event) => {
                if (!editable) return
                event.preventDefault()
                event.stopPropagation()
                const sourceBlockId = event.dataTransfer.getData('text/guide-block-id')
                if (!sourceBlockId || sourceBlockId === key) return
                onDropBlockOnBlock?.(sourceBlockId, key)
              }}
              onClick={() => onSelectBlock?.(key)}
              style={style}
            >
              <div className="absolute right-2 top-2 z-20 hidden items-center gap-1 rounded-md border border-border bg-background/95 p-1 shadow-sm group-hover:flex">
                <button
                  type="button"
                  className="rounded px-1 py-0.5 text-muted-foreground hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation()
                    onMoveBlock?.(key, 'up')
                  }}
                  title="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded px-1 py-0.5 text-muted-foreground hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation()
                    onMoveBlock?.(key, 'down')
                  }}
                  title="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded px-1 py-0.5 text-muted-foreground hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDuplicateBlock?.(key)
                  }}
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded px-1 py-0.5 text-destructive hover:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDeleteBlock?.(key)
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <span className="pl-1 text-muted-foreground" title="Drag to reorder">
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
              </div>
              {isActive && onResizeBlock ? (
                <div
                  className="absolute bottom-1 right-1 z-20 h-4 w-4 cursor-se-resize rounded-sm border border-border bg-background/90"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    const startX = event.clientX
                    const startY = event.clientY
                    const startWidth = section.blockWidth ?? 520
                    const startHeight = section.blockHeight ?? 140
                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const nextWidth = Math.max(120, Math.round(startWidth + (moveEvent.clientX - startX)))
                      const nextHeight = Math.max(60, Math.round(startHeight + (moveEvent.clientY - startY)))
                      onResizeBlock(key, { width: nextWidth, height: nextHeight })
                    }
                    const onMouseUp = () => {
                      window.removeEventListener('mousemove', onMouseMove)
                      window.removeEventListener('mouseup', onMouseUp)
                    }
                    window.addEventListener('mousemove', onMouseMove)
                    window.addEventListener('mouseup', onMouseUp)
                  }}
                />
              ) : null}
              {content}
            </div>
          )
        }

        switch (section.type) {
          case 'hero':
            return wrapEditable(
              <section key={key} className="rounded-3xl border border-primary/20 bg-linear-to-br from-primary/15 to-transparent p-6 md:p-8">
                {section.title && <h2 className="text-2xl md:text-3xl font-bold mb-3">{section.title}</h2>}
                {section.content && <p className="text-muted-foreground leading-relaxed">{section.content}</p>}
              </section>
            )
          case 'text':
            return wrapEditable(
              <section key={key} className="rounded-2xl border border-border bg-card p-5">
                {renderInlineText ? (
                  <input
                    value={section.title ?? ''}
                    onChange={(event) => onInlinePatch?.(key, { title: event.target.value })}
                    className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 font-semibold"
                  />
                ) : (
                  section.title && <h3 className="font-semibold text-lg mb-3">{section.title}</h3>
                )}
                {renderInlineText ? (
                  <textarea
                    value={section.content ?? ''}
                    onChange={(event) => onInlinePatch?.(key, { content: event.target.value })}
                    rows={4}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-muted-foreground"
                  />
                ) : (
                  <p className="text-muted-foreground leading-relaxed">
                    {section.textLinkUrl ? (
                      <Link
                        href={normalizeSafeNavigationTarget(section.textLinkUrl)}
                        className="underline underline-offset-4 hover:text-foreground"
                      >
                        {section.content}
                      </Link>
                    ) : (
                      section.content
                    )}
                  </p>
                )}
              </section>
            )
          case 'card':
            return wrapEditable(
              <InfoCard
                key={key}
                title={section.title}
                content={section.content}
                items={section.items}
                variant={section.styleVariant === 'highlighted' ? 'highlighted' : 'default'}
              />
            )
          case 'steps':
          case 'checklist':
          case 'list':
            if (renderInlineList) {
              return wrapEditable(
                <section key={key} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <input
                    value={section.title ?? ''}
                    onChange={(event) => onInlinePatch?.(key, { title: event.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 font-semibold"
                  />
                  <textarea
                    rows={6}
                    value={(section.items ?? []).map((item) => item.title).join('\n')}
                    onChange={(event) =>
                      onInlinePatch?.(key, {
                        items: event.target.value
                          .split('\n')
                          .map((line, index) => ({ id: `${key}-item-${index + 1}`, title: line.trim() }))
                          .filter((item) => item.title),
                      })
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-muted-foreground"
                  />
                </section>
              )
            }
            return wrapEditable(
              <InstructionStepper key={key} title={section.title} steps={section.items ?? []} />
            )
          case 'accordion':
            return wrapEditable(<FAQAccordion key={key} title={section.title} items={section.items ?? []} />)
          case 'image':
          case 'media':
            return wrapEditable(
              <ImageCard
                key={key}
                src={section.mediaUrl ?? section.items?.[0]?.image}
                alt={section.title ?? 'Section media'}
                caption={section.caption ?? section.content}
              />
            )
          case 'video':
            return wrapEditable(
              <section key={key} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                {section.title && <h3 className="font-semibold text-lg">{section.title}</h3>}
                {safeVideoUrl ? (
                  <div className="aspect-video overflow-hidden rounded-xl">
                    <iframe
                      src={safeVideoUrl}
                      title={section.title ?? 'Video guide'}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Add a video URL from admin.</p>
                )}
              </section>
            )
          case 'links':
            return wrapEditable(
              <section key={key} className="rounded-2xl border border-border bg-card p-5">
                {section.title && <h3 className="font-semibold text-lg mb-3">{section.title}</h3>}
                <div className="space-y-2">
                  {(section.items ?? []).map((item) => (
                    <Link
                      key={item.id}
                      href={normalizeSafeNavigationTarget(item.link)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 hover:border-primary/40 transition-colors min-h-11"
                    >
                      <span className="min-w-0 wrap-break-word text-left">{item.title}</span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            )
          case 'button':
            return wrapEditable(
              <section key={key} className="rounded-2xl border border-border bg-card p-5">
                {renderInlineButton ? (
                  <input
                    value={section.title ?? ''}
                    onChange={(event) => onInlinePatch?.(key, { title: event.target.value })}
                    className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 font-semibold"
                  />
                ) : (
                  section.title && <h3 className="font-semibold text-lg mb-3">{section.title}</h3>
                )}
                <Link
                  href={normalizeSafeNavigationTarget(section.buttonUrl)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {renderInlineButton ? (
                    <input
                      value={section.content ?? ''}
                      onChange={(event) => onInlinePatch?.(key, { content: event.target.value })}
                      className="w-full max-w-56 rounded border border-primary-foreground/20 bg-primary px-2 py-1 text-center text-primary-foreground"
                    />
                  ) : (
                    section.content?.trim() || 'Open'
                  )}
                </Link>
              </section>
            )
          case 'contact':
            return wrapEditable(
              <section key={key} className="rounded-2xl border border-border bg-card p-5">
                {section.title && <h3 className="font-semibold text-lg mb-2">{section.title}</h3>}
                <p className="text-muted-foreground">{section.content}</p>
              </section>
            )
          case 'tabs':
            return wrapEditable(
              <section key={key} className="rounded-2xl border border-border bg-card p-5">
                {section.title && <h3 className="font-semibold text-lg mb-4">{section.title}</h3>}
                <div className="space-y-3">
                  {(section.items ?? []).map((item) => (
                    <div key={item.id} className="rounded-xl bg-secondary/70 p-3">
                      <p className="font-medium">{item.title}</p>
                      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )
          case 'manual':
            return wrapEditable(
              <ManualCard
                key={key}
                title={section.title ?? 'Manual'}
                description={section.content}
                fileType={section.videoUrl ? 'video' : 'pdf'}
                fileUrl={normalizeSafeNavigationTarget(section.videoUrl ?? section.mediaUrl)}
              />
            )
          case 'schedule':
            return wrapEditable(renderSchedule(section.title, section.items ?? []))
          default:
            return wrapEditable(
              <section key={key} className={cn('rounded-2xl border border-border bg-card p-5')}>
                {section.title && <h3 className="font-semibold text-lg mb-3">{section.title}</h3>}
                {section.content && <p className="text-muted-foreground">{section.content}</p>}
              </section>
            )
        }
            })}
          </div>
        )
      })}
    </div>
  )
}
