import { useParams, Link, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { usePost } from '../../../contexts/PostContext'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentPost, isLoading, error, fetchPostById } = usePost()
  
  useEffect(() => {
    if (id) {
      fetchPostById(id)
    }
  }, [id, fetchPostById])
  
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
  
  if (error || !currentPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">文章不存在</h1>
          <p className="text-gray-600 mb-6">抱歉，找不到您要查看的文章。</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentPost.title}</h1>
        
        <div className="flex items-center gap-4 text-gray-600 text-sm mb-4">
          <span>發布日期: {currentPost.date}</span>
          {currentPost.author && <span>作者: {currentPost.author}</span>}
        </div>
        
        {currentPost.tags && currentPost.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentPost.tags.map((tag: string) => (
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

      {/* 文章內容 */}
      <article className="prose prose-lg max-w-none">
        {currentPost.component ? (
          <currentPost.component />
        ) : (
          <div className="text-gray-500">
            <p>文章內容載入失敗</p>
          </div>
        )}
      </article>

      {/* 返回按鈕 */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link 
          to="/posts"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          返回文章列表
        </Link>
      </div>
    </div>
  )
} 