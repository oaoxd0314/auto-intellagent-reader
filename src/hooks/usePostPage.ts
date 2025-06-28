import { useState, useEffect, useCallback } from 'react'
import { PostController } from '../controllers/PostController'

/**
 * Posts 列表頁面的 Hook
 * 負責 UI 狀態管理 + Controller 調用
 */
export function usePostsList() {
    const controller = PostController.getInstance()

    // UI 狀態 - 由 Hook 管理
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)

    // 從 Controller 獲取狀態
    const loadingState = controller.getLoadingState()
    const errorState = controller.getErrorState()
    const allPosts = controller.getCachedPosts()
    const allTags = controller.getCachedTags()

    // 業務邏輯 - 通過 Controller 處理
    const filteredPosts = controller.advancedSearch(allPosts, {
        searchTerm: searchTerm || undefined,
        tags: selectedTag ? [selectedTag] : undefined,
        sortBy: 'date'
    })

    // 初始化數據載入
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                await Promise.all([
                    controller.getAllPosts(),
                    controller.getAllTags()
                ])
            } catch (error) {
                console.error('Failed to load initial data:', error)
            }
        }

        loadInitialData()
    }, [controller])

    // 清除錯誤
    const clearError = useCallback(() => {
        controller.clearErrors()
    }, [controller])

    // 標籤選擇處理
    const handleTagSelect = useCallback((tag: string | null) => {
        setSelectedTag(tag)
        // 通知 Controller 更新搜尋過濾器
        controller.setSearchFilters({ tag: tag || undefined })
    }, [controller])

    // 搜尋處理
    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term)
        // 通知 Controller 更新搜尋過濾器
        controller.setSearchFilters({ searchTerm: term || undefined })
    }, [controller])

    return {
        // 數據狀態
        posts: filteredPosts,
        allTags,

        // UI 狀態
        searchTerm,
        selectedTag,
        isLoading: loadingState.isLoadingPosts || loadingState.isLoadingTags,
        error: errorState.postsError || errorState.tagsError,

        // 操作方法
        setSearchTerm: handleSearch,
        setSelectedTag: handleTagSelect,
        clearError,

        // 統計資訊
        totalPosts: allPosts.length,
        filteredCount: filteredPosts.length
    }
}

/**
 * Post 詳情頁面的 Hook
 * 負責 UI 狀態管理 + Controller 調用
 */
export function usePostDetail(id: string) {
    const controller = PostController.getInstance()


    // 從 Controller 獲取狀態
    const loadingState = controller.getLoadingState()
    const errorState = controller.getErrorState()
    const post = controller.getCachedPost(id)
    const allPosts = controller.getCachedPosts()

    // 業務邏輯 - 通過 Controller 處理
    const recommendedPosts = post ? controller.getRecommendedPosts(post, allPosts, 3) : []

    // 初始化載入文章
    useEffect(() => {
        if (!id) return

        const loadPost = async () => {
            try {
                await controller.getPostById(id)
                // 確保也載入所有文章以便推薦
                if (allPosts.length === 0) {
                    await controller.getAllPosts()
                }
            } catch (error) {
                console.error('Failed to load post:', error)
            }
        }

        loadPost()
    }, [id, controller, allPosts.length])



    // 清除錯誤
    const clearError = useCallback(() => {
        controller.clearError('post')
    }, [controller])

    return {
        // 數據狀態
        post,
        recommendedPosts,

        // UI 狀態
        isLoading: loadingState.isLoadingPost,

        error: errorState.postError,

        clearError,
    }
}

/**
 * Post 互動功能的 Hook
 * 專門處理文字選擇、評論、標記等互動功能
 */
export function usePostInteractions(postId: string) {
    const controller = PostController.getInstance()

    // UI 狀態
    const [selectedText, setSelectedText] = useState('')
    const [selectionPosition, setSelectionPosition] = useState<any>(null)
    const [showCommentDialog, setShowCommentDialog] = useState(false)
    const [showReplyDialog, setShowReplyDialog] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [replyText, setReplyText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 文字選擇處理
    const handleTextSelection = useCallback(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed) {
            setSelectedText('')
            setSelectionPosition(null)
            return
        }

        const text = selection.toString().trim()
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        setSelectedText(text)
        setSelectionPosition({ x: rect.left, y: rect.top })
    }, [])

    // 標記處理
    const handleMark = useCallback(() => {
        if (!selectedText || !selectionPosition) return

        controller.addMark(postId, selectedText, selectionPosition)
        setSelectedText('')
        setSelectionPosition(null)
    }, [controller, postId, selectedText, selectionPosition])

    // 評論對話框處理
    const openCommentDialog = useCallback(() => {
        if (!selectedText) return
        setShowCommentDialog(true)
    }, [selectedText])

    const closeCommentDialog = useCallback(() => {
        setShowCommentDialog(false)
        setCommentText('')
    }, [])

    // 回覆對話框處理
    const openReplyDialog = useCallback(() => {
        setShowReplyDialog(true)
    }, [])

    const closeReplyDialog = useCallback(() => {
        setShowReplyDialog(false)
        setReplyText('')
    }, [])

    // 提交評論
    const submitComment = useCallback(async () => {
        if (!commentText.trim() || !selectedText || !selectionPosition) return

        setIsSubmitting(true)
        try {
            controller.addComment(postId, selectedText, commentText, selectionPosition)
            closeCommentDialog()
            setSelectedText('')
            setSelectionPosition(null)
        } catch (error) {
            console.error('Failed to submit comment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }, [controller, postId, selectedText, commentText, selectionPosition, closeCommentDialog])

    // 提交回覆
    const submitReply = useCallback(async () => {
        if (!replyText.trim()) return

        setIsSubmitting(true)
        try {
            controller.addReply(postId, replyText)
            closeReplyDialog()
        } catch (error) {
            console.error('Failed to submit reply:', error)
        } finally {
            setIsSubmitting(false)
        }
    }, [controller, postId, replyText, closeReplyDialog])

    return {
        // 選擇狀態
        selectedText,
        selectionPosition,

        // 對話框狀態
        showCommentDialog,
        showReplyDialog,
        commentText,
        replyText,
        isSubmitting,

        // 操作方法
        handleTextSelection,
        handleMark,
        openCommentDialog,
        closeCommentDialog,
        openReplyDialog,
        closeReplyDialog,
        setCommentText,
        setReplyText,
        submitComment,
        submitReply,

        // 驗證
        canSubmitComment: commentText.trim().length >= 3 && !isSubmitting,
        canSubmitReply: replyText.trim().length >= 3 && !isSubmitting
    }
} 