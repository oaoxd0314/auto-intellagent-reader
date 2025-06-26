import { useState, useEffect, useRef } from 'react'
import type { PostInteraction } from '../../../../../../types/post'

interface HighlightPopoverProps {
  interaction: PostInteraction | null
  onClose: () => void
  onRemove: (interactionId: string) => void
}

export function HighlightPopover({ interaction, onClose, onRemove }: HighlightPopoverProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!interaction) return

    // 找到對應的 highlight 元素
    const highlight = document.querySelector(`[data-interaction-id="${interaction.id}"].text-highlight`)
    if (highlight) {
      const rect = highlight.getBoundingClientRect()
      // 找到內容容器作為定位參考
      const contentContainer = highlight.closest('.prose')?.parentElement || document.body
      const containerRect = contentContainer.getBoundingClientRect()
      
      setPosition({
        top: rect.top - containerRect.top - 45, // 在 highlight 上方
        left: Math.max(10, rect.left - containerRect.left + (rect.width / 2) - 60) // 居中對齊，確保不超出邊界
      })
    }
  }, [interaction])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        // 檢查是否點擊在 highlight 上，如果是則不關閉
        const target = event.target as Element
        if (!target.closest('.text-highlight')) {
          onClose()
        }
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

  const handleRemove = () => {
    if (interaction) {
      onRemove(interaction.id)
      onClose()
    }
  }

  if (!interaction || !position) return null

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* 箭頭 */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5"></div>
      
      <div className="p-2">
        <button
          onClick={handleRemove}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors w-full"
        >
          <span className="text-xs">🗑️</span>
          <span>
            {interaction.type === 'mark' ? '取消標記' : '刪除評論'}
          </span>
        </button>
      </div>
    </div>
  )
} 