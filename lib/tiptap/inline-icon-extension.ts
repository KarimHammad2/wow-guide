import { mergeAttributes, Node } from '@tiptap/core'

export interface InlineIconAttrs {
  kind: 'lucide' | 'symbol'
  name: string
  symbol: string
  label: string
}

export const InlineIconExtension = Node.create({
  name: 'inlineIcon',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      kind: {
        default: 'symbol',
      },
      name: {
        default: '',
      },
      symbol: {
        default: '•',
      },
      label: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-inline-icon]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false
          const symbol = (element.textContent ?? '').trim() || element.getAttribute('data-icon-symbol')?.trim() || '•'
          return {
            kind: (element.getAttribute('data-icon-kind') as InlineIconAttrs['kind'] | null) ?? 'symbol',
            name: element.getAttribute('data-icon-name') ?? '',
            symbol,
            label: element.getAttribute('aria-label') ?? element.getAttribute('title') ?? symbol,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const symbol = typeof HTMLAttributes.symbol === 'string' && HTMLAttributes.symbol.trim() ? HTMLAttributes.symbol : '•'
    const label = typeof HTMLAttributes.label === 'string' && HTMLAttributes.label.trim() ? HTMLAttributes.label : symbol
    const {
      kind: _kind,
      name: _name,
      symbol: _symbol,
      label: _label,
      ...rest
    } = HTMLAttributes as Record<string, unknown>
    return [
      'span',
      mergeAttributes(
        {
          class: 'inline-icon',
          'data-inline-icon': 'true',
          'data-icon-kind': HTMLAttributes.kind,
          'data-icon-name': HTMLAttributes.name,
          'data-icon-symbol': symbol,
          role: 'img',
          title: label,
          'aria-label': label,
        },
        rest
      ),
      symbol,
    ]
  },

  renderText({ node }) {
    return typeof node.attrs.symbol === 'string' && node.attrs.symbol.trim() ? node.attrs.symbol : '•'
  },
})
