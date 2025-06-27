import { useEffect } from 'react'
import type { Post, PostInteraction, TextPosition } from '../../../../../../types/post'
import { useTextSelection } from '../../hooks/useTextSelection'
import { useTextMarking } from '../../hooks/useTextMarking'

interface StructuredMarkdownRendererProps {
  post: Post
  interactions: PostInteraction[]
  onMenuTarget: (element: HTMLElement, selectedText: string, position: TextPosition) => void
  onCommentTarget: (element: HTMLElement, interaction: PostInteraction) => void
  onHighlightTarget: (element: HTMLElement, interaction: PostInteraction) => void
}

/**
 * 結構化 Markdown 渲染器 - 專注於渲染
 * 只負責 markdown 內容渲染和文字選擇交互
 */
export function StructuredMarkdownRenderer({ 
  post, 
  interactions,
  onMenuTarget,
  onCommentTarget,
  onHighlightTarget
}: StructuredMarkdownRendererProps) {
  // 文字選擇邏輯
  const {
    selectedText,
    selectionPosition,
    showInteractionMenu,
    menuPosition,
    contentRef,
    clearSelection
  } = useTextSelection()

  // 文字標記邏輯
  useTextMarking({
    interactions,
    contentRef,
    onCommentClick: (interaction) => {
      const icon = document.querySelector(`.comment-icon[data-interaction-id="${interaction.id}"]`)
      if (icon) {
        onCommentTarget(icon as HTMLElement, interaction)
      }
    },
    onHighlightClick: (interaction) => {
      const highlight = document.querySelector(`[data-interaction-id="${interaction.id}"].text-highlight`)
      if (highlight) {
        onHighlightTarget(highlight as HTMLElement, interaction)
      }
    }
  })

  // 處理文字選擇顯示選單
  useEffect(() => {
    if (showInteractionMenu && menuPosition && selectedText && selectionPosition) {
      // 創建一個虛擬元素來表示選擇位置
      const virtualElement = {
        getBoundingClientRect: () => ({
          left: menuPosition.left,
          top: menuPosition.top,
          right: menuPosition.left,
          bottom: menuPosition.top,
          width: 0,
          height: 0
        })
      }
      onMenuTarget(virtualElement as HTMLElement, selectedText, selectionPosition)
    }
  }, [showInteractionMenu, menuPosition, selectedText, selectionPosition, onMenuTarget])

  // 處理標記和評論現在由 parent 組件處理

  // 為段落添加 ID
  useEffect(() => {
    if (!contentRef.current) return
    
    const addIdsToElements = () => {
      const elements = contentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div.prose > div, section, article')
      elements?.forEach((element: Element, index: number) => {
        if (!element.id) {
          const textContent = element.textContent || ''
          const hash = textContent.slice(0, 30).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
          element.id = `section-${hash}-${element.tagName.toLowerCase()}-${index}`
        }
      })
    }
    
    const timer = setTimeout(addIdsToElements, 100)
    return () => clearTimeout(timer)
  }, [post.id])

  return (
    <div className="relative">
      {/* 文章內容 */}
      <div 
        ref={contentRef}
        className="prose prose-lg max-w-none select-text relative"
        style={{ userSelect: 'text' }}
      >
        {/* 文字標記會通過 useTextMarking hook 直接應用到 DOM */}
        
        {/* 文章內容 */}
        {post.component ? (
          <post.component />
        ) : (
          <div className="text-gray-500">
            <p>文章內容載入失敗</p>
          </div>
        )}
      </div>


    </div>
  )
} 