import { useParams, Link, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { usePost } from '../../../contexts/PostContext'
import type { TextPosition, PostInteraction } from '../../../types/post'
import { StructuredMarkdownRenderer } from './_content/components/markdownRender/StructuredMarkdownRenderer'
import { usePostInteractions } from './_content/hooks/usePostInteractions'
import { useInteractionDialogs } from './_content/hooks/useInteractionDialogs'
import { ReplyList } from './_content/components/markdownRender/InteractionsList'
import { InteractionDialogs } from './_content/components/markdownRender/InteractionDialogs'
import { CommentPopover } from './_content/components/markdownRender/CommentPopover'
import { HighlightPopover } from './_content/components/markdownRender/HighlightPopover'
import { usePopover } from './_content/hooks/usePopover'
import { TextSelectionProvider } from './_content/contexts/TextSelectionContext'
import { useTextSelection } from './_content/hooks/useTextSelection'

function PostDetailContent() {
  const { id } = useParams<{ id: string }>()
  const { 
    usePostQuery, 
    setCurrentPost, 
    getRecommendedPosts, 
    posts 
  } = usePost()
  
  // 使用 TanStack Query 獲取文章數據
  const { post, isLoading, error } = usePostQuery(id || '')
  
  // 互動功能邏輯
  const {
    interactions,
    replies,
    addMark,
    addComment,
    addReply,
    removeReply,
    removeInteraction
  } = usePostInteractions(post)

  // 對話框狀態管理
  const {
    showCommentDialog,
    commentText,
    setCommentText,
    openCommentDialog,
    closeCommentDialog,
    selectedTextForComment,
    selectedPositionForComment,
    showReplyDialog,
    replyText,
    setReplyText,
    openReplyDialog,
    closeReplyDialog
  } = useInteractionDialogs()

  // 統一的 popover 管理
  const {
    commentState,
    highlightState,
    showCommentPopover,
    showHighlightPopover,
    closePopover
  } = usePopover()
  
  useEffect(() => {
    if (post) {
      setCurrentPost(post)
    }
  }, [post, setCurrentPost])
  
  // 處理標記
  const handleMarkAction = (selectedText: string, selectedPosition: TextPosition) => {
    if (!post) return
    addMark(post.id, selectedText, selectedPosition)
  }

  // 處理評論
  const handleCommentAction = (selectedText: string, selectedPosition: TextPosition) => {
    if (!post) return
    openCommentDialog(selectedText, selectedPosition)
  }

  // 文字選擇管理
  const { contentRef, handleMark, handleComment } = useTextSelection({
    onMark: handleMarkAction,
    onComment: handleCommentAction
  })

  // 提交評論
  const handleCommentSubmit = () => {
    if (!commentText.trim() || !selectedTextForComment || !selectedPositionForComment || !post) return
    
    addComment(post.id, selectedTextForComment, commentText, selectedPositionForComment)
    closeCommentDialog()
  }

  // 提交回覆
  const handleReplySubmit = () => {
    if (!replyText.trim() || !post) return
    
    addReply(post.id, replyText)
    closeReplyDialog()
  }

  // 刪除回覆
  const handleRemoveReply = (replyId: string) => {
    if (window.confirm('確定要刪除這則回覆嗎？')) {
      removeReply(replyId)
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
            {error ? `載入錯誤: ${error.message}` : '抱歉，找不到您要查看的文章。'}
          </p>
          <Link 
            to="/posts"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回文章列表
          </Link>
        </div>
      </div>
    )
  }

  // 獲取推薦文章 (複雜業務邏輯)
  const recommendedPosts = posts.length > 0 ? getRecommendedPosts(post, 3) : []

  // 處理 popover 目標設置
  const handleCommentTarget = (_element: HTMLElement | null, interaction: PostInteraction) => {
    showCommentPopover(interaction)
  }

  const handleHighlightTarget = (_element: HTMLElement | null, interaction: PostInteraction) => {
    showHighlightPopover(interaction)
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* 返回按鈕 */}
      <div className="mb-6">
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
        
        <div className="flex items-center gap-4 text-gray-600 text-sm mb-4">
          <span>發布日期: {post.date}</span>
          {post.author && <span>作者: {post.author}</span>}
        </div>
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
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

      {/* 文章內容 - 使用結構化渲染器 */}
      <article className="relative" ref={contentRef}>
          <StructuredMarkdownRenderer 
            post={post} 
            interactions={interactions}
            onCommentTarget={handleCommentTarget}
            onHighlightTarget={handleHighlightTarget}
            onMark={handleMark}
            onComment={handleComment}
          />
      </article>


      {/* 互動記錄 */}
      {post && <ReplyList interactions={replies} postId={post.id} onRemoveReply={handleRemoveReply} />}

      {/* 回覆按鈕 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={openReplyDialog}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          💬 回覆文章
        </button>
      </div>

      {/* 回覆留言 */}
      


      {/* 推薦文章 */}
      {recommendedPosts.length > 0 && (
        <section className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">推薦文章</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendedPosts.map(recommendedPost => (
              <div key={recommendedPost.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold mb-2">
                  <Link 
                    to={`/posts/${recommendedPost.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {recommendedPost.title}
                  </Link>
                </h3>
                <div className="text-gray-600 text-sm mb-2">
                  {recommendedPost.date}
                </div>
                {recommendedPost.tags && (
                  <div className="flex flex-wrap gap-1">
                    {recommendedPost.tags.slice(0, 3).map(tag => (
                      <span 
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 返回按鈕 */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link 
          to="/posts"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回文章列表
        </Link>
      </div>

      {/* 對話框 */}
      <InteractionDialogs
        showCommentDialog={showCommentDialog}
        commentText={commentText}
        selectedText={selectedTextForComment || ''}
        onCommentTextChange={setCommentText}
        onCommentSubmit={handleCommentSubmit}
        onCommentCancel={closeCommentDialog}
        showReplyDialog={showReplyDialog}
        replyText={replyText}
        onReplyTextChange={setReplyText}
        onReplySubmit={handleReplySubmit}
        onReplyCancel={closeReplyDialog}
      />

      <CommentPopover
        interaction={commentState.data?.interaction || null}
        position={commentState.data?.position || null}
        show={commentState.isActive}
        onClose={closePopover}
      />

      <HighlightPopover
        interaction={highlightState.data?.interaction || null}
        position={highlightState.data?.position || null}
        show={highlightState.isActive}
        onClose={closePopover}
        onRemove={removeInteraction}
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