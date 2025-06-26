import { useEffect } from 'react'

export interface UseKeyboardShortcutsProps {
    selectedText: string
    showInteractionMenu: boolean
    onMark: () => void
    onComment: () => void
    onClear: () => void
}

export function useKeyboardShortcuts({
    selectedText,
    showInteractionMenu,
    onMark,
    onComment,
    onClear
}: UseKeyboardShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // 只在有選擇文字時處理快捷鍵
            if (!selectedText || !showInteractionMenu) return

            // Cmd+Shift+H: 標記
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
                event.preventDefault()
                event.stopPropagation()
                event.stopImmediatePropagation()
                onMark()
            }

            // Cmd+Shift+C: 評論
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
                event.preventDefault()
                event.stopPropagation()
                event.stopImmediatePropagation()
                onComment()
            }

            // Escape: 清除選擇
            if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                onClear()
            }
        }

        document.addEventListener('keydown', handleKeyDown, { capture: true })
        return () => document.removeEventListener('keydown', handleKeyDown, { capture: true })
    }, [selectedText, showInteractionMenu, onMark, onComment, onClear])
} 