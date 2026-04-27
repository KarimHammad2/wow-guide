import { cn } from '@/lib/utils'

/**
 * Official perspective WOW wordmark (mauve, transparent PNG).
 * Rebuild: `branding/wow-perspective-source.png` → `npm run knockout:wordmark` → `public/wow-wordmark.png`
 */
export function WowWordmark({
  className,
  priority = false,
}: {
  className?: string
  /** Set on LCP hero to hint the browser to load this image first */
  priority?: boolean
}) {
  return (
    <img
      src="/wow-wordmark.png"
      alt="WOW"
      width={1024}
      height={579}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={cn(
        'block h-8 w-auto max-w-[min(11rem,100%)] shrink-0 object-contain object-left',
        className,
      )}
    />
  )
}
