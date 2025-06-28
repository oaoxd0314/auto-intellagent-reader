import { useState, useCallback, useMemo } from 'react'
import { useInteraction } from '../contexts/InteractionContext'
import { InteractionController } from '../controllers/InteractionController'
// import type { PostInteraction } from '../types/post' // 暫時移除未使用的導入

/**
 * Reply Post Hook - 封裝文章回覆的所有邏輯
 * 遵循架構設計：UI 只與 Hook 交互，Hook 調用 Controller
 */
export function useReplyPost(postId: string) {
    const { getInteractionsByType } = useInteraction()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // 獲取 controller 實例
    const controller = useMemo(() => InteractionController.getInstance(), [])

    // 獲取該文章的所有回覆
    const replies = useMemo(
        () => getInteractionsByType(postId, 'reply'),
        [getInteractionsByType, postId]
    )

    // 添加回覆
    const addReply = useCallback(async (content: string): Promise<void> => {
        if (isSubmitting) return

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await controller.addReply(postId, content)
            // 成功後 Context 會自動更新，無需手動處理
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add reply'
            setSubmitError(errorMessage)
            throw error // 重新拋出錯誤，讓 UI 組件可以處理
        } finally {
            setIsSubmitting(false)
        }
    }, [controller, postId, isSubmitting])

    // 刪除回覆
    const deleteReply = useCallback(async (replyId: string): Promise<void> => {
        try {
            await controller.deleteReply(replyId)
            // 成功後 Context 會自動更新
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete reply'
            console.error(errorMessage)
            throw error
        }
    }, [controller])

    // 編輯回覆
    const editReply = useCallback(async (replyId: string, content: string): Promise<void> => {
        try {
            await controller.editReply(replyId, content)
            // 成功後 Context 會自動更新
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to edit reply'
            console.error(errorMessage)
            throw error
        }
    }, [controller])

    // 清除提交錯誤
    const clearSubmitError = useCallback(() => {
        setSubmitError(null)
    }, [])

    // 驗證回覆內容
    const validateReplyContent = useCallback((content: string): string | null => {
        const trimmedContent = content.trim()

        if (!trimmedContent) {
            return '回覆內容不能為空'
        }

        if (trimmedContent.length < 3) {
            return '回覆內容至少需要 3 個字符'
        }

        if (trimmedContent.length > 1000) {
            return '回覆內容不能超過 1000 個字符'
        }

        return null
    }, [])

    // 檢查是否可以提交
    const canSubmit = useCallback((content: string): boolean => {
        return !isSubmitting && validateReplyContent(content) === null
    }, [isSubmitting, validateReplyContent])

    // 獲取回覆統計
    const replyStats = useMemo(() => ({
        total: replies.length,
        hasReplies: replies.length > 0
    }), [replies.length])

    // 按時間排序回覆（最新的在前）
    const sortedReplies = useMemo(() => {
        return [...replies].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    }, [replies])

    return {
        // 數據
        replies: sortedReplies,
        replyStats,

        // 狀態
        isSubmitting,
        submitError,

        // 操作方法
        addReply,
        deleteReply,
        editReply,

        // 工具方法
        validateReplyContent,
        canSubmit,
        clearSubmitError
    }
} 