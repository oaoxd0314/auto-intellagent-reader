import { useParams, Link, Navigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { getPostById } from '../../../data/posts'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  
  if (!id) {
    return <Navigate to="/posts" replace />
  }
  
  const post = getPostById(id)
  
  if (!post) {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        
        <div className="flex items-center gap-4 text-gray-600 text-sm mb-4">
          <span>發布日期: {post.date}</span>
        </div>
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
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

      {/* 文章內容 */}
      <article className="prose prose-lg max-w-none">
        <ReactMarkdown
          components={{
            // 自定義渲染組件
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-bold text-gray-900 mt-5 mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-gray-700 leading-relaxed mb-4">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-4 space-y-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-4 space-y-2">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-700">{children}</li>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.includes('language-')
              
              if (isBlock) {
                return (
                  <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto mb-4">
                    <code className="text-sm text-gray-800">{children}</code>
                  </pre>
                )
              }
              
              return (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-800">
                  {children}
                </code>
              )
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50">
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => (
              <a 
                href={href}
                className="text-blue-600 hover:text-blue-800 underline"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            ),
          }}
        >
          {post.content}
        </ReactMarkdown>
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