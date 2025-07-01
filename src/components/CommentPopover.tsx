import { useRef, useState, useEffect } from 'react'
import type { PostInteraction } from '@/types/post'

interface CommentPopoverProps {
    isVisible: boolean
    position: { x: number, y: number } | null
    comments: PostInteraction[]
    onClose: () => void
    onDeleteComment: (commentId: string) => Promise<void>
    isDeleting?: boolean
  }
  
  /**
   * 評論 Popover - 顯示段落評論並支援刪除操作
   */
  export function CommentPopover({ 
    isVisible, 
    position, 
    comments, 
    onClose, 
    onDeleteComment, 
    isDeleting = false 
  }: CommentPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null)
    const [realHeight, setRealHeight] = useState<number>(0)
  
    // 在每次渲染後獲取真實高度
    useEffect(() => {
      if (isVisible && popoverRef.current) {
        const height = popoverRef.current.offsetHeight
        setRealHeight(height)
      }
    }, [isVisible, comments.length])
  
    if (!isVisible || !position || comments.length === 0) {
      return null
    }
  
    const POPOVER_WIDTH = 320
    
    const finalPosition = {
      left: position.x - POPOVER_WIDTH / 2,     // 水平居中對齊選取點
      top: position.y - realHeight - 5,         // 使用真實高度在選取點上方 5px
    }
  
    return (
      <>
        {/* 背景遮罩 */}
        <div 
          className="absolute inset-0 z-40"
          onClick={onClose}
          data-comment-popover="backdrop"
        />
        
        {/* Popover 內容 */}
        <div
          ref={popoverRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
          style={{
            left: finalPosition.left,
            top: finalPosition.top,
            width: `${POPOVER_WIDTH}px`
          }}
          data-comment-popover="content"
          onClick={(e) => e.stopPropagation()} // 防止點擊 Popover 內容時關閉
        >
          <div className="text-sm font-medium text-gray-900 mb-3">
            評論 ({comments.length})
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                {/* 評論內容 - 截斷顯示，hover 顯示完整內容 */}
                <div 
                  className="text-sm text-gray-900 mb-1 cursor-pointer transition-all duration-200 truncate hover:whitespace-normal hover:overflow-visible"
                  title={comment.content}
                >
                  {comment.content}
                </div>
                
                {comment.selectedText && (
                  <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 mb-1 italic truncate hover:whitespace-normal hover:overflow-visible transition-all duration-200">
                    "{comment.selectedText}"
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {new Date(comment.timestamp).toLocaleString('zh-TW')}
                  </div>
                  <button
                    type="button"
                    onMouseDown={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      await onDeleteComment(comment.id)
                    }}
                    disabled={isDeleting}
                    className="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:text-red-300 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    {isDeleting ? '刪除中...' : '刪除'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* 小箭頭指向選擇區域 */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"
            style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}
          />
        </div>
      </>
    )
  }