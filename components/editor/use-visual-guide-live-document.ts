'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { deleteEditorMedia, uploadEditorMedia } from '@/components/editor/editor-api'
import { EMPTY_RICH_TEXT_DOC } from '@/lib/tiptap/empty-doc'
import {
  contentItemToVisualListItem,
  isLikelyMediaImageUrl,
  type VisualBlock,
  type VisualGuideDocument,
} from '@/lib/visual-builder-schema'
import type { ContentSection } from '@/lib/data'

export function normalizeEditorDocument(document: VisualGuideDocument): VisualGuideDocument {
  return {
    ...document,
    blocks: document.blocks.map((block) => {
      if (block.type !== 'image') return block
      if (block.mediaUrl) return block
      if (!isLikelyMediaImageUrl(block.url)) return block
      return {
        ...block,
        mediaUrl: block.url,
        url: undefined,
      }
    }),
  }
}

export function createDefaultBlock(type: VisualBlock['type']): VisualBlock {
  const id = `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  if (type === 'catalogBand') {
    return {
      id,
      type,
      title: 'Section title',
      catalogRows: [
        { title: 'First row body text', icon: 'Wifi' },
        { title: 'Second row body text', icon: 'Tv' },
      ],
      styles: { backgroundColor: '#9b5d72', textColor: '#ffffff' },
    }
  }
  if (type === 'list') {
    return { id, type, title: 'List', items: ['First item'] }
  }
  if (type === 'button') {
    return { id, type, title: 'Call to action', content: 'Open', url: '#' }
  }
  if (type === 'link') {
    return { id, type, title: 'Useful link', content: 'Open link', url: '#' }
  }
  if (type === 'text') {
    return { id, type, title: `${type[0]?.toUpperCase()}${type.slice(1)}`, content: '', richText: EMPTY_RICH_TEXT_DOC }
  }
  return { id, type, title: `${type[0]?.toUpperCase()}${type.slice(1)}`, content: '' }
}

export function useVisualGuideLiveDocumentHandlers(
  document: VisualGuideDocument | null,
  setDocument: Dispatch<SetStateAction<VisualGuideDocument | null>>,
  setActiveBlockId: Dispatch<SetStateAction<string | null>>
) {
  const [mediaUploadState, setMediaUploadState] = useState<'idle' | 'uploading' | 'error' | 'warning'>('idle')
  const [mediaUploadMessage, setMediaUploadMessage] = useState<string | null>(null)

  function getBlockById(blockId: string) {
    return document?.blocks.find((block) => block.id === blockId) ?? null
  }

  function updateBlock(blockId: string, patch: Partial<VisualBlock>) {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        blocks: prev.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
      }
    })
  }

  function updateBlockStyles(blockId: string, patch: NonNullable<VisualBlock['styles']>) {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        blocks: prev.blocks.map((block) =>
          block.id === blockId
            ? {
                ...block,
                styles: {
                  ...block.styles,
                  ...patch,
                },
              }
            : block
        ),
      }
    })
  }

  async function applyMediaFile(blockId: string, file: File, options?: { side?: 'left' | 'right' }) {
    const targetBlock = getBlockById(blockId)
    if (!targetBlock) {
      setMediaUploadState('error')
      setMediaUploadMessage('Block not found.')
      return
    }

    if (targetBlock.type === 'text' || targetBlock.type === 'list') {
      setMediaUploadState('uploading')
      setMediaUploadMessage(null)
      const previousUrl = targetBlock.sideImageUrl?.trim() ?? ''
      const pos = options?.side ?? targetBlock.sideImagePosition ?? 'right'
      try {
        const uploaded = await uploadEditorMedia(file)
        updateBlock(blockId, { sideImageUrl: uploaded.url, sideImagePosition: pos })
        if (previousUrl && previousUrl !== uploaded.url) {
          try {
            await deleteEditorMedia(previousUrl)
          } catch {
            setMediaUploadState('warning')
            setMediaUploadMessage('The image was replaced, but the old file could not be removed.')
            return
          }
        }
        setMediaUploadState('idle')
        setMediaUploadMessage(null)
      } catch (err) {
        setMediaUploadState('error')
        setMediaUploadMessage(err instanceof Error ? err.message : 'Upload failed')
      }
      return
    }

    if (targetBlock.type !== 'image' && targetBlock.type !== 'video') {
      setMediaUploadState('error')
      setMediaUploadMessage('Select an image or video block before uploading media.')
      return
    }

    setMediaUploadState('uploading')
    setMediaUploadMessage(null)

    const previousUrl = targetBlock.mediaUrl?.trim() ?? ''

    try {
      const uploaded = await uploadEditorMedia(file)
      updateBlock(blockId, { mediaUrl: uploaded.url })

      if (previousUrl && previousUrl !== uploaded.url) {
        try {
          await deleteEditorMedia(previousUrl)
        } catch {
          setMediaUploadState('warning')
          setMediaUploadMessage('The media was replaced, but the old file could not be removed.')
          return
        }
      }

      setMediaUploadState('idle')
      setMediaUploadMessage(null)
    } catch (err) {
      setMediaUploadState('error')
      setMediaUploadMessage(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  async function removeMedia(blockId: string) {
    const targetBlock = getBlockById(blockId)
    if (!targetBlock || (targetBlock.type !== 'image' && targetBlock.type !== 'video')) {
      setMediaUploadState('error')
      setMediaUploadMessage('Select an image or video block before removing media.')
      return
    }

    if (!targetBlock.mediaUrl) return

    setMediaUploadState('uploading')
    setMediaUploadMessage(null)

    try {
      await deleteEditorMedia(targetBlock.mediaUrl)
      updateBlock(blockId, { mediaUrl: undefined })
      setMediaUploadState('idle')
      setMediaUploadMessage(null)
    } catch (err) {
      setMediaUploadState('error')
      setMediaUploadMessage(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function removeBlockSideImage(blockId: string) {
    const target = getBlockById(blockId)
    if (!target || (target.type !== 'text' && target.type !== 'list') || !target.sideImageUrl?.trim()) {
      return
    }
    const url = target.sideImageUrl.trim()
    setMediaUploadState('uploading')
    setMediaUploadMessage(null)
    try {
      await deleteEditorMedia(url)
      updateBlock(blockId, { sideImageUrl: undefined, sideImagePosition: undefined })
      setMediaUploadState('idle')
      setMediaUploadMessage(null)
    } catch (err) {
      setMediaUploadState('error')
      setMediaUploadMessage(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  function dropBlockOnBlock(sourceBlockId: string, targetBlockId: string, options?: { side?: 'left' | 'right' }) {
    const preSource = getBlockById(sourceBlockId)
    const preTarget = getBlockById(targetBlockId)
    const mergeInBlockImage =
      preSource?.type === 'image' &&
      (preTarget?.type === 'text' || preTarget?.type === 'list') &&
      Boolean(preSource?.url?.trim())

    if (mergeInBlockImage) {
      const url = preSource!.url!.trim()
      const side = options?.side === 'left' || options?.side === 'right' ? options.side : 'right'
      setDocument((prev) => {
        if (!prev) return prev
        const withoutSource = prev.blocks.filter((b) => b.id !== sourceBlockId)
        const ti = withoutSource.findIndex((b) => b.id === targetBlockId)
        if (ti < 0) return prev
        const previousSide = withoutSource[ti].sideImageUrl?.trim()
        if (previousSide && previousSide !== url) {
          void deleteEditorMedia(previousSide).catch(() => {
            // best-effort cleanup; merge still applied
          })
        }
        const next = [...withoutSource]
        next[ti] = {
          ...next[ti],
          sideImageUrl: url,
          sideImagePosition: side,
        }
        return { ...prev, blocks: next }
      })
      setActiveBlockId(targetBlockId)
      return
    }

    setDocument((prev) => {
      if (!prev) return prev
      const sourceIndex = prev.blocks.findIndex((block) => block.id === sourceBlockId)
      const targetIndex = prev.blocks.findIndex((block) => block.id === targetBlockId)
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return prev

      const source = prev.blocks[sourceIndex]
      const target = prev.blocks[targetIndex]
      const rowId = target.styles?.rowId ?? `row-${Date.now().toString(36)}`

      const next = [...prev.blocks]
      next[targetIndex] = {
        ...target,
        styles: {
          ...target.styles,
          rowId,
        },
      }

      next.splice(sourceIndex, 1)
      const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
      const updatedSource: VisualBlock = {
        ...source,
        styles: {
          ...source.styles,
          rowId,
        },
      }
      next.splice(adjustedTargetIndex + 1, 0, updatedSource)

      return {
        ...prev,
        blocks: next,
      }
    })
  }

  function insertBlock(index: number, type: VisualBlock['type']) {
    const block = createDefaultBlock(type)
    setDocument((prev) => {
      if (!prev) return prev
      const next = [...prev.blocks]
      next.splice(index, 0, block)
      return { ...prev, blocks: next }
    })
    setActiveBlockId(block.id)
  }

  function addBlock(type: VisualBlock['type']) {
    const block = createDefaultBlock(type)
    setDocument((prev) => (prev ? { ...prev, blocks: [...prev.blocks, block] } : prev))
    setActiveBlockId(block.id)
  }

  function deleteBlock(blockId: string) {
    setDocument((prev) => {
      if (!prev) return prev
      return { ...prev, blocks: prev.blocks.filter((block) => block.id !== blockId) }
    })
    setActiveBlockId(null)
  }

  function moveBlockDirection(blockId: string, direction: 'up' | 'down') {
    setDocument((prev) => {
      if (!prev) return prev
      const sourceIndex = prev.blocks.findIndex((b) => b.id === blockId)
      const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1
      if (sourceIndex < 0 || targetIndex < 0) return prev
      if (targetIndex >= prev.blocks.length) return prev
      const next = [...prev.blocks]
      const [removed] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, removed)
      return { ...prev, blocks: next }
    })
  }

  function reorderToIndex(sourceId: string, targetIndex: number) {
    setDocument((prev) => {
      if (!prev) return prev
      const sourceIndex = prev.blocks.findIndex((b) => b.id === sourceId)
      if (sourceIndex < 0) return prev
      const clampedTarget = Math.max(0, Math.min(targetIndex, prev.blocks.length))
      const next = [...prev.blocks]
      const [removed] = next.splice(sourceIndex, 1)
      const insertIndex = sourceIndex < clampedTarget ? clampedTarget - 1 : clampedTarget
      next.splice(insertIndex, 0, removed)
      return { ...prev, blocks: next }
    })
  }

  function duplicateBlock(blockId: string) {
    setDocument((prev) => {
      if (!prev) return prev
      const index = prev.blocks.findIndex((item) => item.id === blockId)
      if (index < 0) return prev
      const source = prev.blocks[index]
      const copy: VisualBlock = {
        ...source,
        id: `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      }
      const next = [...prev.blocks]
      next.splice(index + 1, 0, copy)
      return { ...prev, blocks: next }
    })
  }

  function patchSectionFromCanvas(blockId: string, patch: Partial<ContentSection>) {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        blocks: prev.blocks.map((block) => {
          if (block.id !== blockId) return block
          if (patch.items) {
            if (block.type === 'catalogBand') {
              return {
                ...block,
                title: patch.title ?? block.title,
                catalogRows: patch.items.map((item) => ({
                  title: item.title,
                  icon: item.icon,
                  image: item.image,
                  description: item.description,
                })),
              }
            }
            return {
              ...block,
              title: patch.title ?? block.title,
              items: patch.items.map((item) => contentItemToVisualListItem(item)),
            }
          }
          return {
            ...block,
            title: patch.title ?? block.title,
            content: patch.content ?? block.content,
            richText: patch.richText !== undefined ? patch.richText : block.richText,
            imageLinkUrl:
              'imageLinkUrl' in patch ? patch.imageLinkUrl ?? undefined : block.imageLinkUrl,
            buttonVariant:
              'buttonVariant' in patch ? patch.buttonVariant ?? undefined : block.buttonVariant,
            buttonColor: 'buttonColor' in patch ? patch.buttonColor ?? undefined : block.buttonColor,
            sideImageUrl:
              'blockMediaUrl' in patch
                ? patch.blockMediaUrl?.trim()
                  ? patch.blockMediaUrl.trim()
                  : undefined
                : block.sideImageUrl,
            sideImagePosition:
              'blockMediaPosition' in patch ? patch.blockMediaPosition : block.sideImagePosition,
            sideImageFit: 'blockMediaFit' in patch ? patch.blockMediaFit : block.sideImageFit,
            sideImageWidthPercent:
              'blockMediaWidthPercent' in patch
                ? patch.blockMediaWidthPercent
                : block.sideImageWidthPercent,
            mediaFit: 'mediaFit' in patch ? patch.mediaFit : block.mediaFit,
            styles: {
              ...block.styles,
              textColor: patch.textColor ?? block.styles?.textColor,
              backgroundColor: patch.backgroundColor ?? block.styles?.backgroundColor,
              fontSize: patch.fontSize ?? block.styles?.fontSize,
              fontFamily: patch.fontFamily ?? block.styles?.fontFamily,
              width: patch.blockWidth ?? block.styles?.width,
              height: patch.blockHeight ?? block.styles?.height,
              rowId: patch.rowId ?? block.styles?.rowId,
              align: patch.blockAlign ?? block.styles?.align,
              verticalAlign: patch.blockVerticalAlign ?? block.styles?.verticalAlign,
              marginTop: patch.blockMarginTop ?? block.styles?.marginTop,
              marginBottom: patch.blockMarginBottom ?? block.styles?.marginBottom,
            },
          }
        }),
      }
    })
  }

  return {
    mediaUploadState,
    mediaUploadMessage,
    getBlockById,
    updateBlock,
    updateBlockStyles,
    applyMediaFile,
    removeMedia,
    removeBlockSideImage,
    dropBlockOnBlock,
    insertBlock,
    deleteBlock,
    moveBlockDirection,
    reorderToIndex,
    duplicateBlock,
    patchSectionFromCanvas,
    addBlock,
  }
}
