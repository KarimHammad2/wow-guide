'use client'

import { useState } from 'react'
import { ChevronDown, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { QUIET_HOUR_OPTIONS } from '@/lib/quiet-hours'

type QuietHourPickerProps = {
  value: string | undefined
  onValueChange: (value: string) => void
  placeholder: string
  id?: string
  className?: string
  /** When true, trigger shows muted placeholder styling until a value is set */
  unset?: boolean
}

export function QuietHourPicker({
  value,
  onValueChange,
  placeholder,
  id,
  className,
  unset,
}: QuietHourPickerProps) {
  const [open, setOpen] = useState(false)
  const showUnset = unset && !value

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-[min(100%,152px)] justify-between font-normal tabular-nums',
            showUnset && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex items-center gap-1.5 truncate">
            <Clock className="size-3.5 shrink-0 opacity-60" aria-hidden />
            {value ?? placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-100 w-[min(100vw-2rem,20rem)] p-3 shadow-lg"
        sideOffset={6}
      >
        <p className="sr-only">Choose an hour</p>
        <div className="grid grid-cols-6 gap-1">
          {QUIET_HOUR_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={value === o.value}
              onClick={() => {
                onValueChange(o.value)
                setOpen(false)
              }}
              className={cn(
                'rounded-md text-xs font-medium tabular-nums h-8 min-w-0',
                'border border-transparent hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                value === o.value &&
                  'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
