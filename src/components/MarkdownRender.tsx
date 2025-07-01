import { useEffect, useRef, RefObject, useState } from 'react'
import type { Post, PostInteraction } from '@/types/post'
import { useSelectionSection } from '@/hooks/useSelectionSection'
import { useMarkSection } from '@/hooks/useMarkSection'
import { useCommentSection } from '@/hooks/useCommentSection'
import { SelectionPopover } from '@/components/SelectionPopover'
import { CommentPopover } from '@/components/CommentPopover'
import { HighlightPopover } from '@/components/HighlightPopover'

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
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    isValidSelection,
    sectionId,
    selectedText,
    selectionPosition,
    isSelectionActive,
    clearSelection,
  } = useSelectionSection(containerRef as RefObject<HTMLDivElement>)
  const markSection = useMarkSection(post.id)
  const {
    addComment,
    deleteComment,
    allComments,
    isSubmitting,
    hideCommentPopover,
    handleCommentClick,
    popover,
  } = useCommentSection(post.id, containerRef)

  // 高亮 Popover 狀態
  const [highlightPopover, setHighlightPopover] = useState<{
    isVisible: boolean
    position: { x: number, y: number } | null
    highlight: PostInteraction | null
  }>({
    isVisible: false,
    position: null,
    highlight: null
  })

  // 處理高亮操作 - React 19 Compiler 自動優化
  const handleHighlight = async () => {
    if (!isValidSelection || !sectionId || !selectedText) return

    try {
      // 檢查是否已經高亮過相同文字
      if (markSection.isTextHighlighted(sectionId, selectedText)) return

      await markSection.addHighlight(sectionId, selectedText)
      
      // 通知父組件
      onHighlightAdded?.(sectionId)
      onTextSelect?.(selectedText, sectionId)
      
      // 清除選擇
      clearSelection()
    } catch (error) {
      // 靜默處理錯誤
    }
  }

  // 處理評論操作 - React 19 Compiler 自動優化
  const handleComment = async (content: string) => {
    if (!isValidSelection || !sectionId || !selectedText) return

    try {
      await addComment(sectionId, selectedText, content)
      
      // 通知父組件
      onTextSelect?.(selectedText, sectionId)
      
      // 清除選擇
      clearSelection()
    } catch (error) {
      // 靜默處理錯誤
      console.error('添加評論失敗:', error)
    }
  }

  // 顯示高亮 Popover
  const showHighlightPopover = (highlightElement: HTMLElement, highlight: PostInteraction) => {
    if (!containerRef?.current) return

    // 計算 Popover 位置 - 相對於 container，與其他 popover 一致
    const rect = highlightElement.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()
    const offsetY = 8

    const position = {
      x: rect.left - containerRect.left + rect.width / 2,  // 元素中心點相對於 container 的 X 座標
      y: rect.top - containerRect.top - offsetY            // 元素頂部相對於 container 的 Y 座標
    }

    setHighlightPopover({
      isVisible: true,
      position,
      highlight
    })
  }

  // 隱藏高亮 Popover
  const hideHighlightPopover = () => {
    setHighlightPopover({
      isVisible: false,
      position: null,
      highlight: null
    })
  }

  // 處理高亮點擊事件
  const handleHighlightClick = (event: MouseEvent) => {
    const target = event.target as Element
    const highlightElement = target.closest('[data-highlight-id]') as HTMLElement
    
    if (!highlightElement) return

    const highlightId = highlightElement.getAttribute('data-highlight-id')
    if (!highlightId) return

    // 找到對應的高亮記錄
    const highlight = markSection.highlights.find(h => h.id === highlightId)
    if (!highlight) return

    showHighlightPopover(highlightElement, highlight)
  }

  // 刪除高亮
  const deleteHighlight = async (highlightId: string) => {
    try {
      await markSection.removeHighlight(highlightId)
      hideHighlightPopover()
    } catch (error) {
      console.error('刪除高亮失敗:', error)
    }
  }

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

      // 處理精確的文字高亮和評論高亮
      if (enableHighlight) {
        applyTextHighlights()
      }
      applyCommentHighlights()
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
          highlightTextInElement(sectionElement, highlight.selectedText, highlight.id, 'highlight')
        }
      })
    }

    // 應用評論文字高亮
    const applyCommentHighlights = () => {
      if (!contentRef.current) return

      // 清除所有現有的評論高亮標記
      contentRef.current.querySelectorAll('mark[data-comment-id]').forEach(mark => {
        const parent = mark.parentNode
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent || ''), mark)
          parent.normalize() // 合併相鄰的文字節點
        }
      })

      // 應用評論高亮
      allComments.forEach(comment => {
        const sectionElement = contentRef.current?.querySelector(`#${comment.position?.sectionId}`)
        if (sectionElement && comment.selectedText) {
          highlightTextInElement(sectionElement, comment.selectedText, comment.id, 'comment')
        }
      })
    }

    // 在指定元素中高亮特定文字
    const highlightTextInElement = (element: Element, searchText: string, id: string, type: 'highlight' | 'comment' = 'highlight') => {
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
          
          // 根據類型設置不同的樣式和屬性
          if (type === 'highlight') {
            mark.className = 'bg-yellow-200 px-1 rounded cursor-pointer'
            mark.setAttribute('data-highlight-id', id)
          } else if (type === 'comment') {
            mark.className = 'bg-blue-100 border-b-2 border-blue-300 px-1 rounded cursor-pointer hover:bg-blue-200'
            mark.setAttribute('data-comment-id', id)
            mark.setAttribute('data-comment-trigger', 'true')
            mark.title = '點擊查看評論'
          }
          
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
  }, [post.id, markSection.highlights, allComments, enableSelection, enableHighlight])

  // 添加段落點擊事件監聽器
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('click', handleCommentClick)
    container.addEventListener('click', handleHighlightClick)
    
    return () => {
      container.removeEventListener('click', handleCommentClick)
      container.removeEventListener('click', handleHighlightClick)
    }
  }, [handleCommentClick])

  return (
    <div className="relative" ref={containerRef}>
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
          isVisible={isSelectionActive && isValidSelection}
          position={selectionPosition}
          selectedText={selectedText}
          onHighlight={handleHighlight}
          onComment={handleComment}
          onClose={clearSelection}
          isHighlighting={markSection.isSubmitting}
          isCommenting={isSubmitting}
        />
      )}

      {/* 評論 Popover */}
      <CommentPopover 
        isVisible={popover.isVisible && !!popover.position && popover.comments.length > 0}
        position={popover.position}
        comments={popover.comments}
        onClose={hideCommentPopover}
        onDeleteComment={deleteComment}
        isDeleting={isSubmitting}
      />

      {/* 高亮 Popover */}
      <HighlightPopover 
        isVisible={highlightPopover.isVisible && !!highlightPopover.position && !!highlightPopover.highlight}
        position={highlightPopover.position}
        highlight={highlightPopover.highlight}
        onClose={hideHighlightPopover}
        onDeleteHighlight={deleteHighlight}
        isDeleting={markSection.isSubmitting}
      />
    </div>
  )
}