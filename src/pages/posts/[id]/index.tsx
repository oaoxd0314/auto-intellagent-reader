import { useParams, Link, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { usePostDetail, usePostInteractions } from '../../../hooks/usePostPage'
import type { PostInteraction } from '../../../types/post'
import { StructuredMarkdownRenderer } from '../../../components/markdownRender/StructuredMarkdownRenderer'
import { ReplyList } from '../../../components/markdownRender/InteractionsList'
import { InteractionDialogs } from '../../../components/markdownRender/InteractionDialogs'
import { CommentPopover } from '../../../components/markdownRender/CommentPopover'
import { HighlightPopover } from '../../../components/markdownRender/HighlightPopover'
import { usePopover } from '../../../hooks/usePopover'
import { TextSelectionProvider } from '../../../contexts/TextSelectionContext'
import { useTextSelection } from '../../../hooks/useTextSelection'
import { useTextSelectionContext } from '../../../contexts/TextSelectionContext'

function PostDetailContent() {
  const { id } = useParams<{ id: string }>()
  
  // 只與 Hook 交互 - 符合架構設計
  const {
    // 數據狀態
    post,
    recommendedPosts,
    interactions,
    interactionStats,
    replies,
    
    // UI 狀態
    isLoading,
    isRefreshing,
    error,
    
    // 操作方法
    refreshPost,
    clearError,
    addMark,
    addComment,
    addReply,
    removeInteraction
  } = usePostDetail(id || '')

  // 對話框狀態
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyText, setReplyText] = useState('')
  
  // 保存評論相關的選擇狀態
  const [savedSelectedText, setSavedSelectedText] = useState('')
  const [savedSelectedPosition, setSavedSelectedPosition] = useState<any>(null)
  
  // 對話框操作
  const openCommentDialog = () => {
    console.log('打開評論對話框')
    setShowCommentDialog(true)
  }
  const closeCommentDialog = () => {
    setShowCommentDialog(false)
    setCommentText('')
    setSavedSelectedText('')
    setSavedSelectedPosition(null)
  }
  const openReplyDialog = () => setShowReplyDialog(true)
  const closeReplyDialog = () => {
    setShowReplyDialog(false)
    setReplyText('')
  }
  
  // 驗證
  const canSubmitComment = commentText.trim().length >= 3
  const canSubmitReply = replyText.trim().length >= 3

  // 統一的 popover 管理
  const {
    commentState,
    highlightState,
    showCommentPopover,
    showHighlightPopover,
    closePopover
  } = usePopover()
  
  // 文字選擇狀態 (目前未使用，但保留 context 連接)
  useTextSelectionContext()
  
  // 處理標記操作
  const handleMarkAction = (selectedText: string, selectedPosition: any) => {
    addMark(selectedText, selectedPosition)
  }

  // 處理評論操作
  const handleCommentAction = (selectedText: string, selectedPosition: any) => {
    console.log('評論操作被觸發:', { selectedText, selectedPosition })
    // 保存選擇的文字和位置
    setSavedSelectedText(selectedText)
    setSavedSelectedPosition(selectedPosition)
    openCommentDialog()
  }

  // 文字選擇管理
  const { contentRef, handleMark: handleMarkClick, handleComment: handleCommentClick } = useTextSelection({
    onMark: handleMarkAction,
    onComment: handleCommentAction
  })

  // 提交評論
  const handleCommentSubmit = () => {
    if (!canSubmitComment || !savedSelectedText || !savedSelectedPosition) return
    
    addComment(savedSelectedText, commentText, savedSelectedPosition)
    closeCommentDialog()
  }

  // 提交回覆
  const handleReplySubmit = () => {
    if (!canSubmitReply) return
    
    addReply(replyText)
    closeReplyDialog()
  }

  // 刪除回覆
  const handleRemoveReply = (replyId: string) => {
    if (window.confirm('確定要刪除這則回覆嗎？')) {
      removeInteraction(replyId)
    }
  }
  
  if (!id) {
    return <Navigate to="/posts" replace />
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>載入中...</p>
        </div>
      </div>
    )
  }
  
  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">文章不存在</h1>
          <p className="text-gray-600 mb-6">
            {error ? `載入錯誤: ${error}` : '抱歉，找不到您要查看的文章。'}
          </p>
          <div className="space-x-4">
            <Link 
              to="/posts"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回文章列表
            </Link>
            {error && (
              <button
                onClick={clearError}
                className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                清除錯誤
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 處理 popover 目標設置
  const handleCommentTarget = (_element: HTMLElement | null, interaction: PostInteraction) => {
    showCommentPopover(interaction)
  }

  const handleHighlightTarget = (_element: HTMLElement | null, interaction: PostInteraction) => {
    showHighlightPopover(interaction)
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* 返回按鈕和操作欄 */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          to="/posts"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回文章列表
        </Link> 
      </div>

      {/* 文章標題和元數據 */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
          <div>發布日期: {post.date}</div>
          {post.author && <div>作者: {post.author}</div>}
          <div>互動數: {interactionStats.totalInteractions}</div>
        </div>
        
        {/* 標籤 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span 
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

      </header>

      {/* 文章內容區域 */}
      <div className="prose prose-lg max-w-none mb-8">
        <div 
          ref={contentRef}
        >
          <StructuredMarkdownRenderer 
            post={post}
            interactions={interactions}
            onCommentTarget={handleCommentTarget}
            onHighlightTarget={handleHighlightTarget}
            onMark={handleMarkClick}
            onComment={handleCommentClick}
          />
        </div>

      </div>

      {/* 回覆區域 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">討論區</h3>
          <button
            onClick={openReplyDialog}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            新增回覆
          </button>
        </div>
        
        <ReplyList 
          interactions={replies}
          onRemoveReply={handleRemoveReply}
        />
      </div>
      
      {/* 推薦文章 */}
      {recommendedPosts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">推薦文章</h3>
          <div className="space-y-3">
            {recommendedPosts.map(recommendedPost => (
              <Link
                key={recommendedPost.id}
                to={`/posts/${recommendedPost.id}`}
                className="block p-3 border rounded hover:bg-gray-50 transition-colors"
              >
                <h4 className="font-medium text-gray-900 mb-1">
                  {recommendedPost.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {recommendedPost.date}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* Popovers */}
      {commentState.isActive && commentState.data && (
        <CommentPopover
          interaction={commentState.data.interaction}
          position={commentState.data.position}
          show={true}
          onClose={closePopover}
        />
      )}
      
      {highlightState.isActive && highlightState.data && (
        <HighlightPopover
          interaction={highlightState.data.interaction}
          position={highlightState.data.position}
          show={true}
          onClose={closePopover}
          onRemove={removeInteraction}
        />
      )}
      
      {/* 對話框 */}
      <InteractionDialogs
        showCommentDialog={showCommentDialog}
        commentText={commentText}
        selectedText={savedSelectedText}
        onCommentTextChange={setCommentText}
        onCommentSubmit={handleCommentSubmit}
        onCommentCancel={closeCommentDialog}
        
        showReplyDialog={showReplyDialog}
        replyText={replyText}
        onReplyTextChange={setReplyText}
        onReplySubmit={handleReplySubmit}
        onReplyCancel={closeReplyDialog}
      />
    </div>
  )
}

export default function PostDetail() {
  return (
    <TextSelectionProvider>
      <PostDetailContent />
    </TextSelectionProvider>
  )
} 