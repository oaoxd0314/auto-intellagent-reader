import { createContext, useContext, useEffect, useReducer, useRef, useCallback, type ReactNode } from 'react'
import { PostController } from '../controllers/PostController'
import { useAllPosts, useAllTags, usePostDetail } from '../hooks/usePostQueries'
import type { Post } from '../types/post'

/**
 * Context 狀態定義
 */
interface PostContextState {
    // UI 狀態
    selectedTag: string | null
    searchTerm: string
    viewMode: 'list' | 'grid' | 'detail'
    
    // Controller 狀態
    currentPost: Post | null
    readingHistory: Array<{
        postId: string
        title: string
        readAt: string
        readCount: number
    }>
}

/**
 * Context Actions
 */
type PostContextAction =
    | { type: 'SET_SELECTED_TAG'; payload: string | null }
    | { type: 'SET_SEARCH_TERM'; payload: string }
    | { type: 'SET_VIEW_MODE'; payload: 'list' | 'grid' | 'detail' }
    | { type: 'SET_CURRENT_POST'; payload: Post | null }
    | { type: 'UPDATE_READING_HISTORY'; payload: PostContextState['readingHistory'] }

/**
 * Context Value 類型
 */
interface PostContextValue {
    // 狀態
    state: PostContextState
    
    // TanStack Query 數據
    posts: Post[]
    tags: string[]
    isPostsLoading: boolean
    isTagsLoading: boolean
    postsError: Error | null
    tagsError: Error | null
    
    // 單個文章查詢函數
    usePostQuery: (id: string) => {
        post: Post | undefined
        isLoading: boolean
        error: Error | null
    }
    
    // Actions
    setSelectedTag: (tag: string | null) => void
    setSearchTerm: (term: string) => void
    setViewMode: (mode: 'list' | 'grid' | 'detail') => void
    setCurrentPost: (post: Post | null) => void
    
    // 複雜業務邏輯 (委託給 Controller)
    getRecommendedPosts: (currentPost: Post, limit?: number) => Post[]
    advancedSearch: (filters: {
        searchTerm?: string
        tags?: string[]
        dateRange?: { start: Date; end: Date }
        sortBy?: 'date' | 'title' | 'relevance'
    }) => Post[]
    getFilteredPosts: () => Post[]
}

/**
 * Reducer
 */
function postReducer(state: PostContextState, action: PostContextAction): PostContextState {
    switch (action.type) {
        case 'SET_SELECTED_TAG':
            return { ...state, selectedTag: action.payload }
        case 'SET_SEARCH_TERM':
            return { ...state, searchTerm: action.payload }
        case 'SET_VIEW_MODE':
            return { ...state, viewMode: action.payload }
        case 'SET_CURRENT_POST':
            return { ...state, currentPost: action.payload }
        case 'UPDATE_READING_HISTORY':
            return { ...state, readingHistory: action.payload }
        default:
            return state
    }
}

/**
 * 初始狀態
 */
const initialState: PostContextState = {
    selectedTag: null,
    searchTerm: '',
    viewMode: 'list',
    currentPost: null,
    readingHistory: []
}

/**
 * Context
 */
const PostContext = createContext<PostContextValue | undefined>(undefined)

/**
 * Provider
 */
