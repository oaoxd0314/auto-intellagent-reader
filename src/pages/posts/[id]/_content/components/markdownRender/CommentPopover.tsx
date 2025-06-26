import { useState, useEffect, useRef } from 'react'
import type { PostInteraction } from '../../../../../../types/post'

interface CommentPopoverProps {
  interaction: PostInteraction | null
  onClose: () => void
}

export function CommentPopover({ interaction, onClose }: CommentPopoverProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!interaction) return

    // 找到對應的 comment 圖標（專門找 .comment-icon 類別）
    const icon = document.querySelector(`.comment-icon[data-interaction-id="${interaction.id}"]`)
    if (icon) {
      const rect = icon.getBoundingClientRect()
      // 找到內容容器作為定位參考
      const contentContainer = icon.closest('.prose') || document.body
      const containerRect = contentContainer.getBoundingClientRect()
      
      setPosition({
        top: rect.bottom - containerRect.top + 8,
        left: rect.left - containerRect.left - 100 // 向左偏移一些
      })
    }
  }, [interaction])

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

    if (interaction) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [interaction, onClose])

  if (!interaction || !position) return null

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