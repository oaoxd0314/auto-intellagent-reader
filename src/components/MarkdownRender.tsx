import { useEffect, useRef, useCallback } from 'react'
import type { Post } from '../types/post'
import { useSelectionSection } from '../hooks/useSelectionSection'
import { useMarkSection } from '../hooks/useMarkSection'
import { SelectionPopover } from './SelectionPopover'

interface StructuredMarkdownRendererProps {
  post: Post
  // 互動功能開關
  enableSelection?: boolean
  enableHighlight?: boolean
  // 事件回調
  onTextSelect?: (selectedText: string, sectionId: string) => void
  onHighlightAdded?: (highlightId: string) => void
}

/**
 * 結構化 Markdown 渲染器 - 整合文字選擇和高亮功能
 * 支援 Medium 風格的文字選擇和高亮互動
 */
export function StructuredMarkdownRenderer({ 
  post,
  enableSelection = true,
  enableHighlight = true,
  onTextSelect,
  onHighlightAdded
}: StructuredMarkdownRendererProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)

  // 使用 selection 和 highlight hooks
  const selection = useSelectionSection()
  const markSection = useMarkSection(post.id)

  // 處理高亮操作
  const handleHighlight = useCallback(async () => {
    if (!selection.isValidSelection || !selection.sectionId || !selection.selectedText) {
      return
    }

    try {
      // 檢查是否已經高亮過相同文字
      if (markSection.isTextHighlighted(selection.sectionId, selection.selectedText)) {
        return
      }

      await markSection.addHighlight(selection.sectionId, selection.selectedText)
      
      // 通知父組件
      onHighlightAdded?.(selection.sectionId)
      onTextSelect?.(selection.selectedText, selection.sectionId)
      
      // 清除選擇
      selection.clearSelection()
    } catch (error) {
      // 靜默處理錯誤
    }
  }, [selection, markSection, onHighlightAdded, onTextSelect])

  // 處理評論操作（暫時只是 placeholder）
  const handleComment = useCallback(() => {
    if (!selection.isValidSelection || !selection.sectionId || !selection.selectedText) {
      return
    }

    // TODO: 實作評論功能
    
    onTextSelect?.(selection.selectedText, selection.sectionId)
    selection.clearSelection()
  }, [selection, onTextSelect])

  // 為段落添加 ID 和精確高亮
  useEffect(() => {
    if (!contentRef.current) return
    
    const addIdsAndHighlights = () => {
      // 更精確的選擇器，只選擇內容元素，避免容器元素
      const elements = contentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6, p, blockquote, pre, ul, ol, li')
      elements?.forEach((element: Element, index: number) => {
        // 跳過空元素或只有空白的元素
        const textContent = element.textContent?.trim() || ''
        if (!textContent || textContent.length < 5) {
          return
        }

        // 跳過已經是其他元素子元素的 li（避免重複選擇）
        if (element.tagName.toLowerCase() === 'li' && element.closest('li') !== element) {
          return
        }

        // 添加 section ID
        if (!element.id) {
          const hash = textContent.slice(0, 30).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
          element.id = `section-${hash}-${element.tagName.toLowerCase()}-${index}`
        }

        // 添加選擇標記
        if (enableSelection) {
          element.setAttribute('data-selection-trigger', 'true')
        }
      })

      // 處理精確的文字高亮
      if (enableHighlight) {
        applyTextHighlights()
      }
    }

    // 應用精確的文字高亮
    const applyTextHighlights = () => {
      if (!contentRef.current) return

      // 清除所有現有的高亮標記
      contentRef.current.querySelectorAll('mark[data-highlight-id]').forEach(mark => {
        const parent = mark.parentNode
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent || ''), mark)
          parent.normalize() // 合併相鄰的文字節點
        }
      })

      // 應用新的高亮
      markSection.highlights.forEach(highlight => {
        const sectionElement = contentRef.current?.querySelector(`#${highlight.position?.sectionId}`)
        if (sectionElement && highlight.selectedText) {
          highlightTextInElement(sectionElement, highlight.selectedText, highlight.id)
        }
      })
    }

    // 在指定元素中高亮特定文字
    const highlightTextInElement = (element: Element, searchText: string, highlightId: string) => {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      )

      const textNodes: Text[] = []
      let node: Node | null
      while ((node = walker.nextNode())) {
        textNodes.push(node as Text)
      }

      textNodes.forEach(textNode => {
        const content = textNode.textContent || ''
        const index = content.indexOf(searchText)
        
        if (index !== -1) {
          const beforeText = content.substring(0, index)
          const highlightText = content.substring(index, index + searchText.length)
          const afterText = content.substring(index + searchText.length)

          const fragment = document.createDocumentFragment()
          
          if (beforeText) {
            fragment.appendChild(document.createTextNode(beforeText))
          }

          const mark = document.createElement('mark')
          mark.className = 'bg-yellow-200 px-1 rounded'
          mark.setAttribute('data-highlight-id', highlightId)
          mark.textContent = highlightText
          fragment.appendChild(mark)

          if (afterText) {
            fragment.appendChild(document.createTextNode(afterText))
          }

          textNode.parentNode?.replaceChild(fragment, textNode)
        }
      })
    }
    
    const timer = setTimeout(addIdsAndHighlights, 100)
    return () => clearTimeout(timer)
  }, [post.id, markSection.highlights, enableSelection, enableHighlight])

  return (
    <div className="relative">
      {/* 文章內容 */}
      <div 
        ref={contentRef}
        className="prose prose-lg max-w-none select-text relative"
        style={{ userSelect: enableSelection ? 'text' : 'none' }}
      >
        {/* 文章內容 */}
        {post.component ? (
          <post.component />
        ) : (
          <div className="text-gray-500">
            <p>文章內容載入失敗</p>
          </div>
        )}
      </div>

      {/* 文字選擇 Popover */}
      {enableSelection && (
        <SelectionPopover
          isVisible={selection.isSelectionActive && selection.isValidSelection}
          position={selection.selectionPosition}
          selectedText={selection.selectedText}
          onHighlight={handleHighlight}
          onComment={handleComment}
          onClose={selection.clearSelection}
          isHighlighting={markSection.isSubmitting}
          isCommenting={false} // TODO: 實作評論功能後更新
        />
      )}

      {/* 高亮統計顯示（可選） */}
      {enableHighlight && markSection.highlightStats.hasHighlights && (
        <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-bl-md">
          {markSection.highlightStats.total} 個高亮片段
        </div>
      )}
    </div>
  )
} 