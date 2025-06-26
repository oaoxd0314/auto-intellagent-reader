import { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react'
import { BehaviorController, type SuggestionStrategy } from '../controllers'
import type { Suggestion } from '../types/suggestion'
import type { UserEvent, BehaviorSummary } from '../types/behavior'

// 狀態類型
interface BehaviorState {
  isTracking: boolean
  currentPostId: string | null
  suggestions: Suggestion[]
  currentData: any
  isLoading: boolean
  error: string | null
}

// Action 類型
type BehaviorAction =
  | { type: 'SET_TRACKING'; payload: boolean }
  | { type: 'SET_CURRENT_POST'; payload: string | null }
  | { type: 'SET_SUGGESTIONS'; payload: Suggestion[] }
  | { type: 'SET_CURRENT_DATA'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }

// 初始狀態
const initialState: BehaviorState = {
  isTracking: false,
  currentPostId: null,
  suggestions: [],
  currentData: null,
  isLoading: false,
  error: null,
}

// Reducer
function behaviorReducer(state: BehaviorState, action: BehaviorAction): BehaviorState {
  switch (action.type) {
    case 'SET_TRACKING':
      return { ...state, isTracking: action.payload }
    case 'SET_CURRENT_POST':
      return { ...state, currentPostId: action.payload }
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload }
    case 'SET_CURRENT_DATA':
      return { ...state, currentData: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

// Context 類型
interface BehaviorContextType extends BehaviorState {
  // Actions
  startTracking: (postId: string) => Promise<void>
  stopTracking: () => Promise<void>
  addEvent: (event: Omit<UserEvent, 'timestamp'>) => Promise<void>
  addStrategy: (strategy: SuggestionStrategy) => void
  executeSuggestion: (suggestion: Suggestion) => Promise<void>
  clearError: () => void
  // Utilities
  getCurrentData: () => any
}

// Context
const BehaviorContext = createContext<BehaviorContextType | undefined>(undefined)

// Provider Props
interface BehaviorProviderProps {
  children: ReactNode
}

// Provider Component
export function BehaviorProvider({ children }: BehaviorProviderProps) {
  const [state, dispatch] = useReducer(behaviorReducer, initialState)
  const controllerRef = useRef<BehaviorController | null>(null)
  const isUnmountedRef = useRef(false)

  // 初始化控制器
  useEffect(() => {
    if (!controllerRef.current) {
      controllerRef.current = new BehaviorController()
      controllerRef.current.initialize()

      // 監聽控制器事件
      controllerRef.current.on('suggestionsGenerated', (suggestions: Suggestion[]) => {
        if (!isUnmountedRef.current) {
          dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions })
        }
      })

      controllerRef.current.on('trackingStarted', (postId: string) => {
        if (!isUnmountedRef.current) {
          dispatch({ type: 'SET_TRACKING', payload: true })
          dispatch({ type: 'SET_CURRENT_POST', payload: postId })
        }
      })

      controllerRef.current.on('trackingStopped', () => {
        if (!isUnmountedRef.current) {
          dispatch({ type: 'SET_TRACKING', payload: false })
          dispatch({ type: 'SET_CURRENT_POST', payload: null })
        }
      })

      controllerRef.current.on('error', (error: Error) => {
        if (!isUnmountedRef.current) {
          dispatch({ type: 'SET_ERROR', payload: error.message })
        }
      })
    }

    return () => {
      isUnmountedRef.current = true
      if (controllerRef.current && !controllerRef.current.getState().isDestroyed) {
        controllerRef.current.stopTracking()
          .then(() => controllerRef.current?.destroy())
          .catch(console.error)
      }
    }
  }, [])

  // 開始追蹤
  const startTracking = async (postId: string): Promise<void> => {
    if (!controllerRef.current) return

    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'CLEAR_ERROR' })

    try {
      await controllerRef.current.startTracking(postId)
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '開始追蹤失敗' 
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // 停止追蹤
  const stopTracking = async (): Promise<void> => {
    if (!controllerRef.current) return

    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      await controllerRef.current.stopTracking()
      dispatch({ type: 'SET_SUGGESTIONS', payload: [] })
      dispatch({ type: 'SET_CURRENT_DATA', payload: null })
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '停止追蹤失敗' 
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // 添加事件
  const addEvent = async (event: Omit<UserEvent, 'timestamp'>): Promise<void> => {
    if (!controllerRef.current) return

    try {
      await controllerRef.current.addEvent(event)
      // 更新當前數據
      const currentData = controllerRef.current.getCurrentData()
      dispatch({ type: 'SET_CURRENT_DATA', payload: currentData })
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '添加事件失敗' 
      })
    }
  }

  // 添加策略
  const addStrategy = (strategy: SuggestionStrategy): void => {
    if (!controllerRef.current) return
    controllerRef.current.addStrategy(strategy)
  }

  // 執行建議
  const executeSuggestion = async (suggestion: Suggestion): Promise<void> => {
    try {
      await suggestion.action()
      // 移除已執行的建議
      const newSuggestions = state.suggestions.filter(s => s.id !== suggestion.id)
      dispatch({ type: 'SET_SUGGESTIONS', payload: newSuggestions })
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '執行建議失敗' 
      })
    }
  }

  // 清除錯誤
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  // 獲取當前數據
  const getCurrentData = (): any => {
    return controllerRef.current?.getCurrentData() || null
  }

  const contextValue: BehaviorContextType = {
    ...state,
    startTracking,
    stopTracking,
    addEvent,
    addStrategy,
    executeSuggestion,
    clearError,
    getCurrentData,
  }

  return (
    <BehaviorContext.Provider value={contextValue}>
      {children}
    </BehaviorContext.Provider>
  )
}

// Custom Hook
export function useBehavior(): BehaviorContextType {
  const context = useContext(BehaviorContext)
  if (context === undefined) {
    throw new Error('useBehavior must be used within a BehaviorProvider')
  }
  return context
} 