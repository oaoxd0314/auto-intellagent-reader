import { useParams, Link, Navigate } from 'react-router-dom'
import { usePostDetail } from '../../../hooks/usePostPage'
import { StructuredMarkdownRenderer } from '../../../components/MarkdownRender'
import { PostReplySection } from '../../../components/PostReplySection'
import { useInteraction } from '../../../contexts/InteractionContext'


function PostDetailContent() {
  const { id } = useParams<{ id: string }>()
  
  // 只與 Hook 交互 - 符合架構設計
  const {
    // 數據狀態
    post,
    recommendedPosts,

    // UI 狀態
    isLoading,
    error,
    
    // 操作方法
    clearError,
  } = usePostDetail(id || '')

  // 獲取互動統計
  const { getInteractionStats } = useInteraction()
  const interactionStats = post ? getInteractionStats(post.id) : { total: 0, replies: 0, comments: 0, highlights: 0 }
  
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
          <div>互動數: {interactionStats.total}</div>
          {interactionStats.replies > 0 && <div>回覆: {interactionStats.replies}</div>}
        </div>
        
        {/* 標籤 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
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

      {/* 文章內容區域 */}
      <div className="prose prose-lg max-w-none mb-8">
        <div>
          <StructuredMarkdownRenderer 
            post={post}
            enableSelection={true}
            enableHighlight={true}
            onTextSelect={(selectedText, sectionId) => {
              console.log('文字選擇:', { selectedText, sectionId })
            }}
            onHighlightAdded={(sectionId) => {
              console.log('高亮已添加:', sectionId)
            }}
          />
        </div>
      </div>

      {/* 回覆區域 */}
      <div className="mb-8">
        <PostReplySection postId={post.id} />
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
    </div>
  )
}

export default function PostDetail() {
  return (
      <PostDetailContent />
  )
} 