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
  /** When set, links and rich text follow the parent block’s text color (guest builder colors). */
  tone?: 'default' | 'inherit'
}

/** Renders list/checklist row text: rich editor output, legacy row link, old markdown-in-title, or plain text. */
export function ContentItemBody({ item, className, tone = 'default' }: ContentItemBodyProps) {
  const inherit = tone === 'inherit'
  const richHtml =
    item.richText && hasSubstantiveRichTextJson(item.richText) ? richTextJsonToSafeHtml(item.richText) : null
  if (richHtml) {
    return (
      <div
        className={cn(
          'rich-text-html min-w-0 leading-relaxed',
          inherit
            ? '[&_a]:text-inherit [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:opacity-90'
            : '[&_a]:text-[#FFEB8A]! [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-[#FFEB8A]!',
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
          'group inline-flex max-w-full items-center gap-1.5 underline underline-offset-4',
          inherit
            ? 'text-inherit hover:opacity-90'
            : 'text-[#FFEB8A]! hover:text-[#FFEB8A]!',
          className
        )}
      >
        <span className="wrap-break-word">{item.title}</span>
        <ExternalLink
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            inherit ? 'text-inherit group-hover:opacity-90' : 'text-[#FFEB8A]! group-hover:text-[#FFEB8A]!'
          )}
          aria-hidden
        />
      </Link>
    )
  }
  if (hasBracketLinks) {
    return (
      <InlineLinkedText
        text={item.title}
        className={cn('leading-relaxed', className)}
        linkClassName={inherit ? '!text-inherit underline underline-offset-4 opacity-90 hover:opacity-100' : undefined}
      />
    )
  }
  return <span className={cn('wrap-break-word leading-relaxed', className)}>{item.title}</span>
}
