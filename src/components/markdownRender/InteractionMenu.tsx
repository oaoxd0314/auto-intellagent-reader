import { cn } from '@/lib/utils'
import { useTextSelectionContext } from '../../contexts/TextSelectionContext'

export interface InteractionMenuProps {
  show?: boolean
  position?: { left: number; top: number } | null
  onMark: () => void
  onComment: () => void
}

export function InteractionMenu({ show, position, onMark, onComment }: InteractionMenuProps) {
  const selectionContext = useTextSelectionContext()
  
  // 優先使用 Context 中的狀態，fallback 到 props
  const isVisible = show !== undefined ? show : selectionContext.isMenuVisible
  const menuPosition = position !== undefined ? position : selectionContext.menuPosition
  
  if (!isVisible || !menuPosition) return null

  const menuWidth = 180 // 預估選單寬度
  
  const handleMark = () => {
    onMark()
    selectionContext.hideMenu()
  }
  
  const handleComment = () => {
    onComment()
    selectionContext.hideMenu()
  }

  return (
    <div
      className={cn(
        "absolute z-50 w-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg interaction-menu",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{
        left: menuPosition.left - menuWidth / 2,
        top: menuPosition.top,
      }}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={handleMark}
          className={cn(
            "px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded flex items-center gap-2",
            "transition-colors duration-150 whitespace-nowrap"
          )}
        >
          <span className="w-3 h-3 bg-yellow-300 rounded border border-yellow-400"></span>
          <span>標記</span>
          <kbd className="ml-1 text-xs opacity-60 bg-gray-100 px-1 rounded">⌘⇧H</kbd>
        </button>
        <button
          onClick={handleComment}
          className={cn(
            "px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded flex items-center gap-2",
            "transition-colors duration-150 whitespace-nowrap"
          )}
        >
          <span className="text-sm">💬</span>
          <span>評論</span>
          <kbd className="ml-1 text-xs opacity-60 bg-gray-100 px-1 rounded">⌘⇧C</kbd>
        </button>
      </div>
    </div>
  )
} 