import { useState, useCallback, useMemo } from 'react'
import { useInteraction } from '../contexts/InteractionContext'
import { InteractionController } from '../controllers/InteractionController'
import type { PostInteraction } from '../types/post'

/**
 * Mark Section Hook - 處理段落高亮功能
 * 遵循架構設計：UI 只與 Hook 交互，Hook 調用 Controller
 */
export function useMarkSection(postId: string) {
    const { getInteractionsByType } = useInteraction()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // 獲取 controller 實例
    const controller = useMemo(() => InteractionController.getInstance(), [])

    // 獲取該文章的所有高亮
    const highlights = useMemo(
        () => getInteractionsByType(postId, 'mark'),
        [getInteractionsByType, postId]
    )

    // 按 section 分組的高亮
    const highlightsBySectionId = useMemo(() => {
        const grouped: Record<string, PostInteraction[]> = {}

        highlights.forEach(highlight => {
            const sectionId = highlight.position?.sectionId
            if (sectionId) {
                if (!grouped[sectionId]) {
                    grouped[sectionId] = []
                }
                grouped[sectionId].push(highlight)
            }
        })

        return grouped
    }, [highlights])

    // 獲取高亮的 section ID 集合
    const highlightedSectionIds = useMemo(() => {
        return new Set(Object.keys(highlightsBySectionId))
    }, [highlightsBySectionId])

    // 添加高亮
    const addHighlight = useCallback(async (
        sectionId: string,
        selectedText: string
    ): Promise<void> => {
        if (isSubmitting) return

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await controller.addHighlight(postId, sectionId, selectedText)
            // 成功後 Context 會自動更新，無需手動處理
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add highlight'
            setSubmitError(errorMessage)
            throw error
        } finally {
            setIsSubmitting(false)
        }
    }, [controller, postId, isSubmitting])

    // 移除高亮
    const removeHighlight = useCallback(async (highlightId: string): Promise<void> => {
        try {
            await controller.removeHighlight(highlightId)
            // 成功後 Context 會自動更新
        } catch (error) {
            throw error
        }
    }, [controller])

    // 移除某個 section 的所有高亮
    const removeHighlightsBySection = useCallback(async (sectionId: string): Promise<void> => {
        const sectionHighlights = highlightsBySectionId[sectionId] || []

        try {
            // 並行刪除所有高亮
            await Promise.all(
                sectionHighlights.map(highlight => controller.removeHighlight(highlight.id))
            )
        } catch (error) {
            throw error
        }
    }, [controller, highlightsBySectionId])

    // 獲取特定 section 的高亮
    const getHighlightsBySectionId = useCallback((sectionId: string): PostInteraction[] => {
        return highlightsBySectionId[sectionId] || []
    }, [highlightsBySectionId])

    // 檢查某個 section 是否有高亮
    const hasHighlight = useCallback((sectionId: string): boolean => {
        return highlightedSectionIds.has(sectionId)
    }, [highlightedSectionIds])

    // 檢查某段文字是否已經被高亮
    const isTextHighlighted = useCallback((sectionId: string, selectedText: string): boolean => {
        const sectionHighlights = highlightsBySectionId[sectionId] || []
        return sectionHighlights.some(highlight =>
            highlight.selectedText === selectedText.trim()
        )
    }, [highlightsBySectionId])

    // 清除提交錯誤
    const clearSubmitError = useCallback(() => {
        setSubmitError(null)
    }, [])

    // 獲取高亮統計
    const highlightStats = useMemo(() => ({
        total: highlights.length,
        sections: highlightedSectionIds.size,
        hasHighlights: highlights.length > 0
    }), [highlights.length, highlightedSectionIds.size])

    // 按時間排序高亮（最新的在前）
    const sortedHighlights = useMemo(() => {
        return [...highlights].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    }, [highlights])

    return {
        // 數據
        highlights: sortedHighlights,
        highlightsBySectionId,
        highlightedSectionIds,
        highlightStats,

        // 狀態
        isSubmitting,
        submitError,

        // 操作方法
        addHighlight,
        removeHighlight,
        removeHighlightsBySection,

        // 查詢方法
        getHighlightsBySectionId,
        hasHighlight,
        isTextHighlighted,

        // 工具方法
        clearSubmitError
    }
} 