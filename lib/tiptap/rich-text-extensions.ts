import { type AnyExtension } from '@tiptap/core'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import StarterKit from '@tiptap/starter-kit'
import { InlineIconExtension } from './inline-icon-extension'
import { isSafeNavigationTarget } from '../url-safety'

const extensionsCache: { list: AnyExtension[] | null } = { list: null }

/**
 * Single shared extension list for the editor, `generateHTML`, and JSON validation.
 * Do not add UI-only extensions here.
 */
export function getRichTextExtensions(): AnyExtension[] {
  if (extensionsCache.list) return extensionsCache.list

  const list: AnyExtension[] = [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
    }),
    Table.configure({
      resizable: false,
      HTMLAttributes: { class: 'rich-text-table' },
    }),
    TableRow,
    TableHeader,
    TableCell,
    Link.extend({
      inclusive: false,
    }).configure({
      openOnClick: false,
      autolink: false,
      linkOnPaste: true,
      defaultProtocol: 'https',
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
      isAllowedUri: (url, ctx) => {
        if (!isSafeNavigationTarget(url)) return false
        return ctx.defaultValidate(url)
      },
    }) as AnyExtension,
    InlineIconExtension,
  ]

  extensionsCache.list = list
  return list
}
