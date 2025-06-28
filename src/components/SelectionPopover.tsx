import { MessageSquare, Highlighter, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface SelectionPopoverProps {
  isVisible: boolean
  position: { x: number, y: number } | null
  selectedText: string
  onHighlight: () => void
  onComment: () => void
  onClose: () => void
  isHighlighting?: boolean
  isCommenting?: boolean
}

/**
 * 文字選擇 Popover - 顯示選擇操作選單
 * 參考 Medium 的文字選擇工具列設計
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
  if (!isVisible || !position || !selectedText.trim()) {
    return null
  }

  const maxTextLength = 50
  const displayText = selectedText.length > maxTextLength 
    ? `${selectedText.slice(0, maxTextLength)}...` 
    : selectedText

  // 計算安全的位置，避免超出視窗範圍，並考慮 navbar 高度
  const popoverWidth = 200
  const popoverHeight = 80
  const navbarHeight = 68 // 從 CSS 變數 --navbar-height 獲取
  
  const safePosition = {
    x: Math.max(popoverWidth / 2, Math.min(position.x, document.documentElement.scrollWidth - popoverWidth / 2)),
    y: Math.max(navbarHeight + popoverHeight + 10, position.y) // 確保不會被 navbar 遮擋，加 10px 緩衝
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
        data-selection-popover="backdrop"
      />
      
      {/* Popover 內容 */}
      <Card
        className="absolute z-50 p-2 shadow-lg border-gray-200 bg-white"
        style={{
          left: safePosition.x - popoverWidth / 2,  // 水平居中對齊
          top: safePosition.y - popoverHeight - 10, // 在選擇範圍上方，留 10px 間距
          minWidth: `${popoverWidth}px`
        }}
        data-selection-popover="content"
      >
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
            onClick={onComment}
            disabled={isCommenting}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <MessageSquare className="w-4 h-4" />
            {isCommenting ? '評論中...' : '評論'}
          </Button>
          
          <div className="w-px h-4 bg-gray-300 mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* 小箭頭指向選擇區域 */}
        <div 
          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"
          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}
        />
      </Card>
    </>
  )
} 