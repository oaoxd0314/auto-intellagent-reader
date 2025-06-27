import { useEffect, useRef } from 'react'
import type { Post, PostInteraction } from '../../../../../../types/post'
import { useTextSelectionContext } from '../../contexts/TextSelectionContext'
import { useTextMarking } from '../../hooks/useTextMarking'
import { InteractionMenu } from './InteractionMenu'

interface StructuredMarkdownRendererProps {
  post: Post
  interactions: PostInteraction[]
  onCommentTarget: (element: HTMLElement, interaction: PostInteraction) => void
  onHighlightTarget: (element: HTMLElement, interaction: PostInteraction) => void
  onMark: () => void
  onComment: () => void
}

/**
 * 結構化 Markdown 渲染器 - 專注於渲染
 * 只負責 markdown 內容渲染和互動標記顯示
 */
export function StructuredMarkdownRenderer({ 
  post, 
  interactions,
  onCommentTarget,
  onHighlightTarget,
  onMark,
  onComment
}: StructuredMarkdownRendererProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const selectionContext = useTextSelectionContext()

  // 文字標記邏輯
  useTextMarking({
    interactions,
    contentRef,
    onCommentClick: (interaction) => {
      // 對於評論，我們希望 popover 出現在相關的文字標記附近，而不是評論圖標
      // 先嘗試找到對應的 highlight 元素
      const highlights = document.querySelectorAll(`[data-interaction-id="${interaction.id}"].text-highlight`)
      
      if (highlights.length > 0) {
        // 找到最上方的 highlight 元素作為 target
        let topMostElement = highlights[0] as HTMLElement
        let minTop = topMostElement.getBoundingClientRect().top
        
        for (let i = 1; i < highlights.length; i++) {
          const element = highlights[i] as HTMLElement
          const rect = element.getBoundingClientRect()
          if (rect.top < minTop) {
            minTop = rect.top
            topMostElement = element
          }
        }
        
        onCommentTarget(topMostElement, interaction)
        return
      }
      
      // 如果沒有找到 highlight，回退到使用評論圖標
      const icon = document.querySelector(`.comment-icon[data-interaction-id="${interaction.id}"]`)
      if (icon) {
        onCommentTarget(icon as HTMLElement, interaction)
      }
    },
    onHighlightClick: (interaction) => {
      // 找到所有匹配的 highlight 元素
      const highlights = document.querySelectorAll(`[data-interaction-id="${interaction.id}"].text-highlight`)
      
      if (highlights.length === 0) return
      
      // 如果只有一個元素，直接使用
      if (highlights.length === 1) {
        onHighlightTarget(highlights[0] as HTMLElement, interaction)
        return
      }
      
      // 如果有多個元素，找到最上方的那個
      let topMostElement = highlights[0] as HTMLElement
      let minTop = topMostElement.getBoundingClientRect().top
      
      for (let i = 1; i < highlights.length; i++) {
        const element = highlights[i] as HTMLElement
        const rect = element.getBoundingClientRect()
        if (rect.top < minTop) {
          minTop = rect.top
          topMostElement = element
        }
      }
      
      onHighlightTarget(topMostElement, interaction)
    }
  })

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

      {/* 互動選單 - 由 TextSelectionContext 管理 */}
      <InteractionMenu
        onMark={onMark}
        onComment={onComment}
      />
    </div>
  )
} 