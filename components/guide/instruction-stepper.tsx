import { cn } from '@/lib/utils'

interface StepItem {
  id?: string
  title: string
  description?: string
}

interface InstructionStepperProps {
  title?: string
  steps: StepItem[]
  className?: string
}

export function InstructionStepper({
  title,
  steps,
  className,
}: InstructionStepperProps) {
  return (
    <div className={cn('rounded-2xl bg-card border border-border p-5', className)}>
      {title && (
        <h3 className="font-semibold text-lg mb-5 text-foreground">{title}</h3>
      )}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />
        
        <ol className="space-y-5">
          {steps.map((step, index) => (
            <li key={step.id ?? `step-${index}`} className="relative flex gap-4">
              {/* Step number */}
              <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                {index + 1}
              </div>
              
              {/* Content */}
              <div className="flex-1 pt-0.5">
                <h4 className="font-medium text-foreground">{step.title}</h4>
                {step.description && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
