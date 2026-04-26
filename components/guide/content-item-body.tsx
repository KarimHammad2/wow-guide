import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { ContentItem } from '@/lib/data'
import { collectBracketLinkHrefs } from '@/lib/inline-markdown-links'
import { InlineLinkedText } from '@/components/guide/inline-linked-text'
import { richTextJsonToSafeHtml } from '@/lib/tiptap/rich-text-html'
import { hasSubstantiveRichTextJson } from '@/lib/tiptap/rich-text-json'
import { normalizeSafeNavigationTarget } from '@/lib/url-safety'
import { cn } from '@/lib/utils'

type ItemLike = Pick<ContentItem, 'title' | 'link' | 'richText'>

interface ContentItemBodyProps {
  item: ItemLike
  className?: string
}

/** Renders list/checklist row text: rich editor output, legacy row link, old markdown-in-title, or plain text. */
export function ContentItemBody({ item, className }: ContentItemBodyProps) {
  const richHtml =
    item.richText && hasSubstantiveRichTextJson(item.richText) ? richTextJsonToSafeHtml(item.richText) : null
  if (richHtml) {
    return (
      <div
        className={cn(
          'rich-text-html min-w-0 leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-foreground',
          className
        )}
        dangerouslySetInnerHTML={{ __html: richHtml }}
      />
    )
  }
  const hasBracketLinks = collectBracketLinkHrefs(item.title).length > 0
  if (item.link?.trim() && !hasBracketLinks) {
    return (
      <Link
        href={normalizeSafeNavigationTarget(item.link)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'group inline-flex max-w-full items-center gap-1.5 text-primary underline underline-offset-4 hover:text-foreground',
          className
        )}
      >
        <span className="wrap-break-word">{item.title}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden />
      </Link>
    )
  }
  if (hasBracketLinks) {
    return <InlineLinkedText text={item.title} className={cn('leading-relaxed', className)} />
  }
  return <span className={cn('wrap-break-word leading-relaxed', className)}>{item.title}</span>
}
