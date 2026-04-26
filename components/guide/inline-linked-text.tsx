import Link from 'next/link'
import { parseBracketLinkSegments } from '@/lib/inline-markdown-links'
import { isSafeNavigationTarget, normalizeSafeNavigationTarget } from '@/lib/url-safety'
import { cn } from '@/lib/utils'

interface InlineLinkedTextProps {
  text: string
  className?: string
  linkClassName?: string
}

export function InlineLinkedText({ text, className, linkClassName }: InlineLinkedTextProps) {
  const segments = parseBracketLinkSegments(text)
  return (
    <span className={cn(className)}>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return (
            <span key={i} className="wrap-break-word">
              {seg.text}
            </span>
          )
        }
        const safe = isSafeNavigationTarget(seg.href)
        if (!safe) {
          return (
            <span key={i} className="wrap-break-word">
              {seg.label}
            </span>
          )
        }
        return (
          <Link
            key={i}
            href={normalizeSafeNavigationTarget(seg.href)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'wrap-break-word text-primary underline underline-offset-4 hover:text-foreground',
              linkClassName
            )}
          >
            {seg.label}
          </Link>
        )
      })}
    </span>
  )
}
