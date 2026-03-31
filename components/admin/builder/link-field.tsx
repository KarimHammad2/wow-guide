import { Input } from '@/components/ui/input'

interface LinkFieldProps {
  value?: string
  onChange: (value: string) => void
}

export function LinkField({ value, onChange }: LinkFieldProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">Link URL</p>
      <Input
        value={value ?? ''}
        placeholder="https://..."
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
