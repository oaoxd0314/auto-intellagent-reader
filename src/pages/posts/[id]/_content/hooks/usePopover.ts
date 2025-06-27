import { useCallback, useMemo } from 'react'
import { usePopoverContext, type PopoverType } from '../contexts/PopoverContext'
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

const targetSettings: Record<Exclude<PopoverType, 'menu'>, PopoverConfig> = {
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
        offset: { x: 0, y: 100 },
        alignment: 'center',
        containerSelector: 'article.relative',
        hasInteraction: true,
        hasSelectedText: false,
        hasPosition: false
    }
}

export function usePopover() {
    const { target, setTarget } = usePopoverContext()

    // 直接計算狀態，避免複雜的 useMemo 依賴
    const commentState = {
        isActive: target?.type === 'comment',
        data: target?.type === 'comment' ? {
            interaction: target?.interaction || null,
            selectedText: null,
            position: null
        } : null
    }

    const highlightState = {
        isActive: target?.type === 'highlight',
        data: target?.type === 'highlight' ? {
            interaction: target?.interaction || null,
            selectedText: null,
            position: null
        } : null
    }

    // 通用的 popover 狀態檢查函數（排除 menu）
    const getPopoverState = useCallback((popoverType: Exclude<PopoverType, 'menu'>) => {
        const isActive = target?.type === popoverType
        const config = targetSettings[popoverType]

        return {
            isActive,
            data: isActive ? {
                interaction: config.hasInteraction ? target?.interaction || null : null,
                selectedText: config.hasSelectedText ? target?.selectedText || null : null,
                position: config.hasPosition ? target?.position || null : null
            } : null
        }
    }, [target])

    // 通用位置計算函數（排除 menu）
    const calculatePosition = useCallback((popoverType: Exclude<PopoverType, 'menu'>) => {
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
        if (!target || target.type === 'menu') return null
        return calculatePosition(target.type as Exclude<PopoverType, 'menu'>)
    }, [target, calculatePosition])

    // 設置不同類型的 target（排除 menu）
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
        // 狀態 API（配置驅動，排除 menu）
        commentState,
        highlightState,
        getPopoverState,

        // 位置
        getPopoverPosition,

        // 控制函數（排除 menu）
        setCommentTarget,
        setHighlightTarget,
        closePopover,

        // 配置（用於調試或擴展）
        targetSettings
    }
} 