import { useEffect, useRef } from 'react'
import type { PostInteraction } from '../../../../../../types/post'

interface HighlightPopoverProps {
  interaction: PostInteraction | null
  position: { top: number; left: number } | null
  show: boolean
  onClose: () => void
  onRemove: (interactionId: string) => void
}

export function HighlightPopover({ interaction, position, show, onClose, onRemove }: HighlightPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

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

    if (show) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [show, onClose])

  const handleRemove = () => {
    if (interaction) {
      onRemove(interaction.id)
      onClose()
    }
  }

  if (!show || !interaction || !position) return null

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