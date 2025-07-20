import { useState, useEffect, useCallback } from 'react'
import { useControllerRegistry } from './useControllerRegistry'
import { PostController } from '../controllers/PostController'

/**
 * Posts 列表頁面的 Hook
 * 負責 UI 狀態管理 + Controller 調用
 */
export function usePostsList() {
    const { executeAction, getController, isReady } = useControllerRegistry()
    const controller = getController<PostController>('PostController')

    // UI 狀態 - 由 Hook 管理
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [allTags, setAllTags] = useState<string[]>([])

    // 使用 PostService 的 搜索功能（這裡應該通過 executeAction 調用）
    const [filteredPosts, setFilteredPosts] = useState<any[]>([])

    // 初始化數據載入
    useEffect(() => {
        if (!isReady) {
            // FIXME: Registry應該在所有組件掛載前完成初始化，目前用polling workaround
            console.debug('[usePostsList] Controller Registry not ready yet, polling will retry')
            return
        }
        
        const loadInitialData = async () => {
            setLoading(true)
            setError(null)
            try {
                await Promise.all([
                    executeAction('PostController', 'LOAD_POSTS'),
                    executeAction('PostController', 'LOAD_TAGS')
                ])
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to load initial data'
                setError(errorMessage)
                console.error('Failed to load initial data:', error)
            } finally {
                setLoading(false)
            }
        }

        loadInitialData()
    }, [executeAction, isReady])

    // 事件監聽
    useEffect(() => {
        if (!controller) return

        const handlePostsLoaded = (loadedPosts: any[]) => {
            setPosts(loadedPosts)
            setFilteredPosts(loadedPosts)
        }

        const handleTagsLoaded = (loadedTags: string[]) => {
            setAllTags(loadedTags)
        }

        const handleSearchCompleted = (result: any) => {
            setFilteredPosts(result.results || [])
        }

        controller.on('postsLoaded', handlePostsLoaded)
        controller.on('tagsLoaded', handleTagsLoaded)
        controller.on('searchCompleted', handleSearchCompleted)

        return () => {
            controller.off('postsLoaded', handlePostsLoaded)
            controller.off('tagsLoaded', handleTagsLoaded)
            controller.off('searchCompleted', handleSearchCompleted)
        }
    }, [controller])

    // 清除錯誤
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    // 標籤選擇處理
    const handleTagSelect = useCallback((tag: string | null) => {
        setSelectedTag(tag)
        // 執行搜索
        executeAction('PostController', 'SEARCH_POSTS', {
            query: searchTerm,
            filters: { 
                tags: tag ? [tag] : undefined,
                sortBy: 'date'
            }
        })
    }, [executeAction, searchTerm])

    // 搜尋處理
    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term)
        // 執行搜索
        executeAction('PostController', 'SEARCH_POSTS', {
            query: term,
            filters: { 
                tags: selectedTag ? [selectedTag] : undefined,
                sortBy: 'date'
            }
        })
    }, [executeAction, selectedTag])

    return {
        // 數據狀態
        posts: filteredPosts,
        allTags,

        // UI 狀態
        searchTerm,
        selectedTag,
        isLoading: loading,
        error,

        // 操作方法
        setSearchTerm: handleSearch,
        setSelectedTag: handleTagSelect,
        clearError,

        // 統計資訊
        totalPosts: posts.length,
        filteredCount: filteredPosts.length
    }
}

/**
 * Post 詳情頁面的 Hook
 * 負責 UI 狀態管理 + Controller 調用
 */
export function usePostDetail(id: string) {
    const { executeAction, getController, isReady } = useControllerRegistry()
    const controller = getController<PostController>('PostController')

    // 本地狀態管理
    const [post, setPost] = useState<any>(null)
    const [recommendedPosts, setRecommendedPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 事件監聽
    useEffect(() => {
        if (!controller) return

        const handlePostLoaded = (loadedPost: any) => {
            setPost(loadedPost)
            // 獲取推薦文章
            executeAction('PostController', 'GET_RECOMMENDATIONS', {
                currentPost: loadedPost,
                limit: 3
            })
        }

        const handleRecommendationsLoaded = (result: any) => {
            setRecommendedPosts(result.recommendations || [])
        }

        const handlePostError = (errorMessage: string) => {
            setError(errorMessage)
            setLoading(false)
        }

        controller.on('postLoaded', handlePostLoaded)
        controller.on('recommendationsLoaded', handleRecommendationsLoaded)
        controller.on('postError', handlePostError)

        return () => {
            controller.off('postLoaded', handlePostLoaded)
            controller.off('recommendationsLoaded', handleRecommendationsLoaded)
            controller.off('postError', handlePostError)
        }
    }, [controller, executeAction])

    // 初始化載入文章
    useEffect(() => {
        if (!id || !isReady) {
            if (!isReady) {
                // FIXME: Registry應該在所有組件掛載前完成初始化，目前用polling workaround
                console.debug('[usePostDetail] Controller Registry not ready yet, polling will retry')
            }
            return
        }

        const loadPost = async () => {
            setLoading(true)
            setError(null)
            try {
                await executeAction('PostController', 'LOAD_POST', { id })
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to load post'
                setError(errorMessage)
                console.error('Failed to load post:', error)
            } finally {
                setLoading(false)
            }
        }

        loadPost()
    }, [id, executeAction, isReady])



    // 清除錯誤
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    return {
        // 數據狀態
        post,
        recommendedPosts,

        // UI 狀態
        isLoading: loading,
        error,

        clearError,
    }
}

/**
 * Post 互動功能的 Hook
 * 專門處理文字選擇、評論、標記等互動功能
 */
export function usePostInteractions(postId: string) {
    const { executeAction } = useControllerRegistry()

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
    const handleMark = useCallback(async () => {
        if (!selectedText || !selectionPosition) return

        try {
            await executeAction('PostController', 'ADD_MARK', {
                postId,
                selectedText,
                position: selectionPosition
            })
            setSelectedText('')
            setSelectionPosition(null)
        } catch (error) {
            console.error('Failed to add mark:', error)
        }
    }, [executeAction, postId, selectedText, selectionPosition])

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
            await executeAction('PostController', 'ADD_COMMENT', {
                postId,
                selectedText,
                comment: commentText,
                position: selectionPosition
            })
            closeCommentDialog()
            setSelectedText('')
            setSelectionPosition(null)
        } catch (error) {
            console.error('Failed to submit comment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }, [executeAction, postId, selectedText, commentText, selectionPosition, closeCommentDialog])

    // 提交回覆
    const submitReply = useCallback(async () => {
        if (!replyText.trim()) return

        setIsSubmitting(true)
        try {
            await executeAction('PostController', 'ADD_REPLY', {
                postId,
                content: replyText
            })
            closeReplyDialog()
        } catch (error) {
            console.error('Failed to submit reply:', error)
        } finally {
            setIsSubmitting(false)
        }
    }, [executeAction, postId, replyText, closeReplyDialog])

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