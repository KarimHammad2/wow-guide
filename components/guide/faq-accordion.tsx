'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

interface FAQItem {
  id?: string
  title?: string
  description?: string
  question?: string
  answer?: string
}

interface FAQAccordionProps {
  title?: string
  items: FAQItem[]
  className?: string
  /** When true, title and answers follow the parent block’s text color (Builder). */
  inheritBlockText?: boolean
}

export function FAQAccordion({ title, items, className, inheritBlockText }: FAQAccordionProps) {
  return (
    <div className={cn('rounded-2xl bg-card border border-border p-5', className)}>
      {title && (
        <h3
          className={cn(
            'font-semibold text-lg mb-4',
            inheritBlockText ? 'text-inherit' : 'text-foreground'
          )}
        >
          {title}
        </h3>
      )}
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, index) => {
          const key = item.id ?? `faq-${index}`
          const heading = item.question ?? item.title ?? 'Question'
          const body = item.answer ?? item.description ?? ''

          return (
          <AccordionItem key={key} value={key} className="border-border">
            <AccordionTrigger
              className={cn(
                'text-left font-medium hover:no-underline py-4',
                inheritBlockText && 'text-inherit'
              )}
            >
              {heading}
            </AccordionTrigger>
            <AccordionContent
              className={cn(
                'leading-relaxed pb-4',
                inheritBlockText ? 'text-inherit opacity-90' : 'text-muted-foreground'
              )}
            >
              {body}
            </AccordionContent>
          </AccordionItem>
        )})}
      </Accordion>
    </div>
  )
}
