import type { TextPosition } from '../types/post'

// 選擇配置
type SelectionConfig = {
    readonly minLength: number
    readonly overlayZIndex: number
    readonly overlayClassName: string
    readonly debounceMs: number
}

// 選擇結果
type SelectionResult = {
    readonly text: string
    readonly range: Range
    readonly position: TextPosition
    readonly rects: DOMRect[]
}

// 覆蓋層選項
type OverlayOptions = {
    readonly rects: DOMRect[]
    readonly className: string
    readonly zIndex: number
}

const DEFAULT_CONFIG: SelectionConfig = {
    minLength: 1,
    overlayZIndex: 40,
    overlayClassName: 'custom-selection-overlay',
    debounceMs: 100
} as const

/**
 * 文字選擇服務 - 處理所有 DOM 操作
 * 遵循 Service 層原則：純函數，無狀態，可測試
 */
export class TextSelectionService {
    /**
     * 獲取當前文字選擇
     */
    static getCurrentSelection(containerElement: HTMLElement, config = DEFAULT_CONFIG): SelectionResult | null {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return null

        const range = selection.getRangeAt(0)
        const text = range.toString().trim()

        if (text.length < config.minLength) return null
        if (!containerElement.contains(range.commonAncestorContainer)) return null

        const stabilizedRange = this.stabilizeRange(range)
        if (!stabilizedRange) return null

        const position = this.calculateTextPosition(stabilizedRange, containerElement)
        const rects = Array.from(stabilizedRange.getClientRects())

        return {
            text: stabilizedRange.toString().trim(),
            range: stabilizedRange,
            position,
            rects
        }
    }

    /**
     * 穩定化選擇範圍 - 修正邊界問題，限制在文字層級
     */
    private static stabilizeRange(range: Range): Range | null {
        try {
            const clonedRange = range.cloneRange()

            if (clonedRange.collapsed || clonedRange.toString().trim().length === 0) {
                return null
            }

            // 確保選擇範圍只在文字節點內，不會擴展到元素邊界
            this.constrainRangeToTextNodes(clonedRange)

            // 處理開始位置 - 跳過空白字元
            let startContainer = clonedRange.startContainer
            let startOffset = clonedRange.startOffset

            if (startContainer.nodeType === Node.TEXT_NODE) {
                const text = startContainer.textContent || ''
                while (startOffset < text.length && /\s/.test(text[startOffset])) {
                    startOffset++
                }
                clonedRange.setStart(startContainer, Math.min(startOffset, text.length))
            }

            // 處理結束位置 - 跳過空白字元
            let endContainer = clonedRange.endContainer
            let endOffset = clonedRange.endOffset

            if (endContainer.nodeType === Node.TEXT_NODE) {
                const text = endContainer.textContent || ''
                while (endOffset > 0 && /\s/.test(text[endOffset - 1])) {
                    endOffset--
                }
                clonedRange.setEnd(endContainer, Math.max(endOffset, 0))
            }

            const finalText = clonedRange.toString().trim()
            return finalText.length === 0 ? null : clonedRange
        } catch (error) {
            console.warn('Range stabilization failed:', error)
            return range
        }
    }

    /**
     * 限制選擇範圍只在文字節點內
     */
    private static constrainRangeToTextNodes(range: Range): void {
        // 確保開始位置在文字節點內
        if (range.startContainer.nodeType !== Node.TEXT_NODE) {
            const textNode = this.findFirstTextNode(range.startContainer)
            if (textNode) {
                range.setStart(textNode, 0)
            }
        }

        // 確保結束位置在文字節點內
        if (range.endContainer.nodeType !== Node.TEXT_NODE) {
            const textNode = this.findLastTextNode(range.endContainer)
            if (textNode) {
                range.setEnd(textNode, textNode.textContent?.length || 0)
            }
        }
    }

    /**
     * 尋找第一個文字節點
     */
    private static findFirstTextNode(node: Node): Text | null {
        if (node.nodeType === Node.TEXT_NODE) {
            return node as Text
        }

        for (let child of Array.from(node.childNodes)) {
            const textNode = this.findFirstTextNode(child)
            if (textNode) return textNode
        }

        return null
    }

    /**
     * 尋找最後一個文字節點
     */
    private static findLastTextNode(node: Node): Text | null {
        if (node.nodeType === Node.TEXT_NODE) {
            return node as Text
        }

        const children = Array.from(node.childNodes)
        for (let i = children.length - 1; i >= 0; i--) {
            const textNode = this.findLastTextNode(children[i])
            if (textNode) return textNode
        }

        return null
    }

