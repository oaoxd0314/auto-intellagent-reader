import { createContext, useContext, useReducer, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react'
import { BehaviorController, type SuggestionStrategy } from '../controllers'
import type { Suggestion } from '../types/suggestion'
import type { UserEvent } from '../types/behavior'

// 節流函數
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  
  return ((...args: any[]) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }) as T
}

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
  
  // 節流的調度函數 - 減少狀態更新頻率
  const throttledDispatch = useMemo(() => throttle((action: BehaviorAction) => {
    if (!isUnmountedRef.current) {
      dispatch(action)
    }
  }, 100), []) // 100ms 節流
  
  // 節流的數據更新函數
  const throttledDataUpdate = useMemo(() => throttle(() => {
    if (controllerRef.current && !isUnmountedRef.current) {
      const currentData = controllerRef.current.getCurrentData()
      throttledDispatch({ type: 'SET_CURRENT_DATA', payload: currentData })
    }
  }, 500), [throttledDispatch]) // 500ms 節流數據更新

  // 初始化控制器
  useEffect(() => {
    if (!controllerRef.current) {
      controllerRef.current = new BehaviorController()
      controllerRef.current.initialize()

      // 監聽控制器事件 - 使用節流
      const handleSuggestionsGenerated = throttle((suggestions: Suggestion[]) => {
        if (!isUnmountedRef.current) {
          throttledDispatch({ type: 'SET_SUGGESTIONS', payload: suggestions })
        }
      }, 200) // 200ms 節流建議更新

      const handleTrackingStarted = (postId: string) => {
        if (!isUnmountedRef.current) {
          throttledDispatch({ type: 'SET_TRACKING', payload: true })
          throttledDispatch({ type: 'SET_CURRENT_POST', payload: postId })
        }
      }

      const handleTrackingStopped = () => {
        if (!isUnmountedRef.current) {
          throttledDispatch({ type: 'SET_TRACKING', payload: false })
          throttledDispatch({ type: 'SET_CURRENT_POST', payload: null })
        }
      }

      const handleError = (error: Error) => {
        if (!isUnmountedRef.current) {
          throttledDispatch({ type: 'SET_ERROR', payload: error.message })
        }
      }

      controllerRef.current.on('suggestionsGenerated', handleSuggestionsGenerated)
      controllerRef.current.on('trackingStarted', handleTrackingStarted)
      controllerRef.current.on('trackingStopped', handleTrackingStopped)
      controllerRef.current.on('error', handleError)
    }

    return () => {
      isUnmountedRef.current = true
      
      // 清理定時器
      if (controllerRef.current && !controllerRef.current.getState().isDestroyed) {
        // 異步清理，避免阻塞
        Promise.resolve().then(async () => {
          try {
            await controllerRef.current?.stopTracking()
            controllerRef.current?.destroy()
          } catch (error) {
            console.error('Error during cleanup:', error)
          }
        })
      }
    }
  }, [throttledDispatch])

  // 開始追蹤
  const startTracking = useCallback(async (postId: string): Promise<void> => {
    if (!controllerRef.current) return

    throttledDispatch({ type: 'SET_LOADING', payload: true })
    throttledDispatch({ type: 'CLEAR_ERROR' })

    try {
      await controllerRef.current.startTracking(postId)
    } catch (error) {
      throttledDispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '開始追蹤失敗' 
      })
    } finally {
      throttledDispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [throttledDispatch])

  // 停止追蹤
  const stopTracking = useCallback(async (): Promise<void> => {
    if (!controllerRef.current) return

    throttledDispatch({ type: 'SET_LOADING', payload: true })

    try {
      await controllerRef.current.stopTracking()
      throttledDispatch({ type: 'SET_SUGGESTIONS', payload: [] })
      throttledDispatch({ type: 'SET_CURRENT_DATA', payload: null })
    } catch (error) {
      throttledDispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '停止追蹤失敗' 
      })
    } finally {
      throttledDispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [throttledDispatch])

  // 添加事件 - 使用節流減少頻率
  const addEvent = useCallback(async (event: Omit<UserEvent, 'timestamp'>): Promise<void> => {
    if (!controllerRef.current) return

    try {
      await controllerRef.current.addEvent(event)
      // 使用節流的數據更新
      throttledDataUpdate()
    } catch (error) {
      throttledDispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '添加事件失敗' 
      })
    }
  }, [throttledDispatch, throttledDataUpdate])

  // 添加策略
  const addStrategy = useCallback((strategy: SuggestionStrategy): void => {
    if (!controllerRef.current) return
    controllerRef.current.addStrategy(strategy)
  }, [])

  // 執行建議
  const executeSuggestion = useCallback(async (suggestion: Suggestion): Promise<void> => {
    try {
      await suggestion.action()
      // 移除已執行的建議
      const newSuggestions = state.suggestions.filter(s => s.id !== suggestion.id)
      throttledDispatch({ type: 'SET_SUGGESTIONS', payload: newSuggestions })
    } catch (error) {
      throttledDispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : '執行建議失敗' 
      })
    }
  }, [state.suggestions, throttledDispatch])

  // 清除錯誤
  const clearError = useCallback((): void => {
    throttledDispatch({ type: 'CLEAR_ERROR' })
  }, [throttledDispatch])

  // 獲取當前數據
  const getCurrentData = useCallback((): any => {
    return controllerRef.current?.getCurrentData() || null
  }, [])

  const contextValue: BehaviorContextType = useMemo(() => ({
    ...state,
    startTracking,
    stopTracking,
    addEvent,
    addStrategy,
    executeSuggestion,
    clearError,
    getCurrentData,
  }), [
    state,
    startTracking,
    stopTracking,
    addEvent,
    addStrategy,
    executeSuggestion,
    clearError,
    getCurrentData
  ])

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