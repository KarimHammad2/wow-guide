import { cn } from '@/lib/utils'
import { ContentItemBody } from '@/components/guide/content-item-body'

interface StepItem {
  id?: string
  title: string
  description?: string
  link?: string
  richText?: unknown
}

interface InstructionStepperProps {
  title?: string
  steps: StepItem[]
  className?: string
  /**
   * When true (e.g. side-by-side row in the guide), the card fills the grid cell height
   * and long step lists scroll inside the frame instead of growing past the sibling column.
   */
  fillRowHeight?: boolean
  /** Let the parent block’s background show through (Builder custom `backgroundColor`). */
  transparentCard?: boolean
  /** Use inherited text color for title/body so Builder `textColor` applies. */
  inheritBlockText?: boolean
  /** Passed to list row `ContentItemBody` when the block has a custom text color. */
  contentItemTone?: 'default' | 'inherit'
  /** When `fillRowHeight` is set, align the step list in the block (Builder vertical align). */
  blockVerticalAlign?: 'top' | 'center' | 'bottom'
}

export function InstructionStepper({
  title,
  steps,
  className,
  fillRowHeight,
  transparentCard,
  inheritBlockText,
  contentItemTone = 'default',
  blockVerticalAlign = 'top',
}: InstructionStepperProps) {
  const listBody = (
    <>
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" aria-hidden />
      <ol className="space-y-5">
        {steps.map((step, index) => (
          <li key={step.id ?? `step-${index}`} className="relative flex gap-4">
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {index + 1}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div
                className={cn('font-medium', inheritBlockText ? 'text-inherit' : 'text-foreground')}
              >
                <ContentItemBody item={step} tone={contentItemTone} />
              </div>
              {step.description && (
                <p
                  className={cn(
                    'mt-1 text-sm leading-relaxed',
                    inheritBlockText ? 'text-inherit opacity-90' : 'text-muted-foreground'
                  )}
                >
                  {step.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  )

  const titleNode =
    title ? (
      <h3
        className={cn(
          'mb-5 shrink-0 font-semibold text-lg',
          inheritBlockText ? 'text-inherit' : 'text-foreground',
        )}
      >
        {title}
      </h3>
    ) : null

  if (fillRowHeight && (blockVerticalAlign === 'center' || blockVerticalAlign === 'bottom')) {
    if (blockVerticalAlign === 'center') {
      return (
        <div
          className={cn(
            'rounded-2xl border border-border p-5',
            transparentCard ? 'bg-transparent' : 'bg-card',
            'flex h-full min-h-0 w-full flex-col',
            className,
          )}
        >
          <div className="flex min-h-0 w-full flex-1 flex-col justify-center overflow-hidden">
            <div className="min-h-0 w-full max-h-full overflow-y-auto">
              {titleNode}
              <div className="relative">{listBody}</div>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div
        className={cn(
          'rounded-2xl border border-border p-5',
          transparentCard ? 'bg-transparent' : 'bg-card',
          'flex h-full min-h-0 w-full flex-col justify-end',
          className,
        )}
      >
        <div className="min-h-0 w-full max-h-full shrink overflow-y-auto">
          {titleNode}
          <div className="relative">{listBody}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border p-5',
        transparentCard ? 'bg-transparent' : 'bg-card',
        fillRowHeight && 'flex h-full min-h-0 flex-col',
        className
      )}
    >
      {titleNode}
      <div className={cn('relative', fillRowHeight && 'min-h-0 flex-1 overflow-y-auto')}>{listBody}</div>
    </div>
  )
}
