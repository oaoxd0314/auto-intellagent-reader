import { Link } from 'react-router-dom'
import { usePostsList } from '../../hooks/usePostPage'

export default function PostsIndex() {
  // 只與 Hook 交互 - 符合架構設計
  const {
    // 數據狀態
    posts,
    allTags,
    
    // UI 狀態
    searchTerm,
    selectedTag,
    isLoading,
    error,
    
    // 操作方法
    setSearchTerm,
    setSelectedTag,
    clearError,
    
    // 統計資訊
    totalPosts,
    filteredCount
  } = usePostsList()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>載入中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>載入文章時發生錯誤: {error}</p>
          <button 
            onClick={clearError}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            清除錯誤
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">所有文章</h1>
          <p className="text-gray-600 mt-1">
            共 {totalPosts} 篇文章
            {searchTerm || selectedTag ? ` · 顯示 ${filteredCount} 篇` : ''}
          </p>
        </div>
      </div>
      
      {/* 搜索和篩選 */}
      <div className="mb-8 space-y-4">
        {/* 搜索框 */}
        <div>
          <input
            type="text"
            placeholder="搜索文章..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* 標籤篩選 */}
        {allTags.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTag === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                全部
              </button>
              {allTags.map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 文章列表 */}
      <div className="space-y-6">
        {posts.map(post => (
          <article key={post.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">
              <Link 
                to={`/posts/${post.id}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {post.title}
              </Link>
            </h2>
            
            <div className="text-gray-600 text-sm mb-3">
              <div>發布日期: {post.date}</div>
              {post.author && <div>作者: {post.author}</div>}
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={() => setSelectedTag(tag)}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      
      {/* 空狀態處理 */}
      {posts.length === 0 && (searchTerm || selectedTag) && (
        <div className="text-center text-gray-500 py-12">
          <p>沒有符合條件的文章</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedTag(null)
            }}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            清除篩選條件
          </button>
        </div>
      )}
      
      {posts.length === 0 && !searchTerm && !selectedTag && (
        <div className="text-center text-gray-500 py-12">
          <p>目前沒有文章</p>
        </div>
      )}
    </div>
  )
} 