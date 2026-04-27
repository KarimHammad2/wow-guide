'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import type { JSONContent } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Sparkles,
  Strikethrough,
  Table2,
  TextQuote,
  Trash2,
} from 'lucide-react'
import { EMPTY_RICH_TEXT_DOC } from '@/lib/tiptap/empty-doc'
import { INLINE_ICON_OPTIONS, type InlineIconKind, type InlineIconOption } from '@/lib/inline-icon-catalog'
import { getRichTextExtensions } from '@/lib/tiptap/rich-text-extensions'
import { getLucideIcon } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const TABLE_ROWS_MAX = 20
const TABLE_COLS_MAX = 12

/** TipTap: avoid focusing the toolbar button so the editor keeps its text selection. */
function toolbarPointerDown(e: MouseEvent) {
  e.preventDefault()
}

function clampTableDimension(raw: string, max: number, fallback: number): number {
  const n = Number.parseInt(raw.trim(), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(1, n))
}

export function initialDocFromProps(value: unknown, plainFallback: string | undefined): JSONContent {
  if (value && typeof value === 'object' && (value as JSONContent).type === 'doc') {
    return value as JSONContent
  }
  if (plainFallback?.trim()) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: plainFallback }],
        },
      ],
    }
  }
  return EMPTY_RICH_TEXT_DOC
}

export interface RichTextBlockEditorProps {
  value: unknown
  plainFallback?: string
  onChange: (json: JSONContent, plainText: string) => void
  className?: string
  /** `essential`: bold, italic, and link only (e.g. list rows). Default: full toolbar. */
  toolbar?: 'full' | 'essential'
  /** Tiptap recommends `false` for Next.js to avoid hydration mismatches. */
  immediatelyRender?: boolean
  /**
   * When set (e.g. max-h-56), the editable region scrolls inside that height
   * so parent panels stay compact.
   */
  editorScrollMaxClassName?: string
  /**
   * `inherit`: transparent surface and `text-inherit` so Builder block `color` / `backgroundColor` show through.
   * `default`: theme background and foreground (admin panel, list row chrome).
   */
  surface?: 'default' | 'inherit'
}

