import Link from 'next/link'
import { cloneElement, isValidElement, type CSSProperties, type DragEvent } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  GripVertical,
  Trash2,
} from 'lucide-react'
import { FAQAccordion } from '@/components/guide/faq-accordion'
import { CatalogBand } from '@/components/guide/catalog-band'
import { ImageCard } from '@/components/guide/image-card'
import { InfoCard } from '@/components/guide/info-card'
import { InstructionStepper } from '@/components/guide/instruction-stepper'
import { ManualCard } from '@/components/guide/manual-card'
import { ListBlockItemsField } from '@/components/admin/builder/list-block-items-field'
import { ContentItemBody } from '@/components/guide/content-item-body'
import { RichTextBlockEditor } from '@/components/editor/rich-text-block-editor'
import { richTextJsonToSafeHtml } from '@/lib/tiptap/rich-text-html'
import { isSafeNavigationTarget, normalizeSafeNavigationTarget } from '@/lib/url-safety'
import { safeVideoIframeSrc } from '@/lib/video-iframe-src'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ContentSection } from '@/lib/data'
import { getRowTemplate, groupSectionsByRow } from '@/lib/visual-row-groups'

function getReadableTextColor(hexColor: string) {
  const normalized = hexColor.trim().replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(normalized) && !/^[0-9a-f]{3}$/i.test(normalized)) return '#ffffff'
  const expanded =
    normalized.length === 3 ? normalized.split('').map((char) => `${char}${char}`).join('') : normalized
  const value = Number.parseInt(expanded, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  const luminance = (r * 299 + g * 587 + b * 114) / 1000
  return luminance >= 160 ? '#111827' : '#ffffff'
}

function sectionSupportsInBlockSideImage(section: ContentSection): boolean {
  return (
    section.type === 'text' ||
    section.type === 'list' ||
    section.type === 'steps' ||
    section.type === 'checklist'
  )
}

function BlockInCardSideImage({
  url,
  alt,
  fit = 'auto',
}: {
  url: string
  alt: string
  fit?: 'auto' | 'contain' | 'cover'
}) {
  void fit
  return (
    <div className="w-full shrink-0 sm:max-w-[40%] sm:basis-[40%]">
      {/* Side images should render at their natural aspect ratio with no crop or zoom. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- uploads are already served unoptimized */}
      <img src={url} alt={alt} className="block h-auto w-full rounded-xl" />
    </div>
  )
}

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
  onUploadMedia?: (blockId: string, file: File, options?: { side?: 'left' | 'right' }) => void
  onRemoveBlockSideImage?: (blockId: string) => void | Promise<void>
  onResizeBlock?: (blockId: string, next: { width: number; height: number }) => void
  onDropBlockOnBlock?: (
    sourceBlockId: string,
    targetBlockId: string,
    options?: { side?: 'left' | 'right' }
  ) => void
}

/** Grid row cells only. Single-column horizontal align uses a flex wrapper (see wrapEditable). */
function blockAlignCss(
  blockAlign: ContentSection['blockAlign'],
  opts: { isRow: boolean }
): Pick<CSSProperties, 'justifySelf'> {
  if (!opts.isRow || !blockAlign) return {}
  const justifySelf: CSSProperties['justifySelf'] =
    blockAlign === 'center' ? 'center' : blockAlign === 'right' ? 'end' : 'start'
  return { justifySelf }
}

function blockVerticalAlignClass(blockVerticalAlign: ContentSection['blockVerticalAlign']) {
  if (!blockVerticalAlign || blockVerticalAlign === 'top') return ''
  return blockVerticalAlign === 'center' ? 'flex h-full flex-col justify-center' : 'flex h-full flex-col justify-end'
}

function hasCustomTextColor(section: ContentSection): boolean {
  return Boolean(section.textColor?.trim())
}

function hasCustomBackground(section: ContentSection): boolean {
  return Boolean(section.backgroundColor?.trim())
}

