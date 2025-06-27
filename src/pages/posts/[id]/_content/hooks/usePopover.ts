import { useCallback, useState } from 'react'
import type { PostInteraction } from '../../../../../types/post'

// 簡單的 popover 狀態
type PopoverState = {
    type: 'comment' | 'highlight'
    interaction: PostInteraction
    position: { top: number; left: number }
} | null

export function usePopover() {
    const [popoverState, setPopoverState] = useState<PopoverState>(null)

    /**
     * 根據 interaction ID 計算 popover 位置
     */
    const calculatePosition = useCallback((interactionId: string, popoverType: 'comment' | 'highlight') => {
        // 直接找到目標元素
        const targetElement = document.querySelector(`[data-interaction-id="${interactionId}"]`)
        if (!targetElement) {
            console.warn(`Element not found for interaction: ${interactionId}`)
            return null
        }

        // 獲取元素位置
        const rect = targetElement.getBoundingClientRect()

        // 獲取 navbar 高度
        const navbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 68

        // 根據 popover 類型設定高度
        const POPOVER_HEIGHT = popoverType === 'comment' ? 200 : 60
        const VISUAL_PADDING = 8 // 視覺間距

        return {
            top: rect.top - POPOVER_HEIGHT - navbarHeight - VISUAL_PADDING,
            left: rect.left + (rect.width / 2) - 100 // 居中對齊，假設 popover 寬度 200px
        }
    }, [])

    /**
     * 顯示 comment popover
     */
    const showCommentPopover = useCallback((interaction: PostInteraction) => {
        const position = calculatePosition(interaction.id, 'comment')
        if (!position) return

        setPopoverState({
            type: 'comment',
            interaction,
            position
        })
    }, [calculatePosition])

    /**
     * 顯示 highlight popover
     */
    const showHighlightPopover = useCallback((interaction: PostInteraction) => {
        const position = calculatePosition(interaction.id, 'highlight')
        if (!position) return

        setPopoverState({
            type: 'highlight',
            interaction,
            position
        })
    }, [calculatePosition])

    /**
     * 關閉 popover
     */
    const closePopover = useCallback(() => {
        setPopoverState(null)
    }, [])

    // 計算各種狀態
    const commentState = {
        isActive: popoverState?.type === 'comment',
        data: popoverState?.type === 'comment' ? {
            interaction: popoverState.interaction,
            position: popoverState.position
        } : null
    }

    const highlightState = {
        isActive: popoverState?.type === 'highlight',
        data: popoverState?.type === 'highlight' ? {
            interaction: popoverState.interaction,
            position: popoverState.position
        } : null
    }

    return {
        // 狀態
        commentState,
        highlightState,

        // 控制函數
        showCommentPopover,
        showHighlightPopover,
        closePopover
    }
} 