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
}

export function InstructionStepper({ title, steps, className, fillRowHeight }: InstructionStepperProps) {
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
              <div className="font-medium text-foreground">
                <ContentItemBody item={step} />
              </div>
              {step.description && (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  )

  return (
    <div
      className={cn(
        'rounded-2xl bg-card border border-border p-5',
        fillRowHeight && 'flex h-full min-h-0 flex-col',
        className
      )}
    >
      {title && (
        <h3 className="mb-5 shrink-0 font-semibold text-lg text-foreground">{title}</h3>
      )}
      <div className={cn('relative', fillRowHeight && 'min-h-0 flex-1 overflow-y-auto')}>{listBody}</div>
    </div>
  )
}
