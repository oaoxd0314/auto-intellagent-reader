import { useMemo, useState, useCallback, RefObject, useEffect } from 'react'
import { useInteraction } from '../contexts/InteractionContext'
import { useControllerRegistry } from './useControllerRegistry'
import type { PostInteraction } from '@/types/post'


export type CommentPopover = {
    isVisible: boolean
    sectionId: string | null
    position: { x: number, y: number } | null
    comments: PostInteraction[]
}

/**
 * Comment Section Hook - 管理段落評論功能
 * 遵循架構設計，通過 InteractionController 協調業務邏輯
 * 包含 popover 顯示邏輯，類似 useSelectionSection
 */
export function useCommentSection(postId: string, containerRef?: RefObject<HTMLDivElement | null>) {
    const { state, getInteractionsByType, getInteractionsBySectionId } = useInteraction()
    const { executeAction } = useControllerRegistry()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // CommentPopover 狀態
    const [popover, setPopover] = useState<CommentPopover>({
        isVisible: false,
        sectionId: null,
        position: null,
        comments: []
    })

    // 刪除載入狀態
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

    // 獲取當前文章的所有評論
    const allComments = useMemo(() => {
        return getInteractionsByType(postId, 'comment')
    }, [postId, getInteractionsByType, state.interactions])

    // 按 sectionId 分組的評論
    const comments = useMemo(() => {
        const grouped: Record<string, PostInteraction[]> = {}

        allComments.forEach(comment => {
            const sectionId = comment.position?.sectionId
            if (sectionId) {
                if (!grouped[sectionId]) {
                    grouped[sectionId] = []
                }
                grouped[sectionId].push(comment)
            }
        })

        // 按時間排序每個分組的評論
        Object.keys(grouped).forEach(sectionId => {
            grouped[sectionId].sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
        })

        return grouped
    }, [allComments])

    // 添加評論
    const addComment = useCallback(async (
        sectionId: string,
        selectedText: string,
        content: string
    ): Promise<void> => {
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            await executeAction('InteractionController', 'ADD_COMMENT', {
                postId,
                sectionId,
                selectedText,
                content
            })
        } finally {
            setIsSubmitting(false)
        }
    }, [executeAction, postId, isSubmitting])

    // 刪除評論
    const deleteComment = useCallback(async (commentId: string) => {

        if (deletingIds.has(commentId)) return // 防止重複刪除

        console.log('deleteComment', commentId)

        setDeletingIds(prev => new Set(prev).add(commentId))

        try {
            await executeAction('InteractionController', 'REMOVE_INTERACTION', {
                interactionId: commentId
            })
            // InteractionContext 會監聽事件並自動更新狀態
            // useEffect 會監聽 allComments 變化並更新 popover
        } catch (error) {
            console.error('刪除評論失敗:', error)
        } finally {
            setDeletingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(commentId)
                return newSet
            })
        }
    }, [executeAction, deletingIds])

    // 獲取特定段落的評論
    const getCommentsBySectionId = useCallback((sectionId: string): PostInteraction[] => {
        return getInteractionsBySectionId(postId, sectionId)
            .filter(interaction => interaction.type === 'comment')
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }, [postId, getInteractionsBySectionId])

    // 檢查段落是否有評論
    const hasComments = useCallback((sectionId: string): boolean => {
        return (comments[sectionId]?.length || 0) > 0
    }, [comments])

    // 獲取評論統計
    const commentStats = useMemo(() => {
        const sectionCount = Object.keys(comments).length
        const totalComments = allComments.length

        return {
            totalComments,
            commentedSections: sectionCount,
            hasComments: totalComments > 0,
            commentsBySections: Object.fromEntries(
                Object.entries(comments).map(([sectionId, sectionComments]) => [
                    sectionId,
                    sectionComments.length
                ])
            )
        }
    }, [comments, allComments])

    // 顯示評論 Popover
    const showCommentPopover = useCallback((commentElement: HTMLElement, sectionId: string) => {
        if (!containerRef?.current) return

        const sectionComments = getCommentsBySectionId(sectionId)
        if (sectionComments.length === 0) return

        // 計算 Popover 位置 - 相對於 container，與 useSelectionSection 一致
        const rect = commentElement.getBoundingClientRect()
        const containerRect = containerRef.current.getBoundingClientRect()
        const offsetY = 8

        const position = {
            x: rect.left - containerRect.left + rect.width / 2,  // 元素中心點相對於 container 的 X 座標
            y: rect.top - containerRect.top - offsetY            // 元素頂部相對於 container 的 Y 座標
        }

        setPopover({
            isVisible: true,
            sectionId,
            position,
            comments: sectionComments
        })
    }, [containerRef, getCommentsBySectionId])

    // 隱藏評論 Popover
    const hideCommentPopover = useCallback(() => {
        setPopover(prev => ({ ...prev, isVisible: false }))
    }, [])

    // 處理點擊評論高亮文字
    const handleCommentClick = useCallback((event: MouseEvent) => {
        const target = event.target as Element
        const commentTrigger = target.closest('[data-comment-trigger]')

        if (commentTrigger) {
            const commentId = commentTrigger.getAttribute('data-comment-id')
            if (commentId) {
                // 找到對應的評論
                const comment = allComments.find(c => c.id === commentId)
                if (comment?.position?.sectionId) {
                    showCommentPopover(commentTrigger as HTMLElement, comment.position.sectionId)
                }
            }

            // 阻止事件冒泡
            event.stopPropagation()
            event.preventDefault()
        } else {
            // 點擊其他地方時隱藏 Popover
            hideCommentPopover()
        }
    }, [allComments, showCommentPopover, hideCommentPopover])

    // 監聽評論變化，自動更新 popover
    useEffect(() => {
        if (popover.isVisible && popover.sectionId) {
            const updatedComments = getInteractionsBySectionId(postId, popover.sectionId)
                .filter(interaction => interaction.type === 'comment')
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

            // 如果評論數量變化，更新 Popover
            if (updatedComments.length !== popover.comments.length) {
                if (updatedComments.length === 0) {
                    setPopover(prev => ({ ...prev, isVisible: false }))
                } else {
                    setPopover(prev => ({ ...prev, comments: updatedComments }))
                }
            }
        }
    }, [allComments, popover.isVisible, popover.sectionId, popover.comments.length, postId, getInteractionsBySectionId])

    return {
        // 狀態
        comments,
        allComments,
        isSubmitting,
        commentStats,
        deletingIds,

        // 操作
        addComment,
        deleteComment,
        getCommentsBySectionId,
        hasComments,

        // Popover 相關
        popover,
        showCommentPopover,
        hideCommentPopover,
        handleCommentClick
    }
} 