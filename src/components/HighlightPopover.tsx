import { useRef, useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import type { PostInteraction } from '@/types/post'

interface HighlightPopoverProps {
  isVisible: boolean
  position: { x: number, y: number } | null
  highlight: PostInteraction | null
  onClose: () => void
  onDeleteHighlight: (highlightId: string) => Promise<void>
  isDeleting?: boolean
}

/**
 * 高亮 Popover - 顯示高亮信息並支援刪除操作
 */
export function HighlightPopover({ 
  isVisible, 
  position, 
  highlight, 
  onClose, 
  onDeleteHighlight, 
  isDeleting = false 
}: HighlightPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [realHeight, setRealHeight] = useState<number>(0)

  // 在每次渲染後獲取真實高度
  useEffect(() => {
    if (isVisible && popoverRef.current) {
      const height = popoverRef.current.offsetHeight
      setRealHeight(height)
    }
  }, [isVisible, highlight])

  if (!isVisible || !position || !highlight) {
    return null
  }

  const POPOVER_WIDTH = 80
  
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
        data-highlight-popover="backdrop"
      />
      
      {/* Popover 內容 */}
      <div
        ref={popoverRef}
        className="absolute z-50 bg-white rounded-lg border border-gray-200 shadow-lg"
        style={{
          left: finalPosition.left,
          top: finalPosition.top,
          width: `${POPOVER_WIDTH}px`
        }}
        data-highlight-popover="content"
        onClick={(e) => e.stopPropagation()} // 防止點擊 Popover 內容時關閉
      >
        {/* 只有刪除按鈕 */}
        <button
          type="button"
          onMouseDown={async (e) => {
            e.preventDefault()
            e.stopPropagation()
            await onDeleteHighlight(highlight.id)
          }}
          disabled={isDeleting}
          className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:text-red-300 disabled:cursor-not-allowed disabled:hover:bg-transparent w-full justify-center"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? '刪除中...' : '刪除'}
        </button>
        
        {/* 小箭頭指向選擇區域 */}
        <div 
          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"
          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}
        />
      </div>
    </>
  )
}