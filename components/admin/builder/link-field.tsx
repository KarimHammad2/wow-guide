import { Input } from '@/components/ui/input'

interface LinkFieldProps {
  value?: string
  onChange: (value: string) => void
  /** Label above the URL input */
  label?: string
}

export function LinkField({ value, onChange, label = 'Link URL' }: LinkFieldProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Input
        value={value ?? ''}
        placeholder="https://..."
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