function blockCardSurfaceClass(section: ContentSection): string {
  return hasCustomBackground(section) ? 'bg-transparent' : 'bg-card'
}

function renderSchedule(
  title: string | undefined,
  items: NonNullable<ContentSection['items']>,
  section: ContentSection
) {
  const customText = hasCustomTextColor(section)
  const customBg = hasCustomBackground(section)
  return (
    <div
      className={cn('rounded-2xl border border-border p-4 sm:p-5', customBg ? 'bg-transparent' : 'bg-card')}
    >
      {title && (
        <h3
          className={cn(
            'font-semibold text-lg mb-4',
            customText ? 'text-inherit' : 'text-foreground'
          )}
        >
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-1.5 rounded-xl bg-secondary/70 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div
              className={cn('min-w-0 font-medium', customText ? 'text-inherit' : 'text-foreground')}
            >
              <ContentItemBody item={item} tone={customText ? 'inherit' : 'default'} />
            </div>
            <span
              className={cn(
                'min-w-0 sm:shrink-0 sm:text-right',
                customText ? 'text-sm text-inherit opacity-90' : 'text-sm text-muted-foreground'
              )}
            >
              {item.description}
            </span>
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
  onUploadMedia,
  onRemoveBlockSideImage,
  onResizeBlock,
  onDropBlockOnBlock,
}: GuideBlockRendererProps) {
  const groups = groupSectionsByRow(sections)
  return (
    <div className="space-y-4 md:space-y-6">
      {groups.map((group, groupIndex) => {
        const isRow = Boolean(group.rowId) && group.sections.length > 1
        const rowKey = group.rowId ?? `row-${groupIndex}`
        const rowTemplate = isRow ? getRowTemplate(group.sections) : null
        return (
          <div
            key={rowKey}
            className={
              isRow ? 'grid grid-cols-1 items-stretch gap-4 md:grid-cols-(--row-template)' : 'space-y-0'
            }
            style={
              isRow && rowTemplate
                ? ({ '--row-template': rowTemplate } as CSSProperties)
                : undefined
            }
          >
            {group.sections.map((section) => {
              const transparentSurfaceClass = hasCustomBackground(section) ? 'bg-transparent' : undefined
              const key = section.blockId ?? section.id
              const videoIframeSrc =
                section.type === 'video' ? safeVideoIframeSrc(section.videoUrl) : null
              const isActive = editable && activeBlockId === key
              const renderInlineText = isActive && section.type === 'text'
              const renderInlineList = isActive && section.type === 'list'
              const renderInlineButton = isActive && section.type === 'button'
              const isVideoBlock = section.type === 'video'
              const hasFrameHeight =
                section.blockHeight != null && Number.isFinite(section.blockHeight) && section.blockHeight > 0
              const isImageOrMedia = section.type === 'image' || section.type === 'media'
              /** Image scales inside the frame; scrollbars would only crop UX without adding value. */
              const frameLocksImage = isImageOrMedia && hasFrameHeight
              const style: CSSProperties & { [key: `--${string}`]: string | undefined } = {
                color: section.textColor,
                backgroundColor: section.backgroundColor,
                fontSize: section.fontSize ? `${section.fontSize}px` : undefined,
                fontFamily: section.fontFamily,
                ...(hasFrameHeight
                  ? isVideoBlock
                    ? {
                        boxSizing: 'border-box' as const,
                        '--video-block-height': `${section.blockHeight}px`,
                      }
                    : frameLocksImage
                    ? {
                        height: `${section.blockHeight}px`,
                        overflow: 'hidden',
                        boxSizing: 'border-box' as const,
                      }
                    : {
                        minHeight: `${section.blockHeight}px`,
                        boxSizing: 'border-box' as const,
                      }
                  : {}),
                ...(section.blockWidth && !isRow
                  ? {
                      '--block-width': `${section.blockWidth}px`,
                    }
                  : {}),
                minWidth: isRow ? 0 : undefined,
                marginTop:
                  section.blockMarginTop != null && section.blockMarginTop > 0
                    ? `${section.blockMarginTop}px`
                    : undefined,
                marginBottom:
                  section.blockMarginBottom != null && section.blockMarginBottom > 0
                    ? `${section.blockMarginBottom}px`
                    : undefined,
                ...blockAlignCss(section.blockAlign, { isRow }),
              }

              const widthClass = !isRow && section.blockWidth ? 'w-full md:w-[var(--block-width)]' : 'w-full'

                const rowStretchClass = isRow ? 'flex h-full min-h-0 flex-col' : ''

                const wrapEditable = (content: React.ReactNode) => {
                if (!editable) {
                  const guestBlock = (
                    <div
                      style={style}
                      className={cn(
                        'min-w-0',
                        widthClass,
                        isRow && rowStretchClass,
                        hasFrameHeight && 'min-h-0',
                        frameLocksImage && 'flex min-h-0 flex-col overflow-hidden'
                      )}
                    >
                      {content}
                    </div>
                  )
                  if (isRow) {
                    return isValidElement(guestBlock) ? cloneElement(guestBlock, { key }) : guestBlock
                  }
                  if (section.blockAlign === 'center') {
                    return (
                      <div key={key} className="flex w-full min-w-0 justify-center">
                        {guestBlock}
                      </div>
                    )
                  }
                  if (section.blockAlign === 'right') {
                    return (
                      <div key={key} className="flex w-full min-w-0 justify-end">
                        {guestBlock}
                      </div>
                    )
                  }
                  return isValidElement(guestBlock) ? cloneElement(guestBlock, { key }) : guestBlock
                }

                const editorBlock = (
                  <div
                    data-editor-block-id={key}
                    className={cn(
                      'group relative rounded-2xl border border-transparent transition',
                      widthClass,
                      isRow && rowStretchClass,
                      hasFrameHeight && 'min-h-0',
                      frameLocksImage && 'flex min-h-0 flex-col overflow-hidden',
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
                      const file = event.dataTransfer.files?.[0]
                      if (file) {
                        if (
                          sectionSupportsInBlockSideImage(section) &&
                          event.currentTarget instanceof HTMLElement
                        ) {
                          const r = event.currentTarget.getBoundingClientRect()
                          const side = event.clientX < r.left + r.width / 2 ? 'left' : 'right'
                          onUploadMedia?.(key, file, { side })
                        } else {
                          onUploadMedia?.(key, file)
                        }
                        return
                      }
                      const sourceBlockId = event.dataTransfer.getData('text/guide-block-id')
                      if (!sourceBlockId || sourceBlockId === key) return
                      const sourceSection = sections.find(
                        (s) => (s.blockId ?? s.id) === sourceBlockId
                      )
                      const sourceIsImage =
                        sourceSection?.type === 'image' || sourceSection?.type === 'media'
                      const canMergeInBlockImage =
                        sourceIsImage &&
                        sectionSupportsInBlockSideImage(section) &&
                        (section.type === 'text' || section.type === 'list' || section.type === 'steps' || section.type === 'checklist')
                      if (canMergeInBlockImage && event.currentTarget instanceof HTMLElement) {
                        const r = event.currentTarget.getBoundingClientRect()
                        const side = event.clientX < r.left + r.width / 2 ? 'left' : 'right'
                        onDropBlockOnBlock?.(sourceBlockId, key, { side })
                        return
                      }
                      onDropBlockOnBlock?.(sourceBlockId, key)
                    }}
                    onClick={() => onSelectBlock?.(key)}
                    style={style}
                  >
                    <div className="absolute right-2 top-2 z-20 hidden max-w-[min(100%,18rem)] flex-wrap items-center justify-end gap-1 rounded-md border border-border bg-background/95 p-1 shadow-sm group-hover:flex">
                      <button
                        type="button"
                        className={cn(
                          'rounded px-1 py-0.5 hover:text-foreground',
                          (section.blockAlign ?? 'left') === 'left' ? 'text-foreground' : 'text-muted-foreground'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          onInlinePatch?.(key, { blockAlign: 'left' })
                        }}
                        title="Align left"
                      >
                        <AlignLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={cn(
                          'rounded px-1 py-0.5 hover:text-foreground',
                          section.blockAlign === 'center' ? 'text-foreground' : 'text-muted-foreground'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          onInlinePatch?.(key, { blockAlign: 'center' })
                        }}
                        title="Align center"
                      >
                        <AlignCenter className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={cn(
                          'rounded px-1 py-0.5 hover:text-foreground',
                          section.blockAlign === 'right' ? 'text-foreground' : 'text-muted-foreground'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          onInlinePatch?.(key, { blockAlign: 'right' })
                        }}
                        title="Align right"
                      >
                        <AlignRight className="h-3.5 w-3.5" />
                      </button>
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

                if (isRow) {
                  return isValidElement(editorBlock)
                    ? cloneElement(editorBlock, { key })
                    : editorBlock
                }

                if (section.blockAlign === 'center') {
                  return (
                    <div key={key} className="flex w-full min-w-0 justify-center">
                      {editorBlock}
                    </div>
                  )
                }
                if (section.blockAlign === 'right') {
                  return (
                    <div key={key} className="flex w-full min-w-0 justify-end">
                      {editorBlock}
                    </div>
                  )
                }

                return isValidElement(editorBlock) ? cloneElement(editorBlock, { key }) : editorBlock
              }

              switch (section.type) {
          case 'catalogBand':
            return wrapEditable(
              <CatalogBand
                key={key}
                title={section.title}
                items={section.items}
                backgroundColor={section.backgroundColor}
                textColor={section.textColor}
              />
            )
          case 'hero':
            return wrapEditable(
              <section key={key} className="rounded-3xl border border-primary/20 bg-linear-to-br from-primary/15 to-transparent p-6 md:p-8">
                {section.title && <h2 className="text-2xl md:text-3xl font-bold mb-3">{section.title}</h2>}
                {section.content && (
                  <p
                    className={cn(
                      'leading-relaxed',
                      hasCustomTextColor(section) ? 'text-inherit' : 'text-muted-foreground'
                    )}
                  >
                    {section.content}
                  </p>
                )}
              </section>
            )
          case 'text': {
            const sideUrl = section.blockMediaUrl?.trim()
            const hasSide = Boolean(sideUrl)
            const pos = section.blockMediaPosition === 'left' ? 'left' : 'right'
            const sideImageFit = section.blockMediaFit ?? 'auto'
            const showSideImageChrome =
              Boolean(editable && isActive && hasSide && onInlinePatch && onRemoveBlockSideImage)
            const customText = hasCustomTextColor(section)
            const textContent = (
              <>
                {showSideImageChrome ? (
                  <div
                    className="mb-3 flex flex-wrap gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="rounded-md border border-border bg-background/95 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={(event) => {
                        event.stopPropagation()
                        onInlinePatch?.(key, { blockMediaPosition: pos === 'left' ? 'right' : 'left' })
                      }}
                    >
                      Swap side
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-border bg-background/95 px-2.5 py-1 text-xs text-destructive hover:text-destructive"
                      onClick={(event) => {
                        event.stopPropagation()
                        void onRemoveBlockSideImage?.(key)
                      }}
                    >
                      Remove image
                    </button>
                  </div>
                ) : null}
                {renderInlineText ? (
                  <input
                    value={section.title ?? ''}
                    onChange={(event) => onInlinePatch?.(key, { title: event.target.value })}
                    className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 font-semibold"
                  />
                ) : (
                  section.title && (
                    <h3
                      className={cn('font-semibold text-lg mb-3', customText && 'text-inherit')}
                    >
                      {section.title}
                    </h3>
                  )
                )}
                {renderInlineText ? (
                  <RichTextBlockEditor
                    value={section.richText}
                    plainFallback={section.content ?? ''}
                    onChange={(json, plain) =>
                      onInlinePatch?.(key, { richText: json, content: plain })
                    }
                  />
                ) : (
                  (() => {
                    const richHtml = richTextJsonToSafeHtml(section.richText)
                    if (richHtml) {
                      return (
                        <div
                          className={cn(
                            'rich-text-html leading-relaxed',
                            customText
                              ? 'text-inherit [&_a]:text-inherit [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:opacity-90'
                              : 'text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-foreground',
                            isRow && 'min-h-0 flex-1 overflow-y-auto'
                          )}
                          dangerouslySetInnerHTML={{ __html: richHtml }}
                        />
                      )
                    }
                    return (
                      <p
                        className={cn(
                          'leading-relaxed',
                          customText ? 'text-inherit' : 'text-muted-foreground',
                          isRow && 'min-h-0 flex-1 overflow-y-auto'
                        )}
                      >
                        {section.textLinkUrl ? (
                          <Link
                            href={normalizeSafeNavigationTarget(section.textLinkUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'underline underline-offset-4',
                              customText ? 'text-inherit opacity-90 hover:opacity-100' : 'hover:text-foreground'
                            )}
                          >
                            {section.content}
                          </Link>
                        ) : (
                          section.content
                        )}
                      </p>
                    )
                  })()
                )}
              </>
            )
            const textBody = hasSide && sideUrl ? (
              <div
                className={cn(
                  'flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-4',
                  section.blockVerticalAlign && 'min-h-0'
                )}
              >
                {pos === 'left' ? (
                  <BlockInCardSideImage url={sideUrl} alt={section.title ?? 'Block image'} fit={sideImageFit} />
                ) : null}
                <div className={cn('min-w-0 flex-1', blockVerticalAlignClass(section.blockVerticalAlign))}>
                  {textContent}
                </div>
                {pos === 'right' ? (
                  <BlockInCardSideImage url={sideUrl} alt={section.title ?? 'Block image'} fit={sideImageFit} />
                ) : null}
              </div>
            ) : (
              <div className={cn('min-w-0 flex-1', blockVerticalAlignClass(section.blockVerticalAlign))}>
                {textContent}
              </div>
            )
            return wrapEditable(
              <section
                key={key}
                className={cn(
                  'rounded-2xl border border-border p-5',
                  blockCardSurfaceClass(section),
                  section.blockVerticalAlign && 'flex h-full min-h-0 flex-col',
                  isRow && 'flex h-full min-h-0 flex-col'
                )}
              >
                {textBody}
              </section>
            )
          }
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
              const sideUrl = section.blockMediaUrl?.trim()
              const hasSide = Boolean(sideUrl)
              const pos = section.blockMediaPosition === 'left' ? 'left' : 'right'
              const sideImageFit = section.blockMediaFit ?? 'auto'
              const showSideImageChrome =
                Boolean(editable && isActive && hasSide && onInlinePatch && onRemoveBlockSideImage)
              const listEditorMain = (
                <div className={cn('min-w-0 space-y-3')}>
                  {showSideImageChrome ? (
                    <div
                      className="flex flex-wrap gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="rounded-md border border-border bg-background/95 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={(event) => {
                          event.stopPropagation()
                          onInlinePatch?.(key, { blockMediaPosition: pos === 'left' ? 'right' : 'left' })
                        }}
                      >
                        Swap side
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-border bg-background/95 px-2.5 py-1 text-xs text-destructive hover:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation()
                          void onRemoveBlockSideImage?.(key)
                        }}
                      >
                        Remove image
                      </button>
                    </div>
                  ) : null}
                  <input
                    value={section.title ?? ''}
                    onChange={(event) => onInlinePatch?.(key, { title: event.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 font-semibold"
                  />
                  <div className={cn(isRow && 'min-h-0 flex-1 overflow-y-auto')}>
                    <ListBlockItemsField
                      items={(section.items ?? []).map((item) => ({
                        id: item.id,
                        title: item.title,
                        richText: item.richText,
                      }))}
                      onChange={(rows) =>
                        onInlinePatch?.(key, {
                          items: rows.map((row) => ({
                            id: row.id,
                            title: row.title.trim(),
                            ...(row.richText !== undefined && row.richText !== null
                              ? { richText: row.richText }
                              : {}),
                          })),
                        })
                      }
                    />
                  </div>
                </div>
              )
              const listLayout =
                hasSide && sideUrl ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-4">
                    {pos === 'left' ? (
                      <BlockInCardSideImage
                        url={sideUrl}
                        alt={section.title ?? 'List image'}
                        fit={sideImageFit}
                      />
                    ) : null}
                    <div className={cn('min-w-0 flex-1', blockVerticalAlignClass(section.blockVerticalAlign))}>
                      {listEditorMain}
                    </div>
                    {pos === 'right' ? (
                      <BlockInCardSideImage
                        url={sideUrl}
                        alt={section.title ?? 'List image'}
                        fit={sideImageFit}
                      />
                    ) : null}
                  </div>
                ) : (
                  <div className={cn('min-w-0 flex-1', blockVerticalAlignClass(section.blockVerticalAlign))}>
                    {listEditorMain}
                  </div>
                )
              return wrapEditable(
                <section
                  key={key}
                  className={cn(
                    'rounded-2xl border border-border p-5',
                    blockCardSurfaceClass(section),
                    section.blockVerticalAlign && 'flex h-full min-h-0 flex-col',
                    isRow && 'flex h-full min-h-0 flex-col',
                    !hasSide && 'space-y-3'
                  )}
                >
                  {listLayout}
                </section>
              )
            }
            {
              const sideUrl = section.blockMediaUrl?.trim()
              const hasSide = Boolean(sideUrl)
              const pos = section.blockMediaPosition === 'left' ? 'left' : 'right'
              const sideImageFit = section.blockMediaFit ?? 'auto'
              const showSideImageChrome =
                Boolean(editable && isActive && hasSide && onInlinePatch && onRemoveBlockSideImage)
              if (hasSide && sideUrl) {
                return wrapEditable(
                  <section
                    key={key}
                    className={cn(
                      'rounded-2xl border border-border p-5',
                      blockCardSurfaceClass(section),
                      section.blockVerticalAlign && 'flex h-full min-h-0 flex-col',
                      isRow && 'flex h-full min-h-0 flex-col'
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-4">
                      {pos === 'left' ? (
                        <BlockInCardSideImage
                          url={sideUrl}
                          alt={section.title ?? 'List image'}
                          fit={sideImageFit}
                        />
                      ) : null}
                    <div className={cn('min-w-0 flex-1', blockVerticalAlignClass(section.blockVerticalAlign))}>
                        {showSideImageChrome ? (
                          <div
                            className="mb-3 flex flex-wrap gap-2"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="rounded-md border border-border bg-background/95 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                              onClick={(event) => {
                                event.stopPropagation()
                                onInlinePatch?.(key, { blockMediaPosition: pos === 'left' ? 'right' : 'left' })
                              }}
                            >
                              Swap side
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-border bg-background/95 px-2.5 py-1 text-xs text-destructive hover:text-destructive"
                              onClick={(event) => {
                                event.stopPropagation()
                                void onRemoveBlockSideImage?.(key)
                              }}
                            >
                              Remove image
                            </button>
                          </div>
                        ) : null}
                        <InstructionStepper
                          className="border-0 p-0 shadow-none"
                          transparentCard
                          title={section.title}
                          steps={section.items ?? []}
                          fillRowHeight={isRow}
                          inheritBlockText={hasCustomTextColor(section)}
                          contentItemTone={hasCustomTextColor(section) ? 'inherit' : 'default'}
                        />
                      </div>
                      {pos === 'right' ? (
                        <BlockInCardSideImage
                          url={sideUrl}
                          alt={section.title ?? 'List image'}
                          fit={sideImageFit}
                        />
                      ) : null}
                    </div>
                  </section>
                )
              }
            }
            return wrapEditable(
              <div className={cn('min-w-0 flex-1', blockVerticalAlignClass(section.blockVerticalAlign))}>
                <InstructionStepper
                  key={key}
                  title={section.title}
                  steps={section.items ?? []}
                  fillRowHeight={isRow}
                  transparentCard={hasCustomBackground(section)}
                  inheritBlockText={hasCustomTextColor(section)}
                  contentItemTone={hasCustomTextColor(section) ? 'inherit' : 'default'}
                />
              </div>
            )
          case 'accordion':
            return wrapEditable(
              <FAQAccordion
                key={key}
                title={section.title}
                items={section.items ?? []}
                className={transparentSurfaceClass}
                inheritBlockText={hasCustomTextColor(section)}
              />
            )
          case 'image':
          case 'media': {
            const imageSrc = section.mediaUrl ?? section.items?.[0]?.image
            const mediaHref = section.imageLinkUrl && isSafeNavigationTarget(section.imageLinkUrl)
              ? section.imageLinkUrl
              : undefined
            return wrapEditable(
              <ImageCard
                key={key}
                src={imageSrc}
                alt={section.title ?? 'Section media'}
                caption={section.caption ?? section.content}
                href={mediaHref}
                fitEditorFrame={frameLocksImage}
                fitMode={section.mediaFit ?? 'auto'}
                className={transparentSurfaceClass}
              />
            )
          }
          case 'video': {
            const useFixedVideoFrame = hasFrameHeight
            const vCustomText = hasCustomTextColor(section)
            return wrapEditable(
              <section
                key={key}
                className={cn(
                  'rounded-2xl border border-border p-3 sm:p-4',
                  blockCardSurfaceClass(section),
                  useFixedVideoFrame ? 'space-y-3 md:flex md:h-(--video-block-height) md:flex-col md:gap-3' : 'space-y-3'
                )}
              >
                {section.title && (
                  <h3
                    className={cn(
                      'shrink-0 font-semibold text-base sm:text-lg',
                      vCustomText && 'text-inherit'
                    )}
                  >
                    {section.title}
                  </h3>
                )}
                {videoIframeSrc ? (
                  <div
                    className={cn(
                      'overflow-hidden rounded-xl bg-secondary/40',
                      useFixedVideoFrame ? 'aspect-video md:min-h-0 md:flex-1' : 'aspect-video'
                    )}
                  >
                    <iframe
                      src={videoIframeSrc}
                      title={section.title ?? 'Video guide'}
                      className="block h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p
                    className={cn(
                      'text-sm',
                      vCustomText ? 'text-inherit opacity-90' : 'text-muted-foreground'
                    )}
                  >
                    Add a video URL from admin.
                  </p>
                )}
              </section>
            )
          }
          case 'links':
            return wrapEditable(
              <section
                key={key}
                className={cn('rounded-2xl border border-border p-5', blockCardSurfaceClass(section))}
              >
                {section.title && (
                  <h3
                    className={cn(
                      'font-semibold text-lg mb-3',
                      hasCustomTextColor(section) && 'text-inherit'
                    )}
                  >
                    {section.title}
                  </h3>
                )}
                <div className="space-y-2">
                  {(section.items ?? []).map((item) => (
                    <Link
                      key={item.id}
                      href={normalizeSafeNavigationTarget(item.link)}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors min-h-11',
                        hasCustomTextColor(section)
                          ? 'border-border/50 text-inherit hover:opacity-90'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <span className="min-w-0 wrap-break-word text-left">{item.title}</span>
                      <ExternalLink
                        className={cn(
                          'h-4 w-4 shrink-0',
                          hasCustomTextColor(section) ? 'text-inherit opacity-80' : 'text-muted-foreground'
                        )}
                      />
                    </Link>
                  ))}
                </div>
              </section>
            )
          case 'button':
            return wrapEditable(
              <section
                key={key}
                className={cn('rounded-2xl border border-border p-5', blockCardSurfaceClass(section))}
              >
                {renderInlineButton ? (
                  <input
                    value={section.title ?? ''}
                    onChange={(event) => onInlinePatch?.(key, { title: event.target.value })}
                    className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 font-semibold"
                  />
                ) : (
                  section.title && (
                    <h3
                      className={cn(
                        'font-semibold text-lg mb-3',
                        hasCustomTextColor(section) && 'text-inherit'
                      )}
                    >
                      {section.title}
                    </h3>
                  )
                )}
                <Button
                  asChild
                  variant={section.buttonColor ? 'default' : section.buttonVariant ?? 'default'}
                  className="h-11 rounded-xl px-4 py-2.5"
                  style={
                    section.buttonColor
                      ? {
                          backgroundColor: section.buttonColor,
                          color: getReadableTextColor(section.buttonColor),
                        }
                      : undefined
                  }
                >
                  <Link href={normalizeSafeNavigationTarget(section.buttonUrl)}>
                    {renderInlineButton ? (
                      <input
                        value={section.content ?? ''}
                        onChange={(event) => onInlinePatch?.(key, { content: event.target.value })}
                        className="w-full max-w-56 rounded border border-current/20 bg-transparent px-2 py-1 text-center"
                      />
                    ) : (
                      section.content?.trim() || 'Open'
                    )}
                  </Link>
                </Button>
              </section>
            )
          case 'contact':
            return wrapEditable(
              <section
                key={key}
                className={cn('rounded-2xl border border-border p-5', blockCardSurfaceClass(section))}
              >
                {section.title && (
                  <h3
                    className={cn(
                      'font-semibold text-lg mb-2',
                      hasCustomTextColor(section) && 'text-inherit'
                    )}
                  >
                    {section.title}
                  </h3>
                )}
                <p
                  className={cn(
                    hasCustomTextColor(section) ? 'text-inherit opacity-90' : 'text-muted-foreground'
                  )}
                >
                  {section.content}
                </p>
              </section>
            )
          case 'tabs':
            return wrapEditable(
              <section
                key={key}
                className={cn('rounded-2xl border border-border p-5', blockCardSurfaceClass(section))}
              >
                {section.title && (
                  <h3
                    className={cn(
                      'font-semibold text-lg mb-4',
                      hasCustomTextColor(section) && 'text-inherit'
                    )}
                  >
                    {section.title}
                  </h3>
                )}
                <div className="space-y-3">
                  {(section.items ?? []).map((item) => (
                    <div key={item.id} className="rounded-xl bg-secondary/70 p-3">
                      <div
                        className={cn('font-medium', hasCustomTextColor(section) && 'text-inherit')}
                      >
                        <ContentItemBody
                          item={item}
                          tone={hasCustomTextColor(section) ? 'inherit' : 'default'}
                        />
                      </div>
                      {item.description && (
                        <p
                          className={cn(
                            'text-sm',
                            hasCustomTextColor(section) ? 'text-inherit opacity-90' : 'text-muted-foreground'
                          )}
                        >
                          {item.description}
                        </p>
                      )}
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
                className={transparentSurfaceClass}
              />
            )
          case 'schedule':
            return wrapEditable(renderSchedule(section.title, section.items ?? [], section))
          default:
            return wrapEditable(
              <section
                key={key}
                className={cn('rounded-2xl border border-border p-5', blockCardSurfaceClass(section))}
              >
                {section.title && (
                  <h3
                    className={cn(
                      'font-semibold text-lg mb-3',
                      hasCustomTextColor(section) && 'text-inherit'
                    )}
                  >
                    {section.title}
                  </h3>
                )}
                {section.content && (
                  <p
                    className={cn(
                      hasCustomTextColor(section) ? 'text-inherit opacity-90' : 'text-muted-foreground'
                    )}
                  >
                    {section.content}
                  </p>
                )}
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
