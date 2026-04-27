import { describe, expect, it, vi } from 'vitest'
import {
  assertInheritanceSaveAllowed,
  mergeBlockLists,
  mergeGuideWithInheritance,
  mergeVisualDocuments,
} from '../lib/content-inheritance'
import type { ContentInheritance, GuideContent } from '../lib/admin-types'
import type { VisualBlock } from '../lib/visual-builder-schema'

function vdoc(blocks: VisualBlock[]) {
  return {
    contentVersion: 2 as const,
    layout: 'single-column' as const,
    blocks,
  }
}

const block = (id: string, type: 'text' | 'container' = 'text', extra?: Partial<VisualBlock>) => ({
  id,
  type,
  title: id,
  ...extra,
} as VisualBlock)

describe('mergeBlockLists', () => {
  it('parent order, overlay overrides by id', () => {
    const base = [block('a'), block('b')]
    const overlay = [block('a', 'text', { title: 'A-over' })]
    const m = mergeBlockLists(base, overlay)
    expect(m.map((b) => b.id)).toEqual(['a', 'b'])
    expect(m[0]!.title).toBe('A-over')
  })

  it('appends overlay-only block ids', () => {
    const base = [block('a')]
    const overlay = [block('a'), block('x')]
    const m = mergeBlockLists(base, overlay)
    expect(m.map((b) => b.id)).toEqual(['a', 'x'])
  })

  it('parent adds block: appears when overlay lacks id', () => {
    const base = [block('a'), block('c')]
    const overlay = [block('a')]
    const m = mergeBlockLists(base, overlay)
    expect(m.map((b) => b.id)).toEqual(['a', 'c'])
  })

  it('merges children recursively in containers', () => {
    const base = [block('root', 'container', { children: [block('inner-1'), block('inner-2')] })]
    const overlay = [block('root', 'container', { children: [block('inner-1', 'text', { title: 'in1' })] })]
    const m = mergeBlockLists(base, overlay)
    expect(m[0]!.id).toBe('root')
    const ch = m[0]!.children
    expect(ch?.map((b) => b.id)).toEqual(['inner-1', 'inner-2'])
    expect(ch?.[0]!.title).toBe('in1')
  })
})

describe('mergeVisualDocuments', () => {
  it('merges intro: overlay non-empty wins', () => {
    const a = { contentVersion: 2 as const, layout: 'single-column' as const, blocks: [], settings: { intro: 'Base' } }
    const b = { contentVersion: 2 as const, layout: 'single-column' as const, blocks: [], settings: { intro: '  Local  ' } }
    const m = mergeVisualDocuments(a, b)
    expect(m.settings?.intro).toBe('  Local  ')
  })

  it('intro falls back to base when overlay empty', () => {
    const a = { contentVersion: 2 as const, layout: 'single-column' as const, blocks: [], settings: { intro: 'X' } }
    const b = { contentVersion: 2 as const, layout: 'single-column' as const, blocks: [], settings: { intro: '' } }
    const m = mergeVisualDocuments(a, b)
    expect(m.settings?.intro).toBe('X')
  })
})

describe('mergeGuideWithInheritance', () => {
  it('no inheritance: returns local', () => {
    const g: GuideContent = {
      intro: 'hi',
      sections: [],
      visualDocument: vdoc([block('x')]),
    }
    const r = mergeGuideWithInheritance(null, g)
    expect(r.sections).toEqual(g.sections)
  })

  it('merges with base and keeps contentInheritance on result', () => {
    const base: GuideContent = {
      intro: '',
      sections: [],
      visualDocument: vdoc([block('a'), block('b')]),
    }
    const local: GuideContent = {
      intro: '',
      sections: [],
      visualDocument: vdoc([block('a', 'text', { title: 'child' })]),
      contentInheritance: { sourceBuildingId: 'b1', sourceCategorySlug: 'cat' } satisfies ContentInheritance,
    }
    const r = mergeGuideWithInheritance(base, local)
    expect(r.contentInheritance).toEqual(local.contentInheritance)
    expect(r.visualDocument?.blocks.map((b) => b.id)).toEqual(['a', 'b'])
    expect(r.visualDocument?.blocks[0]!.title).toBe('child')
  })
})

describe('assertInheritanceSaveAllowed', () => {
  it('rejects self', async () => {
    const g = await assertInheritanceSaveAllowed(
      'b1',
      'x',
      { sourceBuildingId: 'b1', sourceCategorySlug: 'x' },
      vi.fn()
    )
    expect(g).toEqual({ ok: false, message: 'A category cannot inherit from itself.' })
  })

  it('rejects when source missing', async () => {
    const g = await assertInheritanceSaveAllowed('b1', 'x', { sourceBuildingId: 'b2', sourceCategorySlug: 'y' }, async () => undefined)
    expect(g).toEqual({ ok: false, message: 'Source category was not found.' })
  })

  it('ok when no chain to current', async () => {
    const g = await assertInheritanceSaveAllowed('b1', 'x', { sourceBuildingId: 'b2', sourceCategorySlug: 'y' }, async () => ({
      intro: '',
      sections: [],
      visualDocument: vdoc([block('a')]),
    }))
    expect(g).toEqual({ ok: true })
  })

  it('cycle: source chain reaches current', async () => {
    const get = vi.fn(
      async (bid: string, sl: string): Promise<GuideContent | undefined> => {
        if (bid === 'b2' && sl === 'y') {
          return { intro: '', sections: [], contentInheritance: { sourceBuildingId: 'b1', sourceCategorySlug: 'x' } } as GuideContent
        }
        if (bid === 'b1' && sl === 'x') {
          return { intro: '', sections: [] }
        }
        return undefined
      }
    )
    const g = await assertInheritanceSaveAllowed('b1', 'x', { sourceBuildingId: 'b2', sourceCategorySlug: 'y' }, get)
    expect(g).toEqual({ ok: false, message: 'Inheritance would create a cycle.' })
  })
})
