import { Input } from '@/components/ui/input'

interface MediaEmbedFieldProps {
  label: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}

export function MediaEmbedField({
  label,
  value,
  onChange,
  placeholder,
}: MediaEmbedFieldProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Input
        value={value ?? ''}
        placeholder={placeholder ?? 'https://...'}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
