import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { PostController } from '../controllers/PostController'
import type { Post } from '../types/post'

// 狀態類型
interface PostState {
  posts: Post[]
  currentPost: Post | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
}

// Action 類型
type PostAction =
  | { type: 'FETCH_POSTS_START' }
  | { type: 'FETCH_POSTS_SUCCESS'; payload: Post[] }
  | { type: 'FETCH_POSTS_ERROR'; payload: string }
  | { type: 'FETCH_POST_START' }
  | { type: 'FETCH_POST_SUCCESS'; payload: Post }
  | { type: 'FETCH_POST_ERROR'; payload: string }
  | { type: 'SET_CURRENT_POST'; payload: Post | null }
  | { type: 'CLEAR_ERROR' }

// 初始狀態
const initialState: PostState = {
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,
  isInitialized: false,
}

// Reducer
function postReducer(state: PostState, action: PostAction): PostState {
  switch (action.type) {
    case 'FETCH_POSTS_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'FETCH_POSTS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        posts: action.payload,
        isInitialized: true,
        error: null,
      }
    case 'FETCH_POSTS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        isInitialized: true,
      }
    case 'FETCH_POST_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'FETCH_POST_SUCCESS':
      return {
        ...state,
        isLoading: false,
        currentPost: action.payload,
        error: null,
      }
    case 'FETCH_POST_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }
    case 'SET_CURRENT_POST':
      return {
        ...state,
        currentPost: action.payload,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    default:
      return state
  }
}

// Context 類型
interface PostContextType extends PostState {
  // Actions
  fetchAllPosts: () => Promise<void>
  fetchPostById: (id: string) => Promise<void>
  getPostById: (id: string) => Post | undefined
  setCurrentPost: (post: Post | null) => void
  clearError: () => void
  // Computed values
  getPostsByTag: (tag: string) => Post[]
  getAllTags: () => string[]
}

// Context
const PostContext = createContext<PostContextType | undefined>(undefined)

// Provider Props
interface PostProviderProps {
  children: ReactNode
}

// Provider Component
export function PostProvider({ children }: PostProviderProps) {
  const [state, dispatch] = useReducer(postReducer, initialState)
  const postController = PostController.getInstance()

  // 載入所有文章
  const fetchAllPosts = async (): Promise<void> => {
    if (state.isInitialized && state.posts.length > 0) {
      return // 已經載入過了，不重複載入
    }

    dispatch({ type: 'FETCH_POSTS_START' })
    try {
      const posts = await postController.getAllPosts()
      dispatch({ type: 'FETCH_POSTS_SUCCESS', payload: posts })
    } catch (error) {
      dispatch({ 
        type: 'FETCH_POSTS_ERROR', 
        payload: error instanceof Error ? error.message : '載入文章失敗' 
      })
    }
  }

  // 載入單個文章
  const fetchPostById = async (id: string): Promise<void> => {
    // 先檢查快取
    const cachedPost = getPostById(id)
    if (cachedPost) {
      dispatch({ type: 'SET_CURRENT_POST', payload: cachedPost })
      return
    }

    dispatch({ type: 'FETCH_POST_START' })
    try {
      const post = await postController.getPostById(id)
      if (post) {
        dispatch({ type: 'FETCH_POST_SUCCESS', payload: post })
      } else {
        dispatch({ type: 'FETCH_POST_ERROR', payload: '文章不存在' })
      }
    } catch (error) {
      dispatch({ 
        type: 'FETCH_POST_ERROR', 
        payload: error instanceof Error ? error.message : '載入文章失敗' 
      })
    }
  }

  // 從快取中獲取文章
  const getPostById = (id: string): Post | undefined => {
    return state.posts.find(post => post.id === id)
  }

  // 設置當前文章
  const setCurrentPost = (post: Post | null): void => {
    dispatch({ type: 'SET_CURRENT_POST', payload: post })
  }

  // 清除錯誤
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  // 根據標籤篩選文章
  const getPostsByTag = (tag: string): Post[] => {
    return postController.filterPostsByTag(state.posts, tag)
  }

  // 獲取所有標籤
  const getAllTags = (): string[] => {
    return postController.extractAllTags(state.posts)
  }

  // 初始化時載入所有文章
  useEffect(() => {
    fetchAllPosts()
  }, [])

  const contextValue: PostContextType = {
    ...state,
    fetchAllPosts,
    fetchPostById,
    getPostById,
    setCurrentPost,
    clearError,
    getPostsByTag,
    getAllTags,
  }

  return (
    <PostContext.Provider value={contextValue}>
      {children}
    </PostContext.Provider>
  )
}

// Custom Hook
export function usePost(): PostContextType {
  const context = useContext(PostContext)
  if (context === undefined) {
    throw new Error('usePost must be used within a PostProvider')
  }
  return context
} 