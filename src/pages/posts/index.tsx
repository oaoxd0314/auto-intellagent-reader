import { Link } from 'react-router-dom'
import { getAllPosts } from '../../data/posts'

export default function PostsIndex() {
  const posts = getAllPosts()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">所有文章</h1>
      
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
              發布日期: {post.date}
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
      
      {posts.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <p>目前沒有文章</p>
        </div>
      )}
    </div>
  )
} 