import { useState } from 'react'
import { MessageSquare, Highlighter, X, ArrowLeft } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { CommentForm } from './CommentForm'

interface SelectionPopoverProps {
  isVisible: boolean
  position: { x: number, y: number } | null
  selectedText: string
  onHighlight: () => void
  onComment: (content: string) => Promise<void>
  onClose: () => void
  isHighlighting?: boolean
  isCommenting?: boolean
}

/**
 * 文字選擇 Popover - 顯示選擇操作選單或評論表單
 * 參考 Medium 的文字選擇工具列設計，支援工具列和評論表單兩種模式
 */
export function SelectionPopover({
  isVisible,
  position,
  selectedText,
  onHighlight,
  onComment,
  onClose,
  isHighlighting = false,
  isCommenting = false
}: SelectionPopoverProps) {
  const [mode, setMode] = useState<'toolbar' | 'comment'>('toolbar')

  if (!isVisible || !position || !selectedText.trim()) {
    return null
  }

  const maxTextLength = 50
  const displayText = selectedText.length > maxTextLength 
    ? `${selectedText.slice(0, maxTextLength)}...` 
    : selectedText

  // 根據模式調整寬度
  const popoverWidth = mode === 'comment' ? 320 : 200
  const popoverHeight = mode === 'comment' ? 200 : 80
  
  const finalPosition = {
    left: position.x - popoverWidth / 2,     // 水平居中對齊選取點
    top: position.y - popoverHeight - 5,     // 在選取點上方 5px
  }

  // 處理評論按鈕點擊
  const handleCommentClick = () => {
    setMode('comment')
  }

  // 處理評論提交
  const handleCommentSubmit = async (content: string) => {
    await onComment(content)
    setMode('toolbar')  // 提交後回到工具列模式
  }

  // 處理取消評論
  const handleCommentCancel = () => {
    setMode('toolbar')
  }

  // 處理關閉
  const handleClose = () => {
    setMode('toolbar')  // 重置模式
    onClose()
  }

  return (
    <>
      {/* 背景遮罩 - 改為 absolute，覆蓋整個 container */}
      <div 
        className="absolute inset-0 z-40"
        onClick={handleClose}
        data-selection-popover="backdrop"
      />
      
      {/* Popover 內容 */}
      <Card
        className="absolute z-50 p-3 shadow-lg border-gray-200 bg-white"
        style={{
          left: finalPosition.left,
          top: finalPosition.top,
          minWidth: `${popoverWidth}px`
        }}
        data-selection-popover="content"
        onClick={(e) => e.stopPropagation()} // 防止點擊 Popover 內容時關閉
      >
        {mode === 'toolbar' ? (
          // 工具列模式
          <>
            {/* 選擇的文字預覽 */}
            <div className="text-xs text-gray-500 mb-2 px-1 truncate">
              "{displayText}"
            </div>
            
            {/* 操作按鈕 */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onHighlight}
                disabled={isHighlighting}
                className="flex items-center gap-1 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
              >
                <Highlighter className="w-4 h-4" />
                {isHighlighting ? '標記中...' : '高亮'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCommentClick}
                disabled={isCommenting}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <MessageSquare className="w-4 h-4" />
                評論
              </Button>
              
              <div className="w-px h-4 bg-gray-300 mx-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          // 評論表單模式
          <>
            {/* 表單標題 */}
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCommentCancel}
                className="text-gray-500 hover:text-gray-700 p-1 h-auto"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-900">添加評論</span>
            </div>

            {/* 評論表單 */}
            <CommentForm
              selectedText={selectedText}
              isSubmitting={isCommenting}
              onSubmit={handleCommentSubmit}
              onCancel={handleCommentCancel}
              autoFocus={true}
              maxLength={500}
            />
          </>
        )}
        
        {/* 小箭頭指向選擇區域 */}
        <div 
          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"
          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}
        />
      </Card>
    </>
  )
} 