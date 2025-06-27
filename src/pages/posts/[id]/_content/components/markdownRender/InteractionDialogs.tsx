export interface InteractionDialogsProps {
  // 評論對話框
  showCommentDialog: boolean
  commentText: string
  selectedText: string
  onCommentTextChange: (text: string) => void
  onCommentSubmit: () => void
  onCommentCancel: () => void
  
  // 回覆對話框
  showReplyDialog: boolean
  replyText: string
  onReplyTextChange: (text: string) => void
  onReplySubmit: () => void
  onReplyCancel: () => void
}

export function InteractionDialogs({
  showCommentDialog,
  commentText,
  selectedText,
  onCommentTextChange,
  onCommentSubmit,
  onCommentCancel,
  showReplyDialog,
  replyText,
  onReplyTextChange,
  onReplySubmit,
  onReplyCancel
}: InteractionDialogsProps) {
  return (
    <>
      {/* 評論對話框 */}
      {showCommentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">添加評論</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
              <strong>選中文字：</strong> {selectedText}
            </div>
            <textarea
              value={commentText}
              onChange={(e) => onCommentTextChange(e.target.value)}
              placeholder="輸入你的評論..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onCommentCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={onCommentSubmit}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交評論
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 回覆對話框 */}
      {showReplyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">回覆文章</h3>
            <textarea
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder="輸入你的回覆..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onReplyCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={onReplySubmit}
                disabled={!replyText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交回覆
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 