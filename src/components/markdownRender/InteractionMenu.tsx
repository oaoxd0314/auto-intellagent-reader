import { cn } from '@/lib/utils'
import type { PostInteraction } from '../../types/post'

// 文字選擇操作選單
export interface TextSelectionMenuProps {
  show?: boolean
  position?: { left: number; top: number } | null
  onMark: () => void
  onComment: () => void
  onClose?: () => void
}

export function TextSelectionMenu({ show, position, onMark, onComment, onClose }: TextSelectionMenuProps) {
  if (!show || !position) return null

  return (
    <div
      className={cn(
        "fixed z-50 w-auto rounded-md border bg-white p-1 shadow-lg text-selection-popover",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            onMark()
            onClose?.()
          }}
          className={cn(
            "px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2",
            "transition-colors duration-150 whitespace-nowrap"
          )}
        >
          <span className="w-3 h-3 bg-yellow-300 rounded border border-yellow-400"></span>
          <span>標記</span>
        </button>
        <button
          onClick={() => {
            onComment()
            onClose?.()
          }}
          className={cn(
            "px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2",
            "transition-colors duration-150 whitespace-nowrap"
          )}
        >
          <span className="text-sm">💬</span>
          <span>評論</span>
        </button>
      </div>
    </div>
  )
}

// 標記操作選單
export interface MarkActionsMenuProps {
  show?: boolean
  position?: { left: number; top: number } | null
  interaction?: PostInteraction | null
  onRemove: (interactionId: string) => void
  onClose?: () => void
}

export function MarkActionsMenu({ show, position, interaction, onRemove, onClose }: MarkActionsMenuProps) {
  if (!show || !position || !interaction) return null

  const handleRemove = () => {
    onRemove(interaction.id)
    onClose?.()
  }

  return (
    <div
      className={cn(
        "fixed z-50 w-auto rounded-md border bg-white p-1 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      {/* 箭頭 */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5"></div>
      
      <button
        onClick={handleRemove}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors w-full"
      >
        <span className="text-xs">🗑️</span>
        <span>取消標記</span>
      </button>
    </div>
  )
}

// 留言操作選單
export interface CommentActionsMenuProps {
  show?: boolean
  position?: { left: number; top: number } | null
  interaction?: PostInteraction | null
  onRemove: (interactionId: string) => void
  onClose?: () => void
}

export function CommentActionsMenu({ show, position, interaction, onRemove, onClose }: CommentActionsMenuProps) {
  if (!show || !position || !interaction) return null

  const handleRemove = () => {
    onRemove(interaction.id)
    onClose?.()
  }

  return (
    <div
      className={cn(
        "fixed z-50 w-auto rounded-md border bg-white p-1 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      {/* 箭頭 */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5"></div>
      
      <button
        onClick={handleRemove}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors w-full"
      >
        <span className="text-xs">🗑️</span>
        <span>取消留言</span>
      </button>
    </div>
  )
}

// 留言展開
export interface CommentViewProps {
  show?: boolean
  position?: { left: number; top: number } | null
  interaction?: PostInteraction | null
  onClose?: () => void
}

export function CommentView({ show, position, interaction, onClose }: CommentViewProps) {
  if (!show || !position || !interaction) return null

  return (
    <div
      className={cn(
        "fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm",
        "animate-in fade-in-0 slide-in-from-top-2 duration-200"
      )}
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      {/* 箭頭 */}
      <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
      
      <div className="p-4">
        {/* 標題 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-600">💬</span>
          <span className="font-medium text-gray-900">評論</span>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 選中的文字 */}
        {interaction.selectedText && (
          <div className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded-r">
            <p className="text-sm text-gray-700 italic">
              "{interaction.selectedText}"
            </p>
          </div>
        )}

        {/* 評論內容 */}
        <div className="text-sm text-gray-800 leading-relaxed">
          {interaction.content}
        </div>

        {/* 時間戳 */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {new Date(interaction.timestamp).toLocaleString('zh-TW')}
          </span>
        </div>
      </div>
    </div>
  )
} 