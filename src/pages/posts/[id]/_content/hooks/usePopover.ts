import { useCallback, useMemo } from 'react'
import { usePopoverContext, type PopoverTarget, type PopoverType } from '../contexts/PopoverContext'
import type { PostInteraction } from '../../../../../types/post'

// Popover 配置
interface PopoverConfig {
    positioning: 'relative'
    offset: { x: number; y: number }
    alignment: 'left' | 'center' | 'right'
    containerSelector?: string
    hasInteraction: boolean // 是否需要 interaction 數據
    hasSelectedText: boolean // 是否需要選中文字
    hasPosition: boolean // 是否需要位置信息
}

const targetSettings: Record<PopoverType, PopoverConfig> = {
    menu: {
        positioning: 'relative',
        offset: { x: 0, y: 0 },
        alignment: 'center',
        hasInteraction: false,
        hasSelectedText: true,
        hasPosition: true
    },
    comment: {
        positioning: 'relative',
        offset: { x: 0, y: 5 },
        alignment: 'left',
        containerSelector: 'article.relative',
        hasInteraction: true,
        hasSelectedText: false,
        hasPosition: false
    },
    highlight: {
        positioning: 'relative',
        offset: { x: 0, y: -60 },
        alignment: 'center',
        containerSelector: 'article.relative',
        hasInteraction: true,
        hasSelectedText: false,
        hasPosition: false
    }
}

export function usePopover() {
    const { target, setTarget } = usePopoverContext()

    // 通用的 popover 狀態檢查函數
    const getPopoverState = useCallback((popoverType: PopoverType) => {
        const isActive = target?.type === popoverType
        const config = targetSettings[popoverType]

        return {
            isActive,
            data: isActive ? {
                interaction: config.hasInteraction ? target?.interaction || null : null,
                selectedText: config.hasSelectedText ? target?.selectedText || null : null,
                position: config.hasPosition ? target?.position || null : null,
                menuPosition: popoverType === 'menu' && target ? {
                    left: target.rect.left,
                    top: target.rect.bottom
                } : null
            } : null
        }
    }, [target])

    // 各種 popover 的狀態
    const menuState = useMemo(() => getPopoverState('menu'), [getPopoverState])
    const commentState = useMemo(() => getPopoverState('comment'), [getPopoverState])
    const highlightState = useMemo(() => getPopoverState('highlight'), [getPopoverState])

    // 通用位置計算函數
    const calculatePosition = useCallback((popoverType: PopoverType) => {
        const state = getPopoverState(popoverType)
        if (!state.isActive || !target) return null

        const config = targetSettings[popoverType]
        const rect = target.rect

        // 如果需要容器定位
        if (config.containerSelector) {
            const container = document.querySelector(config.containerSelector)
            if (!container) {
                // 回退到 viewport 定位
                return {
                    top: rect.top + config.offset.y,
                    left: rect.left + config.offset.x + (config.alignment === 'center' ? rect.width / 2 : 0)
                }
            }

            const containerRect = container.getBoundingClientRect()
            let left = rect.left - containerRect.left + config.offset.x
            let top = rect.top - containerRect.top + config.offset.y

            // 處理對齊方式
            if (config.alignment === 'center') {
                left += rect.width / 2
            }

            return { top, left }
        }

        // 直接使用 rect 位置
        let left = rect.left + config.offset.x
        let top = rect.top + config.offset.y

        if (config.alignment === 'center') {
            left += rect.width / 2
        }

        return { top, left }
    }, [getPopoverState, target])

    // 獲取 popover 位置
    const getPopoverPosition = useCallback(() => {
        if (!target) return null
        return calculatePosition(target.type)
    }, [target, calculatePosition])

    // 設置不同類型的 target
    const setMenuTarget = useCallback((element: HTMLElement, selectedText: string, position: any) => {
        const rect = element.getBoundingClientRect()
        setTarget({
            type: 'menu',
            element,
            rect,
            selectedText,
            position
        })
    }, [setTarget])

    const setCommentTarget = useCallback((element: HTMLElement, interaction: PostInteraction) => {
        const rect = element.getBoundingClientRect()
        setTarget({
            type: 'comment',
            element,
            rect,
            interaction
        })
    }, [setTarget])

    const setHighlightTarget = useCallback((element: HTMLElement, interaction: PostInteraction) => {
        const rect = element.getBoundingClientRect()
        setTarget({
            type: 'highlight',
            element,
            rect,
            interaction
        })
    }, [setTarget])

    // 關閉所有 popover
    const closePopover = useCallback(() => setTarget(null), [setTarget])

    return {
        // 狀態 API（配置驅動）
        menuState,
        commentState,
        highlightState,
        getPopoverState,

        // 位置
        getPopoverPosition,

        // 控制函數
        setMenuTarget,
        setCommentTarget,
        setHighlightTarget,
        closePopover,

        // 配置（用於調試或擴展）
        targetSettings
    }
} 