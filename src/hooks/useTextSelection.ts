import { useRef, useCallback, useEffect } from 'react'
import { useTextSelectionContext } from '../contexts/TextSelectionContext'
import { TextSelectionService } from '../services/TextSelectionService'
import type { TextPosition } from '../types/post'

// 文字選擇配置
type TextSelectionConfig = {
    readonly onMark?: (selectedText: string, position: TextPosition) => void
    readonly onComment?: (selectedText: string, position: TextPosition) => void
    readonly excludeSelectors?: string[]
    readonly debounceMs?: number
    readonly showPopover?: (data: { onMark: () => void; onComment: () => void }) => void
}

// Hook 返回介面
type UseTextSelectionReturn = {
    readonly contentRef: React.RefObject<HTMLDivElement | null>
    readonly handleMark: () => void
    readonly handleComment: () => void
}

/**
 * 文字選擇 Hook - 簡化和清晰的 API
 * 遵循架構原則：Context 管理狀態，Service 處理 DOM 操作
 */
export function useTextSelection(config?: TextSelectionConfig): UseTextSelectionReturn {
    const { onMark, onComment, excludeSelectors = [], debounceMs = 100, showPopover } = config || {}

    const contentRef = useRef<HTMLDivElement | null>(null)
    const selectionContext = useTextSelectionContext()

    /**
     * 處理文字選擇
     */
    const handleTextSelection = useCallback(() => {
        if (!contentRef.current) return

        const selectionResult = TextSelectionService.getCurrentSelection(contentRef.current)

        if (!selectionResult) {
            selectionContext.clearSelection()
            TextSelectionService.clearSelectionOverlay()
            return
        }

        // 先清除舊的覆蓋層，但保留原生選擇讓用戶可以繼續選擇
        TextSelectionService.clearSelectionOverlay()

        // 創建視覺覆蓋層
        const overlayElements = TextSelectionService.createSelectionOverlay({
            rects: selectionResult.rects,
            className: 'custom-selection-overlay',
            zIndex: 40
        })

        // 更新 Context 狀態
        selectionContext.setSelection({
            selectedText: selectionResult.text,
            selectedRange: selectionResult.range,
            selectedPosition: selectionResult.position,
            selectedRects: selectionResult.rects,
            selectedElement: overlayElements[0] || null
        })

        // 使用新的 popover 系統顯示選單
        if (showPopover) {
            showPopover({
                onMark: handleMark,
                onComment: handleComment
            })
        } else {
            // fallback 到舊的 context 選單系統
            const menuPosition = TextSelectionService.calculateMenuPosition(
                selectionResult.rects,
                contentRef.current
            )
            if (menuPosition) {
                selectionContext.showMenu(menuPosition)
            }
        }

        // 不要立即清除原生選擇，讓用戶可以繼續選擇新的範圍
    }, [selectionContext, showPopover])

    /**
     * 處理標記操作
     */
    const handleMark = useCallback(() => {
        const { selectedText, selectedPosition } = selectionContext
        if (onMark && selectedText && selectedPosition) {
            onMark(selectedText, selectedPosition)
        }
        selectionContext.clearSelection()
        TextSelectionService.clearSelectionOverlay()
        TextSelectionService.clearNativeSelection() // 操作完成後清除原生選擇
    }, [onMark, selectionContext])

    /**
     * 處理評論操作
     */
    const handleComment = useCallback(() => {
        const { selectedText, selectedPosition } = selectionContext
        if (onComment && selectedText && selectedPosition) {
            onComment(selectedText, selectedPosition)
        }
        selectionContext.clearSelection()
        TextSelectionService.clearSelectionOverlay()
        TextSelectionService.clearNativeSelection() // 操作完成後清除原生選擇
    }, [onComment, selectionContext])

    /**
     * 清除選擇
     */
    const clearSelection = useCallback(() => {
        selectionContext.clearSelection()
        TextSelectionService.clearSelectionOverlay()
        TextSelectionService.clearNativeSelection() // 手動清除時清除原生選擇
    }, [selectionContext])

    // 初始化時隱藏原生選擇
    useEffect(() => {
        TextSelectionService.hideNativeSelection()

        return () => {
            TextSelectionService.showNativeSelection()
            TextSelectionService.clearSelectionOverlay()
        }
    }, [])

    // 事件處理
    useEffect(() => {
        if (!contentRef.current) return

        let timeoutId: NodeJS.Timeout

        const handleSelectionChange = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(handleTextSelection, debounceMs)
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && (selectionContext.isMenuVisible || selectionContext.selectedText)) {
                clearSelection()
            }
        }

        const handleScroll = () => {
            if (selectionContext.isMenuVisible || selectionContext.selectedText) {
                clearSelection()
            }
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (!contentRef.current) return

            const isOutside = TextSelectionService.isClickOutside(
                event,
                contentRef.current,
                [...excludeSelectors, '.interaction-menu', '.custom-selection-overlay', '.text-selection-popover']
            )

            if (isOutside && (selectionContext.selectedText || selectionContext.isMenuVisible)) {
                clearSelection()
            }
        }

        // 添加事件監聽器
        document.addEventListener('selectionchange', handleSelectionChange)
        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('click', handleClickOutside)
        window.addEventListener('scroll', handleScroll, true)

        return () => {
            clearTimeout(timeoutId)
            document.removeEventListener('selectionchange', handleSelectionChange)
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('click', handleClickOutside)
            window.removeEventListener('scroll', handleScroll, true)
        }
    }, [handleTextSelection, clearSelection, selectionContext.isMenuVisible, selectionContext.selectedText, excludeSelectors, debounceMs])

    return {
        contentRef,
        handleMark,
        handleComment
    }
} 