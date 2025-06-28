import { useEffect, type RefObject } from 'react'
import type { PostInteraction } from '../types/post'

type UseTextMarkingProps = {
    interactions: PostInteraction[]
    contentRef: RefObject<HTMLElement | null>
    onCommentClick?: (interaction: PostInteraction) => void
    onHighlightClick?: (interaction: PostInteraction) => void
    onCommentView?: (interaction: PostInteraction) => void
}

/**
 * 文字標記 Hook - 在 DOM 中顯示已有的 highlights 和 comments
 */
export function useTextMarking({
    interactions,
    contentRef,
    onCommentClick,
    onHighlightClick,
    onCommentView
}: UseTextMarkingProps) {

    useEffect(() => {
        if (!contentRef.current || interactions.length === 0) return

        // 清除現有標記
        clearExistingMarks()

        // 為每個互動添加視覺標記
        interactions.forEach(interaction => {
            if (interaction.type === 'mark' || interaction.type === 'comment') {
                addInteractionMark(interaction)
            }
        })

        return () => {
            clearExistingMarks()
        }
    }, [interactions, contentRef.current])

    const clearExistingMarks = () => {
        if (!contentRef.current) return

        // 移除所有標記元素
        const existingMarks = contentRef.current.querySelectorAll('[data-interaction-id]')
        existingMarks.forEach(mark => {
            const parent = mark.parentNode
            if (parent) {
                // 將標記的文字內容還原
                parent.replaceChild(document.createTextNode(mark.textContent || ''), mark)
                parent.normalize() // 合併相鄰的文字節點
            }
        })
    }

    const addInteractionMark = (interaction: PostInteraction) => {
        if (!contentRef.current || !interaction.selectedText || !interaction.position) return

        try {
            // 尋找包含選擇文字的文字節點
            const walker = document.createTreeWalker(
                contentRef.current,
                NodeFilter.SHOW_TEXT,
                null
            )

            let node: Text | null
            let currentOffset = 0

            while (node = walker.nextNode() as Text) {
                const nodeText = node.textContent || ''
                const nodeStart = currentOffset
                const nodeEnd = currentOffset + nodeText.length

                // 檢查這個節點是否包含我們要標記的文字
                if (nodeStart <= interaction.position.start && interaction.position.end <= nodeEnd) {
                    const relativeStart = interaction.position.start - nodeStart
                    const relativeEnd = interaction.position.end - nodeStart

                    // 分割文字節點
                    const beforeText = nodeText.substring(0, relativeStart)
                    const selectedText = nodeText.substring(relativeStart, relativeEnd)
                    const afterText = nodeText.substring(relativeEnd)

                    if (selectedText === interaction.selectedText) {
                        // 創建標記元素
                        const markElement = document.createElement('span')
                        markElement.textContent = selectedText
                        markElement.setAttribute('data-interaction-id', interaction.id)
                        markElement.style.cursor = 'pointer'

                        if (interaction.type === 'mark') {
                            markElement.className = 'bg-yellow-200 hover:bg-yellow-300 transition-colors text-highlight'
                            markElement.addEventListener('click', () => {
                                onHighlightClick?.(interaction)
                            })
                        } else if (interaction.type === 'comment') {
                            markElement.className = 'bg-blue-200 hover:bg-blue-300 transition-colors border-b-2 border-blue-400 text-comment relative'

                            // 添加留言 icon
                            const commentIcon = document.createElement('span')
                            commentIcon.className = 'absolute -top-1 -right-1 text-xs text-blue-600'
                            commentIcon.textContent = '💬'
                            commentIcon.style.fontSize = '10px'
                            markElement.appendChild(commentIcon)

                            // 點擊標記文字顯示操作選單
                            markElement.addEventListener('click', (e) => {
                                e.stopPropagation()
                                onCommentClick?.(interaction)
                            })

                            // 點擊 icon 顯示留言內容
                            commentIcon.addEventListener('click', (e) => {
                                e.stopPropagation()
                                onCommentView?.(interaction)
                            })
                        }

                        // 替換原文字節點
                        const parent = node.parentNode
                        if (parent) {
                            // 創建新的文字節點
                            if (beforeText) {
                                parent.insertBefore(document.createTextNode(beforeText), node)
                            }
                            parent.insertBefore(markElement, node)
                            if (afterText) {
                                parent.insertBefore(document.createTextNode(afterText), node)
                            }
                            parent.removeChild(node)
                        }
                        break
                    }
                }

                currentOffset = nodeEnd
            }
        } catch (error) {
            console.warn('Failed to add interaction mark:', error)
        }
    }
} 