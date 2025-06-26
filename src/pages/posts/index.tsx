import { Link } from 'react-router-dom'
import { usePost } from '../../contexts/PostContext'

export default function PostsIndex() {
  const { 
    posts, 
    tags,
    isPostsLoading, 
    isTagsLoading,
    postsError,
    state,
    setSelectedTag,
    setSearchTerm,
    getFilteredPosts
  } = usePost()

  const filteredPosts = getFilteredPosts()

  if (isPostsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>載入中...</p>
        </div>
      </div>
    )
  }

  if (postsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>載入文章時發生錯誤: {postsError.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">所有文章</h1>
      
      {/* 搜索和篩選 */}
      <div className="mb-8 space-y-4">
        {/* 搜索框 */}
        <div>
          <input
            type="text"
            placeholder="搜索文章..."
            value={state.searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* 標籤篩選 */}
        {!isTagsLoading && tags.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-sm ${
                  state.selectedTag === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                全部
              </button>
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    state.selectedTag === tag
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
        {filteredPosts.map(post => (
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
                {post.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
      
      {filteredPosts.length === 0 && posts.length > 0 && (
        <div className="text-center text-gray-500 py-12">
          <p>沒有符合條件的文章</p>
        </div>
      )}
      
      {posts.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <p>目前沒有文章</p>
        </div>
      )}
    </div>
  )
} 