import { useEffect, useState } from 'react'
import type { Post, PostInteraction } from '@/types/post'
import { useTextSelection } from '@/hooks/useTextSelection'
import { usePostInteractions } from '@/hooks/usePostInteractions'
import { useInteractionDialogs } from '@/hooks/useInteractionDialogs'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useTextMarking } from '@/hooks/useTextMarking'
import { InteractionMenu } from './InteractionMenu'
import { InteractionDialogs } from './InteractionDialogs'
import { InteractionsList } from './InteractionsList'
import { CommentPopover } from './CommentPopover'

interface StructuredMarkdownRendererProps {
  post: Post
}

/**
 * 結構化 Markdown 渲染器 - 重構版
 * 使用多個專門的 hooks 和組件，職責分離
 */
export function StructuredMarkdownRenderer({ post }: StructuredMarkdownRendererProps) {
  // Comment 彈出框狀態
  const [selectedComment, setSelectedComment] = useState<PostInteraction | null>(null)

  // 文字選擇邏輯
  const {
    selectedText,
    selectionPosition,
    showInteractionMenu,
    menuPosition,
    contentRef,
    clearSelection
  } = useTextSelection()

  // 互動功能邏輯
  const {
    interactions,
    addMark,
    addComment,
    addReply
  } = usePostInteractions(post)

  // 文字標記邏輯
  useTextMarking({
    interactions,
    contentRef,
    onCommentClick: setSelectedComment
  })

  // 對話框狀態管理
  const {
    showCommentDialog,
    commentText,
    setCommentText,
    openCommentDialog,
    closeCommentDialog,
    showReplyDialog,
    replyText,
    setReplyText,
    openReplyDialog,
    closeReplyDialog
  } = useInteractionDialogs()

  // 處理標記
  const handleMark = () => {
    if (selectedText && selectionPosition) {
      addMark(post.id, selectedText, selectionPosition)
      clearSelection()
    }
  }

  // 處理評論
  const handleComment = () => {
    openCommentDialog()
  }

  // 提交評論
  const handleCommentSubmit = () => {
    if (selectedText && selectionPosition && commentText.trim()) {
      addComment(post.id, selectedText, commentText, selectionPosition)
      closeCommentDialog()
      clearSelection()
    }
  }

  // 提交回覆
  const handleReplySubmit = () => {
    if (replyText.trim()) {
      addReply(post.id, replyText)
      closeReplyDialog()
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
      elements?.forEach((element, index) => {
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

      {/* 回覆按鈕 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={openReplyDialog}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          💬 回覆文章
        </button>
      </div>

      {/* 互動記錄 */}
      <InteractionsList interactions={interactions} postId={post.id} />

      {/* 互動選單 */}
      <InteractionMenu
        show={showInteractionMenu}
        position={menuPosition}
        onMark={handleMark}
        onComment={handleComment}
      />

      {/* 對話框 */}
      <InteractionDialogs
        showCommentDialog={showCommentDialog}
        commentText={commentText}
        selectedText={selectedText}
        onCommentTextChange={setCommentText}
        onCommentSubmit={handleCommentSubmit}
        onCommentCancel={closeCommentDialog}
        showReplyDialog={showReplyDialog}
        replyText={replyText}
        onReplyTextChange={setReplyText}
        onReplySubmit={handleReplySubmit}
        onReplyCancel={closeReplyDialog}
      />

      {/* Comment 彈出框 */}
      <CommentPopover
        interaction={selectedComment}
        onClose={() => setSelectedComment(null)}
      />
    </div>
  )
} 