import { createContext, useContext, useEffect, useReducer, useRef, useCallback, useState, type ReactNode } from 'react'
import { useControllerRegistry } from '../hooks/useControllerRegistry'
import { PostController } from '../controllers/PostController'
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
    
    // Controller 數據
    posts: Post[]
    tags: string[]
    isPostsLoading: boolean
    isTagsLoading: boolean
    postsError: string | null
    tagsError: string | null
    
    // 單個文章查詢函數
    usePostQuery: (id: string) => {
        post: Post | null
        isLoading: boolean
        error: string | null
    }
    
    // Actions
    setSelectedTag: (tag: string | null) => void
    setSearchTerm: (term: string) => void
    setViewMode: (mode: 'list' | 'grid' | 'detail') => void
    setCurrentPost: (post: Post | null) => void
    
    // 複雜業務邏輯 (委託給 Controller)
    getRecommendedPosts: (currentPost: Post, limit?: number) => Promise<Post[]>
    advancedSearch: (filters: {
        searchTerm?: string
        tags?: string[]
        dateRange?: { start: Date; end: Date }
        sortBy?: 'date' | 'title' | 'relevance'
    }) => Promise<Post[]>
    getFilteredPosts: () => Promise<Post[]>
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
    
    // Controller 數據狀態
    const [posts, setPosts] = useState<Post[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [isPostsLoading, setIsPostsLoading] = useState(false)
    const [isTagsLoading, setIsTagsLoading] = useState(false)
    const [postsError, setPostsError] = useState<string | null>(null)
    const [tagsError, setTagsError] = useState<string | null>(null)
    
    // 使用 ControllerRegistry
    const { executeAction, getController, isReady } = useControllerRegistry()
    const controllerRef = useRef<PostController | null>(null)
    
    // 只有在 Registry 準備好時才獲取 controller
    useEffect(() => {
        if (isReady && !controllerRef.current) {
            controllerRef.current = getController<PostController>('PostController')
            console.log('[PostContext] Controller ready:', !!controllerRef.current)
        }
    }, [isReady, getController])
    
    // 初始化和清理
    useEffect(() => {
        const controller = controllerRef.current
        if (!controller) {
            // FIXME: Registry應該在所有組件掛載前完成初始化，目前用polling workaround
            console.debug('[PostContext] Controller not available yet, polling will retry')
            return
        }
        
        // 初始化數據載入
        const loadInitialData = async () => {
            setIsPostsLoading(true)
            setIsTagsLoading(true)
            try {
                await Promise.all([
                    executeAction('PostController', 'LOAD_POSTS'),
                    executeAction('PostController', 'LOAD_TAGS')
                ])
            } catch (error) {
                console.error('Failed to load initial data:', error)
                setPostsError(error instanceof Error ? error.message : 'Failed to load data')
                setTagsError(error instanceof Error ? error.message : 'Failed to load data')
            } finally {
                setIsPostsLoading(false)
                setIsTagsLoading(false)
            }
        }
        
        loadInitialData()
        
        // 其他事件監聽器
        const handleCurrentPostChanged = (post: Post | null) => {
            dispatch({ type: 'SET_CURRENT_POST', payload: post })
        }
        
        const handleReadingHistoryUpdated = (history: any[]) => {
            dispatch({ 
                type: 'UPDATE_READING_HISTORY', 
                payload: history 
            })
        }
        
        const handleViewModeChanged = (mode: 'list' | 'grid' | 'detail') => {
            dispatch({ type: 'SET_VIEW_MODE', payload: mode })
        }
        
        // 綁定事件
        controller.on('currentPostChanged', handleCurrentPostChanged)
        controller.on('readingHistoryUpdated', handleReadingHistoryUpdated)
        controller.on('viewModeChanged', handleViewModeChanged)
        
        // 綁定數據加載事件
        const handlePostsLoaded = (loadedPosts: Post[]) => {
            setPosts(loadedPosts)
            setIsPostsLoading(false)
            setPostsError(null)
        }
        
        const handleTagsLoaded = (loadedTags: string[]) => {
            setTags(loadedTags)
            setIsTagsLoading(false)
            setTagsError(null)
        }
        
        const handlePostError = (error: string) => {
            setPostsError(error)
            setIsPostsLoading(false)
        }
        
        const handleTagsError = (error: string) => {
            setTagsError(error)
            setIsTagsLoading(false)
        }
        
        controller.on('postsLoaded', handlePostsLoaded)
        controller.on('tagsLoaded', handleTagsLoaded)
        controller.on('postError', handlePostError)
        controller.on('tagsError', handleTagsError)
        
        return () => {
            if (controller) {
                controller.off('currentPostChanged', handleCurrentPostChanged)
                controller.off('readingHistoryUpdated', handleReadingHistoryUpdated)
                controller.off('viewModeChanged', handleViewModeChanged)
                controller.off('postsLoaded', handlePostsLoaded)
                controller.off('tagsLoaded', handleTagsLoaded)
                controller.off('postError', handlePostError)
                controller.off('tagsError', handleTagsError)
            }
        }
    }, [executeAction, isReady, controllerRef])
    
    // 使用 useCallback 穩定函數引用
    const setSelectedTag = useCallback((tag: string | null) => {
        dispatch({ type: 'SET_SELECTED_TAG', payload: tag })
    }, [])
    
    const setSearchTerm = useCallback((term: string) => {
        dispatch({ type: 'SET_SEARCH_TERM', payload: term })
    }, [])
    
    const setViewMode = useCallback((mode: 'list' | 'grid' | 'detail') => {
        dispatch({ type: 'SET_VIEW_MODE', payload: mode })
    }, [])
    
    const setCurrentPost = useCallback(async (post: Post | null) => {
        dispatch({ type: 'SET_CURRENT_POST', payload: post })
        if (post) {
            try {
                await executeAction('PostController', 'ADD_TO_READING_HISTORY', { post })
            } catch (error) {
                console.error('Failed to add to reading history:', error)
            }
        }
    }, [executeAction])
    
    // 複雜業務邏輯委託給 Controller
    const getRecommendedPosts = useCallback(async (currentPost: Post, limit = 3): Promise<Post[]> => {
        try {
            const result = await executeAction('PostController', 'GET_RECOMMENDATIONS', {
                currentPost,
                limit
            }) as any // TODO: Fix type inference for executeAction return type - should return properly typed result based on action
            return Array.isArray(result) ? result : (result?.recommendations || [])
        } catch (error) {
            console.error('Failed to get recommendations:', error)
            return []
        }
    }, [executeAction])
    
    const advancedSearch = useCallback(async (filters: {
        searchTerm?: string
        tags?: string[]
        dateRange?: { start: Date; end: Date }
        sortBy?: 'date' | 'title' | 'relevance'
    }): Promise<Post[]> => {
        try {
            const result = await executeAction('PostController', 'SEARCH_POSTS', {
                query: filters.searchTerm || '',
                filters
            }) as any // TODO: Fix type inference for executeAction return type - should return properly typed result based on action
            return Array.isArray(result) ? result : (result?.results || [])
        } catch (error) {
            console.error('Failed to search posts:', error)
            return []
        }
    }, [executeAction])
    
    const getFilteredPosts = useCallback(async (): Promise<Post[]> => {
        try {
            const result = await executeAction('PostController', 'SEARCH_POSTS', {
                query: state.searchTerm || '',
                filters: {
                    tags: state.selectedTag ? [state.selectedTag] : undefined,
                    sortBy: 'date'
                }
            }) as any // TODO: Fix type inference for executeAction return type - should return properly typed result based on action
            return Array.isArray(result) ? result : (result?.results || [])
        } catch (error) {
            console.error('Failed to filter posts:', error)
            return []
        }
    }, [executeAction, state.searchTerm, state.selectedTag])
    
    // 單個文章查詢函數
    const usePostQuery = useCallback((id: string) => {
        // 檢查是否已有緩存
        const cachedPost = posts.find(p => p.id === id)
        if (cachedPost) {
            return {
                post: cachedPost,
                isLoading: false,
                error: null
            }
        }
        
        // 如果沒有緩存，嘗試載入
        executeAction('PostController', 'LOAD_POST', { id }).catch(console.error)
        
        return {
            post: null,
            isLoading: true,
            error: null
        }
    }, [posts, executeAction])
    
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
    
    return (
        <PostContext.Provider value={value}>
            {children}
        </PostContext.Provider>
    )
}

export function usePost() {
    const context = useContext(PostContext)
    if (context === undefined) {
        throw new Error('usePost must be used within a PostProvider')
    }
    return context
} 