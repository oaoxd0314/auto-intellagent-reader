import { useState, useRef, useCallback, useEffect } from 'react'
import type { TextPosition } from '../types/post'

export interface UseTextSelectionReturn {
    selectedText: string
    selectionPosition: TextPosition | null
    showInteractionMenu: boolean
    selectionRange: Range | null
    menuPosition: { left: number; top: number } | null
    contentRef: React.RefObject<HTMLDivElement | null>
    clearSelection: () => void
}

export function useTextSelection(): UseTextSelectionReturn {
    const [selectedText, setSelectedText] = useState('')
    const [selectionPosition, setSelectionPosition] = useState<TextPosition | null>(null)
    const [showInteractionMenu, setShowInteractionMenu] = useState(false)
    const [selectionRange, setSelectionRange] = useState<Range | null>(null)
    const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null)

    const contentRef = useRef<HTMLDivElement>(null)

    /**
     * 生成段落 ID
     */
    const generateSectionId = useCallback((node: Node): string => {
        let element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element

        while (element && element !== contentRef.current) {
            if (element.id) return element.id

            if (element.tagName && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV', 'SECTION', 'ARTICLE'].includes(element.tagName)) {
                const textContent = element.textContent || ''
                const hash = textContent.slice(0, 50).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
                const id = `section-${hash}-${element.tagName.toLowerCase()}`
                element.id = id
                return id
            }
            element = element.parentElement
        }

        return `section-default`
    }, [])

    /**
     * 計算選單位置
     */
    const calculateMenuPosition = useCallback((range: Range) => {
        const rects = range.getClientRects()
        if (rects.length === 0) return null

        let leftMost = Infinity
        let rightMost = -Infinity
        let topMost = Infinity

        for (let i = 0; i < rects.length; i++) {
            const r = rects[i]
            if (r.width > 0) {
                leftMost = Math.min(leftMost, r.left)
                rightMost = Math.max(rightMost, r.right)
                topMost = Math.min(topMost, r.top)
            }
        }

        const containerRect = contentRef.current?.getBoundingClientRect()
        if (!containerRect) return null

        return {
            left: (leftMost + rightMost) / 2 - containerRect.left,
            top: topMost - containerRect.top
        }
    }, [])

    /**
     * 處理文字選擇 - 簡化邏輯，減少跳躍
     */
    const handleTextSelection = useCallback(() => {
        const selection = window.getSelection()

        if (!selection || selection.rangeCount === 0) {
            setShowInteractionMenu(false)
            return
        }

        const range = selection.getRangeAt(0)
        const text = selection.toString().trim()

        if (text.length === 0) {
            setShowInteractionMenu(false)
            return
        }

        // 檢查選擇是否在內容區域內
        if (!contentRef.current?.contains(range.commonAncestorContainer)) {
            setShowInteractionMenu(false)
            return
        }

        // 計算位置
        const position: TextPosition = {
            start: range.startOffset,
            end: range.endOffset,
            sectionId: generateSectionId(range.startContainer)
        }

        const menuPos = calculateMenuPosition(range)

        // 直接更新，不使用複雜的清除邏輯
        setSelectedText(text)
        setSelectionPosition(position)
        setSelectionRange(range.cloneRange())
        setMenuPosition(menuPos)
        setShowInteractionMenu(true)
    }, [generateSectionId, calculateMenuPosition])

    /**
     * 清除選擇
     */
    const clearSelection = useCallback(() => {
        window.getSelection()?.removeAllRanges()
        setSelectedText('')
        setSelectionPosition(null)
        setSelectionRange(null)
        setMenuPosition(null)
        setShowInteractionMenu(false)
    }, [])

    // 使用 debounce 來減少頻繁觸發
    useEffect(() => {
        let timeoutId: NodeJS.Timeout

        const handleSelectionChange = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(handleTextSelection, 50) // 50ms debounce
        }

        const handleMouseDown = (event: MouseEvent) => {
            const target = event.target as Element
            if (!target.closest('.interaction-menu')) {
                setShowInteractionMenu(false)
            }
        }

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (showInteractionMenu &&
                !target.closest('.interaction-menu') &&
                !contentRef.current?.contains(target)) {
                clearSelection()
            }
        }

        document.addEventListener('selectionchange', handleSelectionChange)
        document.addEventListener('mousedown', handleMouseDown)
        document.addEventListener('click', handleClickOutside)

        return () => {
            clearTimeout(timeoutId)
            document.removeEventListener('selectionchange', handleSelectionChange)
            document.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('click', handleClickOutside)
        }
    }, [handleTextSelection, showInteractionMenu, clearSelection])

    return {
        selectedText,
        selectionPosition,
        showInteractionMenu,
        selectionRange,
        menuPosition,
        contentRef,
        clearSelection
    }
} 