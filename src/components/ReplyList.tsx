import type { PostInteraction } from '../types/post'

type ReplyListProps = {
  readonly replies: PostInteraction[]
  readonly onDeleteReply: (replyId: string) => Promise<void>
  readonly isLoading: boolean
}

/**
 * 回覆列表組件
 * 純 UI 組件，顯示回覆列表和刪除功能
 */
export function ReplyList({ replies, onDeleteReply, isLoading }: ReplyListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* 載入骨架 */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (replies.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">
          目前還沒有回覆，成為第一個回覆的人吧！
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {replies.map((reply) => (
        <ReplyItem 
          key={reply.id} 
          reply={reply} 
          onDelete={onDeleteReply}
        />
      ))}
    </div>
  )
}

/**
 * 單個回覆項目組件
 */
function ReplyItem({ 
  reply, 
  onDelete 
}: { 
  reply: PostInteraction
  onDelete: (replyId: string) => Promise<void>
}) {

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) {
      return '剛剛'
    } else if (diffMins < 60) {
      return `${diffMins} 分鐘前`
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`
    } else if (diffDays < 7) {
      return `${diffDays} 天前`
    } else {
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors group">
      {/* 回覆標頭 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-blue-600">💬</span>
            <span className="text-sm font-medium text-gray-900">
              {reply.author || '匿名用戶'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {formatDate(reply.timestamp)}
          </span>
        </div>
        
        {/* 刪除按鈕 */}
        <button
          onClick={() => onDelete(reply.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all duration-200"
          title="刪除回覆"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {/* 回覆內容 */}
      <div className="text-sm leading-relaxed text-gray-800">
        <p className="whitespace-pre-wrap">{reply.content}</p>
      </div>
    </div>
  )
} 