export function RichTextBlockEditor({
  value,
  plainFallback = '',
  onChange,
  className,
  toolbar = 'full',
  immediatelyRender = false,
  editorScrollMaxClassName,
  surface = 'default',
}: RichTextBlockEditorProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const initial = useRef(initialDocFromProps(value, plainFallback))
  const linkSelectionRef = useRef<{ from: number; to: number } | null>(null)
  const iconSelectionRef = useRef<{ from: number; to: number } | null>(null)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkDraft, setLinkDraft] = useState('https://')
  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [tableRowsStr, setTableRowsStr] = useState('3')
  const [tableColsStr, setTableColsStr] = useState('3')
  const [iconDialogOpen, setIconDialogOpen] = useState(false)
  const [iconTab, setIconTab] = useState<InlineIconKind>('lucide')

  const editor = useEditor(
    {
      immediatelyRender,
      shouldRerenderOnTransaction: true,
      extensions: getRichTextExtensions(),
      content: initial.current,
      onUpdate: ({ editor: e }) => {
        onChangeRef.current(e.getJSON() as JSONContent, e.getText())
      },
    },
    [immediatelyRender]
  )

  useEffect(() => {
    if (!editor) return
    const next = initialDocFromProps(value, plainFallback)
    if (JSON.stringify(editor.getJSON()) === JSON.stringify(next)) return
    editor.commands.setContent(next, false)
  }, [editor, value, plainFallback])

  const openLinkDialog = useCallback(() => {
    if (!editor) return
    const { from, to } = editor.state.selection
    linkSelectionRef.current = { from, to }
    const previous = editor.getAttributes('link')?.href as string | undefined
    setLinkDraft(previous ?? 'https://')
    setLinkDialogOpen(true)
  }, [editor])

  const applyLinkFromDialog = useCallback(() => {
    if (!editor) return
    const trimmed = linkDraft.trim()
    const sel = linkSelectionRef.current
    const chain = sel
      ? editor.chain().focus().setTextSelection({ from: sel.from, to: sel.to })
      : editor.chain().focus()
    if (trimmed === '') {
      chain.extendMarkRange('link').unsetLink().run()
    } else {
      chain.extendMarkRange('link').setLink({ href: trimmed }).run()
    }
    linkSelectionRef.current = null
    setLinkDialogOpen(false)
  }, [editor, linkDraft])

  const dismissLinkDialog = useCallback(() => {
    linkSelectionRef.current = null
    setLinkDialogOpen(false)
  }, [])

  const openTableDialog = useCallback(() => {
    setTableRowsStr('3')
    setTableColsStr('3')
    setTableDialogOpen(true)
  }, [])

  const applyTableFromDialog = useCallback(() => {
    if (!editor) return
    const rows = clampTableDimension(tableRowsStr, TABLE_ROWS_MAX, 3)
    const cols = clampTableDimension(tableColsStr, TABLE_COLS_MAX, 3)
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    setTableDialogOpen(false)
  }, [editor, tableRowsStr, tableColsStr])

  const dismissTableDialog = useCallback(() => {
    setTableDialogOpen(false)
  }, [])

  const openIconDialog = useCallback(() => {
    if (!editor) return
    const { from, to } = editor.state.selection
    iconSelectionRef.current = { from, to }
    setIconTab('lucide')
    setIconDialogOpen(true)
  }, [editor])

  const insertInlineIcon = useCallback(
    (option: InlineIconOption) => {
      if (!editor) return
      const selection = iconSelectionRef.current
      const chain = selection
        ? editor.chain().focus().setTextSelection({ from: selection.from, to: selection.to })
        : editor.chain().focus()
      chain
        .insertContent({
          type: 'inlineIcon',
          attrs: {
            kind: option.kind,
            name: option.name,
            symbol: option.symbol,
            label: option.label,
          },
        })
        .run()
      iconSelectionRef.current = null
      setIconDialogOpen(false)
    },
    [editor]
  )

  if (!editor) {
    return (
      <div
        className={cn(
          'min-h-24 rounded-md border border-border',
          surface === 'inherit' ? 'bg-transparent' : 'bg-muted/30',
          className
        )}
      />
    )
  }

  function markVariant(active: boolean): 'secondary' | 'ghost' {
    return active ? 'secondary' : 'ghost'
  }

  return (
    <div
      className={cn(
        'rich-text-block-editor rounded-md border border-border',
        surface === 'inherit' ? 'bg-transparent' : 'bg-background',
        className
      )}
    >
      <div className="flex flex-wrap gap-1 border-b border-border p-1">
        <Button
          type="button"
          size="sm"
          variant={markVariant(editor.isActive('bold'))}
          className="h-8 w-8 shrink-0 px-0"
          onMouseDown={toolbarPointerDown}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={markVariant(editor.isActive('italic'))}
          className="h-8 w-8 shrink-0 px-0"
          onMouseDown={toolbarPointerDown}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        {toolbar === 'full' && (
          <>
            <Button
              type="button"
              size="sm"
              variant={markVariant(editor.isActive('strike'))}
              className="h-8 w-8 shrink-0 px-0"
              onMouseDown={toolbarPointerDown}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              title="Strikethrough"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={markVariant(editor.isActive('bulletList'))}
              className="h-8 w-8 shrink-0 px-0"
              onMouseDown={toolbarPointerDown}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet list"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={markVariant(editor.isActive('orderedList'))}
              className="h-8 w-8 shrink-0 px-0"
              onMouseDown={toolbarPointerDown}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered list"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={markVariant(editor.isActive('blockquote'))}
              className="h-8 w-8 shrink-0 px-0"
              onMouseDown={toolbarPointerDown}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Quote"
            >
              <TextQuote className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 gap-1"
          onMouseDown={toolbarPointerDown}
          onClick={openLinkDialog}
          title="Add or edit link"
        >
          <Link2 className="h-3.5 w-3.5" />
          <span>Link</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 gap-1"
          onMouseDown={toolbarPointerDown}
          onClick={openIconDialog}
          title="Insert icon"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Icon</span>
        </Button>
        {toolbar === 'full' && (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1"
              onMouseDown={toolbarPointerDown}
              onClick={openTableDialog}
              title="Insert table"
            >
              <Table2 className="h-3.5 w-3.5" />
              <span>Table</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1"
              onMouseDown={toolbarPointerDown}
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
              title="Add row below"
            >
              + Row
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1"
              onMouseDown={toolbarPointerDown}
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
              title="Add column after"
            >
              + Col
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1"
              onMouseDown={toolbarPointerDown}
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              disabled={!editor.can().toggleHeaderRow()}
              title="Toggle header row"
            >
              Header
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 gap-1 text-destructive hover:text-destructive"
              onMouseDown={toolbarPointerDown}
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              title="Delete table"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Del table</span>
            </Button>
          </>
        )}
      </div>
      <div
        className={cn(
          editorScrollMaxClassName && 'overflow-y-auto overscroll-y-contain',
          editorScrollMaxClassName,
        )}
      >
        <EditorContent
          editor={editor}
          className={cn(
            'tiptap-editor min-h-24 max-w-none px-3 py-2 text-sm',
            surface === 'inherit' ? 'text-inherit' : 'text-foreground'
          )}
        />
      </div>

      <Dialog
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open)
          if (!open) linkSelectionRef.current = null
        }}
      >
        <DialogContent className="gap-5 border-border/80 bg-card/95 shadow-xl backdrop-blur-sm sm:max-w-md">
          <DialogHeader className="gap-3 text-left sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1 pr-8">
                <DialogTitle>Add link</DialogTitle>
                <DialogDescription>
                  Paste a full URL (https://…). Clear the field and apply to remove an existing link.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rich-text-link-url">URL</Label>
            <Input
              id="rich-text-link-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://example.com"
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyLinkFromDialog()
                }
              }}
              className="h-10 font-mono text-sm"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={dismissLinkDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={applyLinkFromDialog}>
              Apply link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={iconDialogOpen}
        onOpenChange={(open) => {
          setIconDialogOpen(open)
          if (!open) iconSelectionRef.current = null
        }}
      >
        <DialogContent className="gap-5 border-border/80 bg-card/95 shadow-xl backdrop-blur-sm sm:max-w-3xl">
          <DialogHeader className="gap-3 text-left sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1 pr-8">
                <DialogTitle>Insert icon</DialogTitle>
                <DialogDescription>
                  Choose a Lucide-style icon or a symbol and insert it inline at the cursor.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={iconTab === 'lucide' ? 'default' : 'outline'}
              onClick={() => setIconTab('lucide')}
            >
              Icons
            </Button>
            <Button
              type="button"
              size="sm"
              variant={iconTab === 'symbol' ? 'default' : 'outline'}
              onClick={() => setIconTab('symbol')}
            >
              Symbols
            </Button>
          </div>

          <div className="max-h-[55vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {(INLINE_ICON_OPTIONS[iconTab] ?? []).map((option) => {
                const Icon = option.kind === 'lucide' ? getLucideIcon(option.name) : null
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => insertInlineIcon(option)}
                    className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-3 text-center transition-colors hover:bg-muted/50"
                    title={option.label}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/40 text-lg">
                      {Icon ? <Icon className="h-5 w-5" /> : <span aria-hidden>{option.symbol}</span>}
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setIconDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent className="gap-5 border-border/80 bg-card/95 shadow-xl backdrop-blur-sm sm:max-w-md">
          <DialogHeader className="gap-3 text-left sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Table2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1 pr-8">
                <DialogTitle>Insert table</DialogTitle>
                <DialogDescription>
                  Choose how many rows and columns to insert. The first row will be a header row. Maximum{' '}
                  {TABLE_ROWS_MAX} rows and {TABLE_COLS_MAX} columns.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rich-text-table-rows">Rows</Label>
              <Input
                id="rich-text-table-rows"
                type="number"
                inputMode="numeric"
                min={1}
                max={TABLE_ROWS_MAX}
                autoFocus
                value={tableRowsStr}
                onChange={(e) => setTableRowsStr(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyTableFromDialog()
                  }
                }}
                className="h-10 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rich-text-table-cols">Columns</Label>
              <Input
                id="rich-text-table-cols"
                type="number"
                inputMode="numeric"
                min={1}
                max={TABLE_COLS_MAX}
                value={tableColsStr}
                onChange={(e) => setTableColsStr(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyTableFromDialog()
                  }
                }}
                className="h-10 font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={dismissTableDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={applyTableFromDialog}>
              Insert table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