export function PostProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(postReducer, initialState)
    
    // TanStack Query hooks
    const { data: posts = [], isLoading: isPostsLoading, error: postsError } = useAllPosts()
    const { data: tags = [], isLoading: isTagsLoading, error: tagsError } = useAllTags()
    
    // 使用 useRef 穩定 controller 引用
    const controllerRef = useRef<PostController | null>(null)
    
    // 獲取 controller 實例
    if (!controllerRef.current) {
        controllerRef.current = PostController.getInstance()
    }
    
    // 初始化和清理
    useEffect(() => {
        const controller = controllerRef.current!
        controller.initialize()
        
        // 監聽 Controller 事件
        const handleCurrentPostChanged = (post: Post | null) => {
            dispatch({ type: 'SET_CURRENT_POST', payload: post })
        }
        
        const handleReadingHistoryUpdated = () => {
            dispatch({ 
                type: 'UPDATE_READING_HISTORY', 
                payload: controller.getReadingHistory() 
            })
        }
        
        const handleViewModeChanged = (mode: 'list' | 'grid' | 'detail') => {
            dispatch({ type: 'SET_VIEW_MODE', payload: mode })
        }
        
        controller.on('currentPostChanged', handleCurrentPostChanged)
        controller.on('readingHistoryUpdated', handleReadingHistoryUpdated)
        controller.on('viewModeChanged', handleViewModeChanged)
        
        // 初始化閱讀歷史
        dispatch({ 
            type: 'UPDATE_READING_HISTORY', 
            payload: controller.getReadingHistory() 
        })
        
        return () => {
            controller.off('currentPostChanged', handleCurrentPostChanged)
            controller.off('readingHistoryUpdated', handleReadingHistoryUpdated)
            controller.off('viewModeChanged', handleViewModeChanged)
            
            // 🎯 重要修復：不銷毀單例 Controller
            // 單例 Controller 應該在應用生命週期結束時才銷毀
            // 這裡只移除事件監聽器即可，保持 Controller 可供其他組件使用
        }
    }, []) // 移除 controller 依賴項
    
    // 使用 useCallback 穩定函數引用
    const setSelectedTag = useCallback((tag: string | null) => {
        dispatch({ type: 'SET_SELECTED_TAG', payload: tag })
    }, [])
    
    const setSearchTerm = useCallback((term: string) => {
        dispatch({ type: 'SET_SEARCH_TERM', payload: term })
    }, [])
    
    const setViewMode = useCallback((mode: 'list' | 'grid' | 'detail') => {
        const controller = controllerRef.current
        if (controller && !controller.getState().isDestroyed) {
            controller.setViewMode(mode)
        }
    }, [])
    
    const setCurrentPost = useCallback((post: Post | null) => {
        const controller = controllerRef.current
        if (controller && !controller.getState().isDestroyed) {
            controller.setCurrentPost(post)
        }
    }, [])
    
    // 複雜業務邏輯委託給 Controller
    const getRecommendedPosts = useCallback((currentPost: Post, limit = 3) => {
        const controller = controllerRef.current
        if (controller && !controller.getState().isDestroyed) {
            return controller.getRecommendedPosts(currentPost, posts, limit)
        }
        return []
    }, [posts])
    
    const advancedSearch = useCallback((filters: Parameters<NonNullable<typeof controllerRef.current>['advancedSearch']>[1]) => {
        const controller = controllerRef.current
        if (controller && !controller.getState().isDestroyed) {
            return controller.advancedSearch(posts, filters)
        }
        return []
    }, [posts])
    
    // 簡單篩選邏輯
    const getFilteredPosts = useCallback(() => {
        let filtered = posts
        
        // 標籤篩選
        if (state.selectedTag) {
            filtered = filtered.filter(post => 
                post.tags?.includes(state.selectedTag!)
            )
        }
        
        // 搜索詞篩選
        if (state.searchTerm) {
            const term = state.searchTerm.toLowerCase()
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(term) ||
                post.author.toLowerCase().includes(term) ||
                post.tags?.some(tag => tag.toLowerCase().includes(term))
            )
        }
        
        return filtered
    }, [posts, state.selectedTag, state.searchTerm])
    
    // 單個文章查詢函數
    const usePostQuery = useCallback((id: string) => {
        const { data: post, isLoading, error } = usePostDetail(id)
        return { post, isLoading, error }
    }, [])
    
    const value: PostContextValue = {
        state,
        posts,
        tags,
        isPostsLoading,
        isTagsLoading,
        postsError,
        tagsError,
        usePostQuery,
        setSelectedTag,
        setSearchTerm,
        setViewMode,
        setCurrentPost,
        getRecommendedPosts,
        advancedSearch,
        getFilteredPosts
    }
    
    return <PostContext.Provider value={value}>{children}</PostContext.Provider>
}

/**
 * Hook
 */
export function usePost() {
    const context = useContext(PostContext)
    if (context === undefined) {
        throw new Error('usePost must be used within a PostProvider')
    }
    return context
} 