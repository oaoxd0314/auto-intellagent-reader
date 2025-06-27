import { createContext, useContext, useEffect, useReducer, ReactNode, useCallback } from 'react'
import { PostController } from '../controllers/PostController'
import type { PostInteraction } from '../types/post'

// 互動統計類型
type InteractionStats = {
  readonly totalInteractions: number
  readonly replies: number
  readonly marks: number
  readonly comments: number
}

// 按文章統計的互動數據
type PostInteractionStats = Record<string, InteractionStats>

// Context 狀態
type InteractionState = {
  readonly interactions: PostInteraction[]
  readonly statsByPost: PostInteractionStats
  readonly isLoading: boolean
  readonly error: string | null
}

// Context Actions
type InteractionAction = 
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: PostInteraction[] }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'ADD_INTERACTION'; payload: PostInteraction }
  | { type: 'REMOVE_INTERACTION'; payload: string }
  | { type: 'CLEAR_INTERACTIONS' }

// Context API
type InteractionContextType = {
  // 狀態
  readonly interactions: PostInteraction[]
  readonly statsByPost: PostInteractionStats
  readonly isLoading: boolean
  readonly error: string | null
  
  // 統計方法
  readonly getPostStats: (postId: string) => InteractionStats
  readonly getTotalStats: () => InteractionStats
  
  // 操作方法
  readonly refreshInteractions: () => void
  readonly clearError: () => void
}

// 初始狀態
const initialState: InteractionState = {
  interactions: [],
  statsByPost: {},
  isLoading: false,
  error: null
}

// Reducer
function interactionReducer(state: InteractionState, action: InteractionAction): InteractionState {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
      
    case 'LOAD_SUCCESS': {
      const interactions = action.payload
      const statsByPost = calculateStatsByPost(interactions)
      
      return {
        ...state,
        interactions,
        statsByPost,
        isLoading: false,
        error: null
      }
    }
    
    case 'LOAD_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      }
      
    case 'ADD_INTERACTION': {
      const interactions = [...state.interactions, action.payload]
      const statsByPost = calculateStatsByPost(interactions)
      
      return {
        ...state,
        interactions,
        statsByPost
      }
    }
    
    case 'REMOVE_INTERACTION': {
      const interactions = state.interactions.filter(i => i.id !== action.payload)
      const statsByPost = calculateStatsByPost(interactions)
      
      return {
        ...state,
        interactions,
        statsByPost
      }
    }
    
    case 'CLEAR_INTERACTIONS':
      return initialState
      
    default:
      return state
  }
}

// 計算統計數據的純函數
function calculateStatsByPost(interactions: PostInteraction[]): PostInteractionStats {
  const statsByPost: PostInteractionStats = {}
  
  // 按 postId 分組
  const groupedByPost = interactions.reduce((acc, interaction) => {
    const postId = interaction.postId
    if (!acc[postId]) {
      acc[postId] = []
    }
    acc[postId].push(interaction)
    return acc
  }, {} as Record<string, PostInteraction[]>)
  
  // 計算每個文章的統計
  Object.entries(groupedByPost).forEach(([postId, postInteractions]) => {
    statsByPost[postId] = {
      totalInteractions: postInteractions.length,
      replies: postInteractions.filter(i => i.type === 'reply').length,
      marks: postInteractions.filter(i => i.type === 'mark').length,
      comments: postInteractions.filter(i => i.type === 'comment').length
    }
  })
  
  return statsByPost
}

// Context
const InteractionContext = createContext<InteractionContextType | null>(null)

// Provider Props
type InteractionProviderProps = {
  readonly children: ReactNode
}

// Provider Component
export function InteractionProvider({ children }: InteractionProviderProps) {
  const [state, dispatch] = useReducer(interactionReducer, initialState)
  const postController = PostController.getInstance()

  // 載入互動數據
  const loadInteractions = useCallback(async () => {
    dispatch({ type: 'LOAD_START' })
    
    try {
      postController.loadInteractions()
      const interactions = postController.getAllInteractions()
      dispatch({ type: 'LOAD_SUCCESS', payload: interactions })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入互動數據失敗'
      dispatch({ type: 'LOAD_ERROR', payload: errorMessage })
    }
  }, [postController])

  // 初始化載入
  useEffect(() => {
    loadInteractions()
  }, [loadInteractions])

  // 監聽 Controller 事件
  useEffect(() => {
    const handleInteractionAdded = (interaction: PostInteraction) => {
      dispatch({ type: 'ADD_INTERACTION', payload: interaction })
    }

    const handleInteractionRemoved = (interactionId: string) => {
      dispatch({ type: 'REMOVE_INTERACTION', payload: interactionId })
    }

    postController.on('interactionAdded', handleInteractionAdded)
    postController.on('interactionRemoved', handleInteractionRemoved)

    return () => {
      postController.off('interactionAdded', handleInteractionAdded)
      postController.off('interactionRemoved', handleInteractionRemoved)
    }
  }, [postController])

  // 獲取單個文章統計
  const getPostStats = useCallback((postId: string): InteractionStats => {
    return state.statsByPost[postId] || {
      totalInteractions: 0,
      replies: 0,
      marks: 0,
      comments: 0
    }
  }, [state.statsByPost])

  // 獲取總統計
  const getTotalStats = useCallback((): InteractionStats => {
    return Object.values(state.statsByPost).reduce(
      (total, stats) => ({
        totalInteractions: total.totalInteractions + stats.totalInteractions,
        replies: total.replies + stats.replies,
        marks: total.marks + stats.marks,
        comments: total.comments + stats.comments
      }),
      { totalInteractions: 0, replies: 0, marks: 0, comments: 0 }
    )
  }, [state.statsByPost])

  // 刷新數據
  const refreshInteractions = useCallback(() => {
    loadInteractions()
  }, [loadInteractions])

  // 清除錯誤
  const clearError = useCallback(() => {
    if (state.error) {
      dispatch({ type: 'LOAD_START' }) // 重置錯誤狀態
    }
  }, [state.error])

  const contextValue: InteractionContextType = {
    // 狀態
    interactions: state.interactions,
    statsByPost: state.statsByPost,
    isLoading: state.isLoading,
    error: state.error,
    
    // 統計方法
    getPostStats,
    getTotalStats,
    
    // 操作方法
    refreshInteractions,
    clearError
  }

  return (
    <InteractionContext.Provider value={contextValue}>
      {children}
    </InteractionContext.Provider>
  )
}

// Hook
export function useInteraction(): InteractionContextType {
  const context = useContext(InteractionContext)
  if (!context) {
    throw new Error('useInteraction must be used within an InteractionProvider')
  }
  return context
} 