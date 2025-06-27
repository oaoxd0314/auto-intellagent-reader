import { useEffect, useRef } from 'react'
import type { Post, PostInteraction } from '../../../../../../types/post'
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

  // 文字標記邏輯
  useTextMarking({
    interactions,
    contentRef,
    onCommentClick: (interaction) => {
      // 直接使用 interaction，不需要複雜的元素查找
      onCommentTarget(null as any, interaction) // 傳 null 因為新 API 不需要 element
    },
    onHighlightClick: (interaction) => {
      // 直接使用 interaction，不需要複雜的元素查找
      onHighlightTarget(null as any, interaction) // 傳 null 因為新 API 不需要 element
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