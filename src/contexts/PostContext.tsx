import { createContext, useContext, useEffect, useReducer, useRef, useCallback, useState, type ReactNode } from 'react'
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
    
    // Controller 數據狀態
    const [posts, setPosts] = useState<Post[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [isPostsLoading, setIsPostsLoading] = useState(false)
    const [isTagsLoading, setIsTagsLoading] = useState(false)
    const [postsError, setPostsError] = useState<string | null>(null)
    const [tagsError, setTagsError] = useState<string | null>(null)
    
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
        
        // 初始化數據載入
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
        
        const handlePostsError = (error: string) => {
            setPostsError(error)
            setIsPostsLoading(false)
        }
        
        const handleTagsError = (error: string) => {
            setTagsError(error)
            setIsTagsLoading(false)
        }
        
        controller.on('currentPostChanged', handleCurrentPostChanged)
        controller.on('readingHistoryUpdated', handleReadingHistoryUpdated)
        controller.on('viewModeChanged', handleViewModeChanged)
        controller.on('postsLoaded', handlePostsLoaded)
        controller.on('tagsLoaded', handleTagsLoaded)
        controller.on('postsError', handlePostsError)
        controller.on('tagsError', handleTagsError)
        
        // 初始化狀態
        const loadingState = controller.getLoadingState()
        const errorState = controller.getErrorState()
        
        setIsPostsLoading(loadingState.isLoadingPosts)
        setIsTagsLoading(loadingState.isLoadingTags)
        setPostsError(errorState.postsError)
        setTagsError(errorState.tagsError)
        setPosts(controller.getCachedPosts())
        setTags(controller.getCachedTags())
        
        dispatch({ 
            type: 'UPDATE_READING_HISTORY', 
            payload: controller.getReadingHistory() 
        })
        
        return () => {
            controller.off('currentPostChanged', handleCurrentPostChanged)
            controller.off('readingHistoryUpdated', handleReadingHistoryUpdated)
            controller.off('viewModeChanged', handleViewModeChanged)
            controller.off('postsLoaded', handlePostsLoaded)
            controller.off('tagsLoaded', handleTagsLoaded)
            controller.off('postsError', handlePostsError)
            controller.off('tagsError', handleTagsError)
        }
    }, [])
    
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
    
    const advancedSearch = useCallback((filters: Parameters<PostController['advancedSearch']>[1]) => {
        const controller = controllerRef.current
        if (controller && !controller.getState().isDestroyed) {
            return controller.advancedSearch(posts, filters)
        }
        return []
    }, [posts])
    
    const getFilteredPosts = useCallback(() => {
        const controller = controllerRef.current
        if (controller && !controller.getState().isDestroyed) {
            return controller.advancedSearch(posts, {
                searchTerm: state.searchTerm || undefined,
                tags: state.selectedTag ? [state.selectedTag] : undefined,
                sortBy: 'date'
            })
        }
        return []
    }, [posts, state.searchTerm, state.selectedTag])
    
    // 單個文章查詢函數
    const usePostQuery = useCallback((id: string) => {
        const controller = controllerRef.current
        if (controller && !controller.getState().isDestroyed) {
            const post = controller.getCachedPost(id)
            const loadingState = controller.getLoadingState()
            const errorState = controller.getErrorState()
            
            // 如果沒有緩存，嘗試載入
            if (!post && !loadingState.isLoadingPost) {
                controller.getPostById(id).catch(console.error)
            }
            
            return {
                post,
                isLoading: loadingState.isLoadingPost,
                error: errorState.postError
            }
        }
        
        return {
            post: null,
            isLoading: false,
            error: null
        }
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