    /**
     * 計算文字位置資訊
     */
    private static calculateTextPosition(range: Range, containerElement: HTMLElement): TextPosition {
        const sectionId = this.generateSectionId(range.commonAncestorContainer, containerElement)

        // 計算在容器內的偏移位置
        const containerRange = document.createRange()
        containerRange.selectNodeContents(containerElement)

        const beforeRange = document.createRange()
        beforeRange.setStart(containerRange.startContainer, containerRange.startOffset)
        beforeRange.setEnd(range.startContainer, range.startOffset)

        const start = beforeRange.toString().length
        const end = start + range.toString().length

        return {
            sectionId,
            start,
            end
        }
    }

    /**
     * 生成段落 ID
     */
    private static generateSectionId(node: Node, containerElement: HTMLElement): string {
        let element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element

        while (element && element !== containerElement) {
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

        return 'section-default'
    }

    /**
     * 創建選擇覆蓋層
     */
    static createSelectionOverlay(options: OverlayOptions): HTMLElement[] {
        // 清除現有覆蓋層
        this.clearSelectionOverlay(options.className)

        const overlays: HTMLElement[] = []

        for (const rect of options.rects) {
            if (rect.width === 0 || rect.height === 0) continue

            const overlay = document.createElement('div')
            overlay.className = options.className
            overlay.style.cssText = `
        position: fixed;
        background-color: rgba(59, 130, 246, 0.3);
        border-radius: 2px;
        pointer-events: none;
        z-index: ${options.zIndex};
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        transition: opacity 0.2s ease;
      `

            document.body.appendChild(overlay)
            overlays.push(overlay)
        }

        return overlays
    }

    /**
     * 清除選擇覆蓋層
     */
    static clearSelectionOverlay(className = DEFAULT_CONFIG.overlayClassName): void {
        const overlays = document.querySelectorAll(`.${className}`)
        overlays.forEach(overlay => overlay.remove())
    }

    /**
     * 清除瀏覽器原生選擇
     */
    static clearNativeSelection(): void {
        window.getSelection()?.removeAllRanges()
    }

    /**
     * 隱藏原生選擇的視覺效果，但保留選擇功能
     */
    static hideNativeSelection(): void {
        const style = document.getElementById('hide-native-selection')
        if (!style) {
            const styleElement = document.createElement('style')
            styleElement.id = 'hide-native-selection'
            styleElement.textContent = `
                html *, html *::selection, html *::-moz-selection {
                    background: transparent !important;
                    color: inherit !important;
                }
                
                /* 更強的選擇器 */
                html body *, 
                html body *::selection, 
                html body *::-moz-selection,
                [data-selection-disabled] *::selection,
                [data-selection-disabled] *::-moz-selection {
                    background: transparent !important;
                    color: inherit !important;
                    text-shadow: none !important;
                }
            `
            document.head.appendChild(styleElement)

            // 添加 data 屬性到 body
            document.body.setAttribute('data-selection-disabled', 'true')
        }
    }

    /**
     * 恢復原生選擇的視覺效果
     */
    static showNativeSelection(): void {
        const style = document.getElementById('hide-native-selection')
        if (style) {
            style.remove()
        }
        // 移除 data 屬性
        document.body.removeAttribute('data-selection-disabled')
    }

    /**
     * 計算選單位置
     */
    static calculateMenuPosition(
        rects: DOMRect[],
        containerElement: HTMLElement,
        menuWidth = 180,
        menuHeight = 40
    ): { left: number; top: number } | null {
        if (rects.length === 0) return null

        let leftMost = Infinity
        let rightMost = -Infinity
        let topMost = Infinity
        let bottomMost = -Infinity

        for (const rect of rects) {
            if (rect.width > 0) {
                leftMost = Math.min(leftMost, rect.left)
                rightMost = Math.max(rightMost, rect.right)
                topMost = Math.min(topMost, rect.top)
                bottomMost = Math.max(bottomMost, rect.bottom)
            }
        }

        const containerRect = containerElement.getBoundingClientRect()
        const centerX = (leftMost + rightMost) / 2
        const relativeLeft = centerX - containerRect.left - menuWidth / 2

        // 將選單放在選擇文字的上方，留 8px 間距
        const relativeTop = topMost - containerRect.top - menuHeight - 8

        return {
            left: Math.max(0, Math.min(relativeLeft, containerRect.width - menuWidth)),
            top: Math.max(0, relativeTop) // 確保不會超出容器頂部
        }
    }

    /**
     * 檢查點擊是否在容器外
     */
    static isClickOutside(event: MouseEvent, containerElement: HTMLElement, excludeSelectors: string[] = []): boolean {
        const target = event.target as Element

        // 檢查排除的選擇器
        for (const selector of excludeSelectors) {
            if (target.closest(selector)) return false
        }

        return !containerElement.contains(target)
    }
} 