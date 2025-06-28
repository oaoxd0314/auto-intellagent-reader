import { useCallback, useState } from 'react'
import type { PostInteraction } from '../types/post'

// 定位配置類型
type PositionConfig = {
    placement: 'top' | 'bottom' | 'left' | 'right'
    offset: number
    alignment: 'start' | 'center' | 'end'
    useSelection?: boolean // 是否使用文字選擇範圍而非 interaction 元素
}

// popover 類型配置
const POPOVER_CONFIGS: Record<string, PositionConfig> = {
    // 文字選擇操作選單 - 在選擇文字下方
    textSelectionMenu: {
        placement: 'bottom',
        offset: 8,
        alignment: 'center',
        useSelection: true
    },
    // 標記取消選單 - 在標記上方
    markActions: {
        placement: 'top',
        offset: 8,
        alignment: 'center',
        useSelection: false
    },
    // 留言取消選單 - 在留言上方  
    commentActions: {
        placement: 'top',
        offset: 8,
        alignment: 'center',
        useSelection: false
    },
    // 留言展開 - 在留言下方
    commentView: {
        placement: 'bottom',
        offset: 8,
        alignment: 'start',
        useSelection: false
    }
}

// popover 狀態類型
type PopoverState = {
    type: 'textSelectionMenu' | 'markActions' | 'commentActions' | 'commentView'
    interaction?: PostInteraction
    position: { top: number; left: number }
    data?: any // 額外數據
} | null

export function usePopover() {
    const [popoverState, setPopoverState] = useState<PopoverState>(null)

    /**
     * 獲取文字選擇範圍的位置
     */
    const getSelectionRect = useCallback(() => {
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return null

        const range = selection.getRangeAt(0)
        return range.getBoundingClientRect()
    }, [])

    /**
     * 獲取 interaction 元素的位置
     */
    const getInteractionRect = useCallback((interactionId: string) => {
        const targetElement = document.querySelector(`[data-interaction-id="${interactionId}"]`)
        if (!targetElement) {
            console.warn(`Element not found for interaction: ${interactionId}`)
            return null
        }
        return targetElement.getBoundingClientRect()
    }, [])

    /**
     * 獲取自定義元素的位置
     */
    const getElementRect = useCallback((element: HTMLElement) => {
        return element.getBoundingClientRect()
    }, [])

    /**
     * 根據配置計算 popover 位置
     */
    const calculatePosition = useCallback((
        popoverType: string,
        interactionId?: string,
        customElement?: HTMLElement
    ) => {
        const config = POPOVER_CONFIGS[popoverType]
        if (!config) {
            console.warn(`No config found for popover type: ${popoverType}`)
            return null
        }

        // 獲取目標矩形
        let targetRect: DOMRect | null = null

        if (customElement) {
            targetRect = getElementRect(customElement)
        } else if (config.useSelection) {
            targetRect = getSelectionRect()
        } else if (interactionId) {
            targetRect = getInteractionRect(interactionId)
        }

        if (!targetRect) return null

        // 獲取 navbar 高度和視窗資訊
        const navbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 68
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // 計算基礎位置
        let top = 0
        let left = 0

        // 根據 placement 計算位置
        switch (config.placement) {
            case 'top':
                top = targetRect.top - config.offset + window.scrollY
                break
            case 'bottom':
                top = targetRect.bottom + config.offset + window.scrollY
                break
            case 'left':
                left = targetRect.left - config.offset
                top = targetRect.top + window.scrollY
                break
            case 'right':
                left = targetRect.right + config.offset
                top = targetRect.top + window.scrollY
                break
        }

        // 根據 alignment 調整位置
        if (config.placement === 'top' || config.placement === 'bottom') {
            const popoverWidth = 200 // 預估 popover 寬度

            switch (config.alignment) {
                case 'start':
                    left = targetRect.left
                    break
                case 'center':
                    left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2)
                    break
                case 'end':
                    left = targetRect.right - popoverWidth
                    break
            }

            // 防止超出視窗邊界
            left = Math.max(8, Math.min(left, viewportWidth - popoverWidth - 8))
        } else if (config.placement === 'left' || config.placement === 'right') {
            const popoverHeight = 60 // 預估 popover 高度

            switch (config.alignment) {
                case 'start':
                    top = targetRect.top + window.scrollY
                    break
                case 'center':
                    top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2) + window.scrollY
                    break
                case 'end':
                    top = targetRect.bottom - popoverHeight + window.scrollY
                    break
            }
        }

        return { top, left }
    }, [getSelectionRect, getInteractionRect, getElementRect])

    /**
     * 顯示文字選擇操作選單
     */
    const showTextSelectionMenu = useCallback((data?: any) => {
        const position = calculatePosition('textSelectionMenu')
        if (!position) return

        setPopoverState({
            type: 'textSelectionMenu',
            position,
            data
        })
    }, [calculatePosition])

    /**
     * 顯示標記操作選單
     */
    const showMarkActions = useCallback((interaction: PostInteraction) => {
        const position = calculatePosition('markActions', interaction.id)
        if (!position) return

        setPopoverState({
            type: 'markActions',
            interaction,
            position
        })
    }, [calculatePosition])

    /**
     * 顯示留言操作選單
     */
    const showCommentActions = useCallback((interaction: PostInteraction) => {
        const position = calculatePosition('commentActions', interaction.id)
        if (!position) return

        setPopoverState({
            type: 'commentActions',
            interaction,
            position
        })
    }, [calculatePosition])

    /**
     * 顯示留言展開
     */
    const showCommentView = useCallback((interaction: PostInteraction) => {
        const position = calculatePosition('commentView', interaction.id)
        if (!position) return

        setPopoverState({
            type: 'commentView',
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
    const textSelectionMenuState = {
        isActive: popoverState?.type === 'textSelectionMenu',
        data: popoverState?.type === 'textSelectionMenu' ? {
            position: popoverState.position,
            data: popoverState.data
        } : null
    }

    const markActionsState = {
        isActive: popoverState?.type === 'markActions',
        data: popoverState?.type === 'markActions' ? {
            interaction: popoverState.interaction!,
            position: popoverState.position
        } : null
    }

    const commentActionsState = {
        isActive: popoverState?.type === 'commentActions',
        data: popoverState?.type === 'commentActions' ? {
            interaction: popoverState.interaction!,
            position: popoverState.position
        } : null
    }

    const commentViewState = {
        isActive: popoverState?.type === 'commentView',
        data: popoverState?.type === 'commentView' ? {
            interaction: popoverState.interaction!,
            position: popoverState.position
        } : null
    }

    return {
        // 狀態
        textSelectionMenuState,
        markActionsState,
        commentActionsState,
        commentViewState,

        // 控制函數
        showTextSelectionMenu,
        showMarkActions,
        showCommentActions,
        showCommentView,
        closePopover,

        // 配置（供外部查看或擴展）
        configs: POPOVER_CONFIGS
    }
} 