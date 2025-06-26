import { useEffect, useCallback } from 'react'
import type { PostInteraction } from '../../../../../types/post'

interface UseTextMarkingProps {
    interactions: PostInteraction[]
    contentRef: React.RefObject<HTMLDivElement | null>
    onCommentClick: (interaction: PostInteraction) => void
    onHighlightClick: (interaction: PostInteraction) => void
}

export function useTextMarking({ interactions, contentRef, onCommentClick, onHighlightClick }: UseTextMarkingProps) {

    /**
 * 創建 comment 圖標元素
 */
    const createCommentIcon = useCallback((interaction: PostInteraction) => {
        const icon = document.createElement('span')
        icon.className = 'comment-icon inline-block ml-1 cursor-pointer hover:scale-110 transition-transform'
        icon.innerHTML = '💬'
        icon.style.cssText = `
      font-size: 14px;
      position: relative;
      top: -1px;
    `
        icon.setAttribute('data-interaction-id', interaction.id)
        icon.addEventListener('click', (e) => {
            e.stopPropagation()
            onCommentClick(interaction)
        })
        return icon
    }, [onCommentClick])

    /**
     * 清除所有標記
     */
    const clearAllMarks = useCallback(() => {
        if (!contentRef.current) return

        // 移除所有 highlight
        const highlights = contentRef.current.querySelectorAll('.text-highlight')
        highlights.forEach(el => {
            const parent = el.parentNode
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent || ''), el)
                parent.normalize()
            }
        })

        // 移除所有 comment 圖標
        const commentIcons = contentRef.current.querySelectorAll('.comment-icon')
        commentIcons.forEach(icon => icon.remove())
    }, [])

    /**
 * 根據 sectionId 找到對應的段落元素
 */
    const findSectionElement = useCallback((sectionId: string): Element | null => {
        if (!contentRef.current) return null
        return contentRef.current.querySelector(`#${CSS.escape(sectionId)}`)
    }, [])

    /**
 * 應用標記到指定範圍
 */
    const applyMarkToRange = useCallback((range: Range, interaction: PostInteraction) => {
        const selectedTextContent = range.toString()

        // 創建標記元素
        const highlightSpan = document.createElement('span')
        highlightSpan.className = 'text-highlight'
        highlightSpan.textContent = selectedTextContent

        if (interaction.type === 'mark') {
            // 純 highlight - 簡單綠色背景
            highlightSpan.style.cssText = `
        background-color: rgba(130, 255, 173, 0.4);
        cursor: pointer;
      `
        } else if (interaction.type === 'comment') {
            // comment highlight - 簡單黃色背景
            highlightSpan.style.cssText = `
        background-color: rgba(251, 191, 36, 0.4);
        cursor: pointer;
      `
        }

        highlightSpan.setAttribute('data-interaction-id', interaction.id)

        // 添加點擊事件
        highlightSpan.addEventListener('click', (e) => {
            e.stopPropagation()
            onHighlightClick(interaction)
        })

        // 替換範圍內容
        range.deleteContents()
        range.insertNode(highlightSpan)
    }, [createCommentIcon])

    /**
     * 回退方法：在元素內根據文字內容標記
     */
    const markTextByContent = useCallback((
        element: Element,
        interaction: PostInteraction
    ) => {
        if (!interaction.selectedText) return

        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null
        )

        const textNodes: Text[] = []
        let node
        while (node = walker.nextNode()) {
            textNodes.push(node as Text)
        }

        for (const textNode of textNodes) {
            const text = textNode.textContent || ''
            const selectedText = interaction.selectedText
            const index = text.indexOf(selectedText)

            if (index !== -1) {
                try {
                    const range = document.createRange()
                    range.setStart(textNode, index)
                    range.setEnd(textNode, index + selectedText.length)
                    applyMarkToRange(range, interaction)
                    break // 只標記第一個匹配
                } catch (error) {
                    console.warn('Failed to mark text by content:', error)
                }
            }
        }
    }, [applyMarkToRange])

    /**
     * 在指定元素內根據位置精確標記文字
     */
    const markTextInElement = useCallback((
        element: Element,
        interaction: PostInteraction
    ) => {
        if (!interaction.selectedText || !interaction.position) return

        const { start, end } = interaction.position
        const selectedText = interaction.selectedText

        // 獲取元素內的所有文字節點
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null
        )

        const textNodes: Text[] = []
        let node
        while (node = walker.nextNode()) {
            textNodes.push(node as Text)
        }

        // 計算累積字元位置，找到對應的文字節點和偏移
        let currentOffset = 0
        let startNode: Text | null = null
        let endNode: Text | null = null
        let startOffsetInNode = 0
        let endOffsetInNode = 0

        for (const textNode of textNodes) {
            const nodeText = textNode.textContent || ''
            const nodeLength = nodeText.length

            // 找到開始位置
            if (!startNode && currentOffset + nodeLength > start) {
                startNode = textNode
                startOffsetInNode = start - currentOffset
            }

            // 找到結束位置
            if (!endNode && currentOffset + nodeLength >= end) {
                endNode = textNode
                endOffsetInNode = end - currentOffset
                break
            }

            currentOffset += nodeLength
        }

        // 如果找不到精確位置，回退到文字匹配
        if (!startNode || !endNode) {
            markTextByContent(element, interaction)
            return
        }

        try {
            // 創建精確的範圍
            const range = document.createRange()
            range.setStart(startNode, startOffsetInNode)
            range.setEnd(endNode, endOffsetInNode)

            const rangeText = range.toString()

            // 驗證文字是否匹配（允許一些空白字元的差異）
            if (rangeText.trim() !== selectedText.trim()) {
                console.warn('Text mismatch, falling back to content matching:', {
                    expected: selectedText,
                    actual: rangeText,
                    sectionId: interaction.position.sectionId
                })
                markTextByContent(element, interaction)
                return
            }

            // 應用標記
            applyMarkToRange(range, interaction)
        } catch (error) {
            console.warn('Failed to mark text by position:', error)
            markTextByContent(element, interaction)
        }
    }, [markTextByContent, applyMarkToRange])

    /**
 * 在段落末尾添加 comment 圖標
 */
    const addCommentIconsToSectionEnd = useCallback((
        sectionElement: Element,
        commentInteractions: PostInteraction[]
    ) => {
        // 為每個 comment 創建圖標並添加到段落末尾
        commentInteractions.forEach(interaction => {
            const icon = createCommentIcon(interaction)
            icon.style.marginLeft = '4px' // 添加一些間距
            sectionElement.appendChild(icon)
        })
    }, [createCommentIcon])

    /**
     * 應用文字標記 - 使用精確的段落定位
     */
    const applyTextMarks = useCallback(() => {
        if (!contentRef.current) return

        clearAllMarks()

        // 按照段落和位置排序互動記錄
        const sortedInteractions = [...interactions].sort((a, b) => {
            // 先按段落排序
            const sectionA = a.position?.sectionId || ''
            const sectionB = b.position?.sectionId || ''
            if (sectionA !== sectionB) {
                return sectionA.localeCompare(sectionB)
            }

            // 同段落內按位置排序
            if (a.position?.start !== b.position?.start) {
                return (a.position?.start || 0) - (b.position?.start || 0)
            }
            return (a.position?.end || 0) - (b.position?.end || 0)
        })

        // 按段落分組處理
        const interactionsBySection = new Map<string, PostInteraction[]>()

        sortedInteractions.forEach(interaction => {
            if (!interaction.selectedText || !interaction.position?.sectionId) return

            const sectionId = interaction.position.sectionId
            if (!interactionsBySection.has(sectionId)) {
                interactionsBySection.set(sectionId, [])
            }
            interactionsBySection.get(sectionId)!.push(interaction)
        })

        // 為每個段落應用標記
        interactionsBySection.forEach((sectionInteractions, sectionId) => {
            const sectionElement = findSectionElement(sectionId)
            if (!sectionElement) {
                console.warn(`Section element not found: ${sectionId}`)
                return
            }

            // 在該段落內依次應用標記
            sectionInteractions.forEach(interaction => {
                markTextInElement(sectionElement, interaction)
            })

            // 檢查該段落是否有 comment，統一在段落末尾添加圖標
            const commentInteractions = sectionInteractions.filter(i => i.type === 'comment')
            if (commentInteractions.length > 0) {
                addCommentIconsToSectionEnd(sectionElement, commentInteractions)
            }
        })
    }, [interactions, clearAllMarks, findSectionElement, markTextInElement, addCommentIconsToSectionEnd])

    /**
     * 當互動記錄變化時重新應用標記
     */
    useEffect(() => {
        const timer = setTimeout(applyTextMarks, 100)
        return () => clearTimeout(timer)
    }, [applyTextMarks])

    return {
        applyTextMarks,
        clearAllMarks
    }
} 