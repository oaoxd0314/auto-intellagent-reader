import { useMemo, useCallback, useState } from 'react'
import { useInteraction } from '../contexts/InteractionContext'
import { useControllerRegistry } from './useControllerRegistry'
// import type { PostInteraction } from '../types/post' // 暫時移除未使用的導入

/**
 * Reply Post Hook - 極簡版本
 * 移除所有可能導致重新渲染的因素
 */
export function useReplyPost(postId: string) {
    const { getInteractionsByType } = useInteraction()
    const { executeAction } = useControllerRegistry()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const replies = useMemo(
        () => {
            const allReplies = getInteractionsByType(postId, 'reply')
            return allReplies.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
        },
        [getInteractionsByType, postId]
    )

    const handleSubmit = useCallback(async (content: string): Promise<void> => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await executeAction('InteractionController', 'ADD_REPLY', {
                postId,
                content
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add reply'
            setSubmitError(errorMessage)
            throw error
        } finally {
            setIsSubmitting(false)
        }
    }, [executeAction, postId]) // 移除 isSubmitting 依賴

    // 刪除回覆
    const deleteReply = useCallback(async (replyId: string): Promise<void> => {
        try {
            await executeAction('InteractionController', 'REMOVE_INTERACTION', {
                interactionId: replyId
            })
        } catch (error) {
            throw error
        }
    }, [executeAction])

    // 編輯回覆
    const editReply = useCallback(async (replyId: string, content: string): Promise<void> => {
        try {
            await executeAction('InteractionController', 'EDIT_REPLY', {
                replyId,
                content
            })
        } catch (error) {
            throw error
        }
    }, [executeAction])

    const canSubmit = useCallback(() => !isSubmitting, [isSubmitting])

    const clearSubmitError = useCallback(() => setSubmitError(null), [])

    const replyStats = useMemo(() => ({
        total: replies.length,
        hasReplies: replies.length > 0
    }), [replies.length])

    return {
        // 數據
        replies,
        replyStats,

        // 狀態
        isPending: isSubmitting,
        submitError,

        // 操作方法
        handleSubmit,
        deleteReply,
        editReply,

        // 工具方法
        canSubmit,
        clearSubmitError
    }
} 