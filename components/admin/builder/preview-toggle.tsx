import { Button } from '@/components/ui/button'

interface PreviewToggleProps {
  preview: boolean
  onToggle: () => void
}

export function PreviewToggle({ preview, onToggle }: PreviewToggleProps) {
  return (
    <Button variant="outline" onClick={onToggle}>
      {preview ? 'Back to Edit' : 'Preview'}
    </Button>
  )
}
