import type { PostInteraction } from '../../types/post'

export interface ReplyListProps {
  interactions: PostInteraction[] // 現在這裡只會是 reply 類型的互動
  onRemoveReply?: (replyId: string) => void
}

export function ReplyList({ interactions: replies, onRemoveReply }: ReplyListProps) {
  if (replies.length === 0) {
    return (
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-4">回覆留言</h3>
        <p className="text-gray-500 text-sm">目前還沒有回覆留言</p>
      </div>
    )
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-semibold mb-4">
        回覆留言 ({replies.length})
      </h3>
      <div className="space-y-4">
        {replies.map((reply: PostInteraction) => (
          <div key={reply.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-600">
                  💬 {reply.author || '匿名用戶'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(reply.timestamp).toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {onRemoveReply && (
                <button
                  onClick={() => onRemoveReply(reply.id)}
                  className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                  title="刪除回覆"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="text-sm leading-relaxed text-gray-800">
              {reply.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 