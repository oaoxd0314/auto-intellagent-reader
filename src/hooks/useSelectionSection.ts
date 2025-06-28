import { useState, useCallback, useEffect, useRef } from 'react'

export interface SelectionData {
    selectedText: string
    selectionPosition: { x: number, y: number } | null
    sectionId: string | null
    range: Range | null
}

/**
 * 文字選擇 Hook - 簡化版，依賴原生 selection 邏輯
 */
export function useSelectionSection() {
    const [selectionData, setSelectionData] = useState<SelectionData>({
        selectedText: '',
        selectionPosition: null,
        sectionId: null,
        range: null
    })

    const [isSelectionActive, setIsSelectionActive] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // 獲取選擇的段落 ID
    const getSectionId = useCallback((range: Range): string | null => {
        let container = range.commonAncestorContainer

        // 如果是文字節點，獲取其父元素
        if (container.nodeType === Node.TEXT_NODE) {
            container = container.parentElement || container
        }

        // 向上查找直到找到有 ID 的元素
        let element = container as Element
        while (element && element !== document.body) {
            if (element.id && element.id.startsWith('section-')) {
                return element.id
            }
            element = element.parentElement as Element
        }

        return null
    }, [])

    // 計算選擇位置（用於 popover 定位）
    const getSelectionPosition = useCallback((range: Range): { x: number, y: number } => {
        const rect = range.getBoundingClientRect()

        // 使用現代 API，不用已棄用的 pageYOffset
        const scrollTop = window.scrollY
        const scrollLeft = window.scrollX

        return {
            x: rect.left + scrollLeft + rect.width / 2,  // 選擇範圍的水平中心
            y: rect.top + scrollTop + rect.height / 2    // 選擇範圍的垂直中心
        }
    }, [])

    // 處理文字選擇
    const handleSelection = useCallback(() => {
        const selection = window.getSelection()

        if (!selection || selection.rangeCount === 0) {
            setSelectionData({
                selectedText: '',
                selectionPosition: null,
                sectionId: null,
                range: null
            })
            setIsSelectionActive(false)
            return
        }

        const range = selection.getRangeAt(0)
        const selectedText = selection.toString().trim()

        // 只處理有實際選擇內容的情況
        if (!selectedText || selectedText.length < 3) {
            setSelectionData({
                selectedText: '',
                selectionPosition: null,
                sectionId: null,
                range: null
            })
            setIsSelectionActive(false)
            return
        }

        const sectionId = getSectionId(range)
        const position = getSelectionPosition(range)

        setSelectionData({
            selectedText,
            selectionPosition: position,
            sectionId,
            range: range.cloneRange()
        })

        setIsSelectionActive(true)
    }, [getSectionId, getSelectionPosition])

    // 清除選擇
    const clearSelection = useCallback(() => {
        setSelectionData({
            selectedText: '',
            selectionPosition: null,
            sectionId: null,
            range: null
        })
        setIsSelectionActive(false)

        // 清除瀏覽器選擇
        const selection = window.getSelection()
        if (selection) {
            selection.removeAllRanges()
        }
    }, [])

    // 延遲清除選擇（給 popover 操作留時間）
    const scheduleSelectionClear = useCallback((delay: number = 300) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            clearSelection()
        }, delay)
    }, [clearSelection])

    // 取消延遲清除
    const cancelSelectionClear = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [])

    // 簡化的事件監聽
    useEffect(() => {
        // 只監聽 mouseup 事件，這是用戶完成選擇的明確信號
        const handleMouseUp = (event: MouseEvent) => {
            const target = event.target as Element

            // 如果滑鼠釋放在 popover 上，不處理選擇
            if (target.closest('[data-selection-popover]')) {
                return
            }

            // 延遲一點點處理，讓瀏覽器完成選擇
            setTimeout(() => {
                handleSelection()
            }, 10)
        }

        // 監聽點擊事件，清除選擇
        const handleClick = (event: MouseEvent) => {
            const target = event.target as Element

            // 如果點擊的不是 popover 相關元素，清除選擇
            if (!target.closest('[data-selection-popover]') &&
                !target.closest('[data-selection-trigger]')) {
                scheduleSelectionClear(100)
            }
        }

        document.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('click', handleClick)

        return () => {
            document.removeEventListener('mouseup', handleMouseUp)
            document.removeEventListener('click', handleClick)

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [handleSelection, scheduleSelectionClear])

    // 驗證選擇是否有效
    const isValidSelection = useCallback(() => {
        return !!(
            selectionData.selectedText &&
            selectionData.sectionId &&
            selectionData.selectionPosition &&
            selectionData.range
        )
    }, [selectionData])

    return {
        // 選擇數據
        selectedText: selectionData.selectedText,
        selectionPosition: selectionData.selectionPosition,
        sectionId: selectionData.sectionId,
        range: selectionData.range,

        // 狀態
        isSelectionActive,
        isValidSelection: isValidSelection(),

        // 操作方法
        handleSelection,
        clearSelection,
        scheduleSelectionClear,
        cancelSelectionClear
    }
} 