import { useEffect, useRef } from 'react'
import type { PostInteraction } from '../../types/post'

interface CommentPopoverProps {
  interaction: PostInteraction | null
  position: { top: number; left: number } | null
  show: boolean
  onClose: () => void
}

export function CommentPopover({ interaction, position, show, onClose }: CommentPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (show) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [show, onClose])

  if (!show || !interaction || !position) return null

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* 箭頭 */}
      <div className="absolute -top-2 left-24 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
      
      <div className="p-4">
        {/* 標題 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-600">💬</span>
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
          <div className="mb-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
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