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
}

export function FAQAccordion({ title, items, className }: FAQAccordionProps) {
  return (
    <div className={cn('rounded-2xl bg-card border border-border p-5', className)}>
      {title && (
        <h3 className="font-semibold text-lg mb-4 text-foreground">{title}</h3>
      )}
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, index) => {
          const key = item.id ?? `faq-${index}`
          const heading = item.question ?? item.title ?? 'Question'
          const body = item.answer ?? item.description ?? ''

          return (
          <AccordionItem key={key} value={key} className="border-border">
            <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
              {heading}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
              {body}
            </AccordionContent>
          </AccordionItem>
        )})}
      </Accordion>
    </div>
  )
}
