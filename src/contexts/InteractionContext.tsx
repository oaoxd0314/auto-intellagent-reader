import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import { InteractionController } from '../controllers/InteractionController'
import type { PostInteraction, InteractionType } from '../types/post'

/**
 * 互動狀態定義
 */
type InteractionState = {
  readonly interactions: PostInteraction[]
  readonly interactionsByPost: Record<string, PostInteraction[]>
  readonly isLoading: boolean
  readonly error: string | null
}

/**
 * 互動 Actions
 */
type InteractionAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: PostInteraction[] }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'ADD_INTERACTION'; payload: PostInteraction }
  | { type: 'REMOVE_INTERACTION'; payload: string }
  | { type: 'UPDATE_INTERACTION'; payload: PostInteraction }
  | { type: 'CLEAR_ERROR' }

/**
 * Context Value 類型
 */
type InteractionContextType = {
  // 狀態
  readonly state: InteractionState
  
  // 查詢方法
  readonly getInteractionsByPostId: (postId: string) => PostInteraction[]
  readonly getInteractionsByType: (postId: string, type: InteractionType) => PostInteraction[]
  readonly getInteractionsBySectionId: (postId: string, sectionId: string) => PostInteraction[]
  
  // 統計方法
  readonly getInteractionStats: (postId: string) => {
    replies: number
    comments: number
    highlights: number
    total: number
  }
  
  // 操作方法
  readonly refreshInteractions: () => Promise<void>
  readonly clearError: () => void
}

/**
 * 計算按文章分組的互動數據
 */
function calculateInteractionsByPost(interactions: PostInteraction[]): Record<string, PostInteraction[]> {
  return interactions.reduce((acc, interaction) => {
    const { postId } = interaction
    if (!acc[postId]) {
      acc[postId] = []
    }
    acc[postId].push(interaction)
    return acc
  }, {} as Record<string, PostInteraction[]>)
}

/**
 * Reducer
 */
function interactionReducer(state: InteractionState, action: InteractionAction): InteractionState {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }

    case 'LOAD_SUCCESS':
      return {
        ...state,
        interactions: action.payload,
        interactionsByPost: calculateInteractionsByPost(action.payload),
        isLoading: false,
        error: null
      }

    case 'LOAD_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      }

    case 'ADD_INTERACTION':
      const newInteractions = [...state.interactions, action.payload]
      return {
        ...state,
        interactions: newInteractions,
        interactionsByPost: calculateInteractionsByPost(newInteractions)
      }

    case 'REMOVE_INTERACTION':
      const filteredInteractions = state.interactions.filter(
        interaction => interaction.id !== action.payload
      )
      return {
        ...state,
        interactions: filteredInteractions,
        interactionsByPost: calculateInteractionsByPost(filteredInteractions)
      }

    case 'UPDATE_INTERACTION':
      const updatedInteractions = state.interactions.map(interaction =>
        interaction.id === action.payload.id ? action.payload : interaction
      )
      return {
        ...state,
        interactions: updatedInteractions,
        interactionsByPost: calculateInteractionsByPost(updatedInteractions)
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }

    default:
      return state
  }
}

/**
 * 初始狀態
 */
const initialState: InteractionState = {
  interactions: [],
  interactionsByPost: {},
  isLoading: false,
  error: null
}

/**
 * Context
 */
const InteractionContext = createContext<InteractionContextType | undefined>(undefined)

/**
 * Provider
 */
export function InteractionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(interactionReducer, initialState)
  
  // 使用 useRef 穩定 controller 引用
  const controllerRef = useRef<InteractionController | null>(null)
  
  // 獲取 controller 實例
  if (!controllerRef.current) {
    controllerRef.current = InteractionController.getInstance()
  }

  // 載入所有互動數據
  const refreshInteractions = async (): Promise<void> => {
    dispatch({ type: 'LOAD_START' })
    try {
      // 直接調用 Service 獲取所有互動數據
      const { InteractionService } = await import('../services/InteractionService')
      const allInteractions = await InteractionService.getAllInteractions()
      dispatch({ type: 'LOAD_SUCCESS', payload: allInteractions })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load interactions'
      dispatch({ type: 'LOAD_ERROR', payload: errorMessage })
    }
  }

  // 初始化和事件監聽
  useEffect(() => {
    const controller = controllerRef.current!
    
    // 初始化 controller
    controller.initialize()
    
    // 載入初始數據
    refreshInteractions()
    
    // 監聽 Controller 事件
    const handleInteractionAdded = (interaction: PostInteraction) => {
      dispatch({ type: 'ADD_INTERACTION', payload: interaction })
    }
    
    const handleInteractionRemoved = (interactionId: string) => {
      dispatch({ type: 'REMOVE_INTERACTION', payload: interactionId })
    }
    
    const handleInteractionUpdated = (interaction: PostInteraction) => {
      dispatch({ type: 'UPDATE_INTERACTION', payload: interaction })
    }
    
    const handleError = (error: string) => {
      dispatch({ type: 'LOAD_ERROR', payload: error })
    }

    // 註冊事件監聽器
    controller.on('interactionAdded', handleInteractionAdded)
    controller.on('interactionRemoved', handleInteractionRemoved)
    controller.on('interactionUpdated', handleInteractionUpdated)
    controller.on('error', handleError)
    
    // 清理函數
    return () => {
      controller.off('interactionAdded', handleInteractionAdded)
      controller.off('interactionRemoved', handleInteractionRemoved)
      controller.off('interactionUpdated', handleInteractionUpdated)
      controller.off('error', handleError)
    }
  }, [])

  // 查詢方法
  const getInteractionsByPostId = (postId: string): PostInteraction[] => {
    return state.interactionsByPost[postId] || []
  }

  const getInteractionsByType = (postId: string, type: InteractionType): PostInteraction[] => {
    const postInteractions = getInteractionsByPostId(postId)
    return postInteractions.filter(interaction => interaction.type === type)
  }

  const getInteractionsBySectionId = (postId: string, sectionId: string): PostInteraction[] => {
    const postInteractions = getInteractionsByPostId(postId)
    return postInteractions.filter(interaction => 
      interaction.position?.sectionId === sectionId
    )
  }

  // 統計方法
  const getInteractionStats = (postId: string) => {
    const postInteractions = getInteractionsByPostId(postId)
    
    return {
      replies: postInteractions.filter(i => i.type === 'reply').length,
      comments: postInteractions.filter(i => i.type === 'comment').length,
      highlights: postInteractions.filter(i => i.type === 'mark').length,
      total: postInteractions.length
    }
  }

  // 清除錯誤
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const contextValue: InteractionContextType = {
    state,
    getInteractionsByPostId,
    getInteractionsByType,
    getInteractionsBySectionId,
    getInteractionStats,
    refreshInteractions,
    clearError
  }

  return (
    <InteractionContext.Provider value={contextValue}>
      {children}
    </InteractionContext.Provider>
  )
}

/**
 * Hook
 */
export function useInteraction(): InteractionContextType {
  const context = useContext(InteractionContext)
  if (context === undefined) {
    throw new Error('useInteraction must be used within an InteractionProvider')
  }
  return context
} 