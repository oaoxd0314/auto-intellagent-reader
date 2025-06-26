import { useEffect } from 'react'
import type { Post, PostInteraction, TextPosition } from '../../../../../../types/post'
import { useTextSelection } from '../../hooks/useTextSelection'
import { useTextMarking } from '../../hooks/useTextMarking'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { InteractionMenu } from './InteractionMenu'
import { InteractionDialogs } from './InteractionDialogs'

interface StructuredMarkdownRendererProps {
  post: Post
  onCommentClick: (interaction: PostInteraction) => void
  onHighlightClick: (interaction: PostInteraction) => void
  onMark: (postId: string, text: string, position: TextPosition) => void
  onComment: () => void
  commentText: string
  onCommentTextChange: (text: string) => void
  onCommentSubmit: (selectedText: string, position: TextPosition) => void
  onCommentCancel: () => void
  showCommentDialog: boolean
  interactions: PostInteraction[]
}

/**
 * 結構化 Markdown 渲染器 - 專注於渲染
 * 只負責 markdown 內容渲染和文字選擇交互
 */
export function StructuredMarkdownRenderer({ 
  post, 
  onCommentClick,
  onHighlightClick,
  onMark,
  onComment,
  commentText,
  onCommentTextChange,
  onCommentSubmit,
  onCommentCancel,
  showCommentDialog,
  interactions
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
    onCommentClick,
    onHighlightClick
  })

  // 處理標記
  const handleMark = () => {
    if (selectedText && selectionPosition) {
      onMark(post.id, selectedText, selectionPosition)
      clearSelection()
    }
  }

  // 處理評論
  const handleComment = () => {
    onComment()
  }

  // 提交評論
  const handleCommentSubmit = () => {
    if (selectedText && selectionPosition && commentText.trim()) {
      onCommentSubmit(selectedText, selectionPosition)
      clearSelection()
    }
  }

  // 快捷鍵支援
  useKeyboardShortcuts({
    selectedText,
    showInteractionMenu,
    onMark: handleMark,
    onComment: handleComment,
    onClear: clearSelection
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

      {/* 互動選單 */}
      <InteractionMenu
        show={showInteractionMenu}
        position={menuPosition}
        onMark={handleMark}
        onComment={handleComment}
      />

      {/* 評論對話框 */}
      <InteractionDialogs
        showCommentDialog={showCommentDialog}
        commentText={commentText}
        selectedText={selectedText || ''}
        onCommentTextChange={onCommentTextChange}
        onCommentSubmit={handleCommentSubmit}
        onCommentCancel={onCommentCancel}
        showReplyDialog={false}
        replyText=""
        onReplyTextChange={() => {}}
        onReplySubmit={() => {}}
        onReplyCancel={() => {}}
      />
    </div>
  )
} 