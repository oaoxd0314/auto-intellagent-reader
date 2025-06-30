import { useEffect, useRef, useCallback, RefObject } from 'react'
import type { Post } from '../types/post'
import { useSelectionSection } from '../hooks/useSelectionSection'
import { useMarkSection } from '../hooks/useMarkSection'
import { useCommentSection } from '../hooks/useCommentSection'
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
  const containerRef = useRef<HTMLDivElement>(null)

  // 使用 selection、highlight 和 comment hooks
  const selection = useSelectionSection(containerRef as RefObject<HTMLDivElement>)
  const markSection = useMarkSection(post.id)
  const commentSection = useCommentSection(post.id, containerRef)

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

  // 處理評論操作
  const handleComment = useCallback(async (content: string) => {
    if (!selection.isValidSelection || !selection.sectionId || !selection.selectedText) {
      return
    }

    try {
      await commentSection.addComment(selection.sectionId, selection.selectedText, content)
      
      // 通知父組件
      onTextSelect?.(selection.selectedText, selection.sectionId)
      
      // 清除選擇
      selection.clearSelection()
    } catch (error) {
      // 靜默處理錯誤
      console.error('添加評論失敗:', error)
    }
  }, [selection, commentSection, onTextSelect])

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
      commentSection.allComments.forEach(comment => {
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
            mark.className = 'bg-yellow-200 px-1 rounded'
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
  }, [post.id, markSection.highlights, commentSection.allComments, enableSelection, enableHighlight])



  // 添加段落點擊事件監聽器
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('click', commentSection.handleCommentClick)
    return () => container.removeEventListener('click', commentSection.handleCommentClick)
  }, [commentSection.handleCommentClick])

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
          isVisible={selection.isSelectionActive && selection.isValidSelection}
          position={selection.selectionPosition}
          selectedText={selection.selectedText}
          onHighlight={handleHighlight}
          onComment={handleComment}
          onClose={selection.clearSelection}
          isHighlighting={markSection.isSubmitting}
          isCommenting={commentSection.isSubmitting}
        />
      )}

      {/* 高亮統計顯示（可選） */}
      {enableHighlight && markSection.highlightStats.hasHighlights && (
        <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-bl-md">
          {markSection.highlightStats.total} 個高亮片段
        </div>
      )}

      {/* 評論 Popover */}
      {commentSection.popover.isVisible && commentSection.popover.position && commentSection.popover.comments.length > 0 && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0 z-40"
            onClick={commentSection.hideCommentPopover}
          />
          
          {/* 簡化的評論顯示 */}
          <div
            className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
            style={{
              left: Math.max(10, commentSection.popover.position.x - 160), // 水平居中，但不超出邊界
              top: commentSection.popover.position.y - 10   // 稍微上移
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-gray-900 mb-3">
              評論 ({commentSection.popover.comments.length})
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {commentSection.popover.comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                  <div className="text-sm text-gray-900 mb-1">{comment.content}</div>
                  
                  {comment.selectedText && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 mb-1 italic">
                      "{comment.selectedText.length > 40 ? comment.selectedText.slice(0, 40) + '...' : comment.selectedText}"
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {new Date(comment.timestamp).toLocaleString('zh-TW')}
                    </div>
                    <button
                      onClick={() => commentSection.deleteComment(comment.id)}
                      disabled={commentSection.deletingIds.has(comment.id)}
                      className="text-xs text-red-500 hover:text-red-700 disabled:text-red-300 disabled:cursor-not-allowed"
                    >
                      {commentSection.deletingIds.has(comment.id) ? '刪除中...' : '刪除'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}