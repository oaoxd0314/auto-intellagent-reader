import { useReplyPost } from '../hooks/useReplyPost'
import { ReplyForm } from './ReplyForm'
import { ReplyList } from './ReplyList'

type PostReplySectionProps = {
  readonly postId: string
}

/**
 * 文章回覆區域組件
 * 整合回覆表單和回覆列表，使用 useReplyPost hook
 */
export function PostReplySection({ postId }: PostReplySectionProps) {
  const {
    // 數據
    replies,
    replyStats,
    
    // 狀態
    isSubmitting,
    submitError,
    
    // 操作方法
    addReply,
    deleteReply,
    
    // 工具方法
    validateReplyContent,
    canSubmit,
    clearSubmitError
  } = useReplyPost(postId)

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* 標題區域 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            討論區
            {replyStats.hasReplies && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({replyStats.total} 則回覆)
              </span>
            )}
          </h3>
        </div>
        
        {/* 回覆表單 */}
        <div className="mt-4">
          <ReplyForm
            onSubmit={addReply}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onClearError={clearSubmitError}
            validateContent={validateReplyContent}
            canSubmit={canSubmit}
          />
        </div>
      </div>
      
      {/* 回覆列表 */}
      <div className="p-6">
        <ReplyList
          replies={replies}
          onDeleteReply={deleteReply}
          isLoading={false} // 由於我們使用 Context，載入狀態在 Context 中管理
        />
      </div>
    </div>
  )
} 