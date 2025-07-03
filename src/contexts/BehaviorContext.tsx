import { createContext, useContext, useReducer, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react'
// 移除 BehaviorController 引用
// import { BehaviorController, type SuggestionStrategy } from '@/controllers/BehaviorController'
import type { Suggestion } from '@/types/suggestion'

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

// 簡化的狀態類型 - 專注於事件收集
interface BehaviorState {
  isCollecting: boolean
  currentPostId: string | null
  controllerEvents: string[]  // Controller 事件日誌
  sessionStart: number
  lastEventTime: number
  error: string | null
}

// Action 類型
type BehaviorAction =
  | { type: 'START_COLLECTING'; payload: string }
  | { type: 'STOP_COLLECTING' }
  | { type: 'ADD_EVENT'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }

// 初始狀態
const initialState: BehaviorState = {
  isCollecting: false,
  currentPostId: null,
  controllerEvents: [],
  sessionStart: Date.now(),
  lastEventTime: 0,
  error: null,
}

// Reducer
function behaviorReducer(state: BehaviorState, action: BehaviorAction): BehaviorState {
  switch (action.type) {
    case 'START_COLLECTING':
      return { 
        ...state, 
        isCollecting: true, 
        currentPostId: action.payload,
        sessionStart: Date.now(),
        controllerEvents: []
      }
    case 'STOP_COLLECTING':
      return { 
        ...state, 
        isCollecting: false, 
        currentPostId: null,
        controllerEvents: []
      }
    case 'ADD_EVENT':
      return { 
        ...state, 
        controllerEvents: [...state.controllerEvents.slice(-49), action.payload], // 保持最近50個事件
        lastEventTime: Date.now()
      }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

// 用戶行為模式類型
interface UserPattern {
  type: 'scanning' | 'reading' | 'studying' | 'skimming'
  confidence: number
  duration: number
  focus_areas: string[]
}

// Context 類型 - 簡化為事件收集器
interface BehaviorContextType extends BehaviorState {
  // 事件收集方法
  startCollecting: (postId: string) => void
  stopCollecting: () => void
  collectEvent: (eventLog: string) => void
  
  // 數據分析方法
  getUserPattern: () => UserPattern
  getBehaviorData: () => {
    recentEvents: string[]
    userPattern: UserPattern
    sessionData: {
      sessionStart: number
      duration: number
      eventCount: number
    }
    timestamp: number
  }
  
  // 錯誤處理
  clearError: () => void
}

// Context
const BehaviorContext = createContext<BehaviorContextType | undefined>(undefined)

// Provider Props
interface BehaviorProviderProps {
  children: ReactNode
}

// Provider Component - 簡化為事件收集器
export function BehaviorProvider({ children }: BehaviorProviderProps) {
  const [state, dispatch] = useReducer(behaviorReducer, initialState)
  const isUnmountedRef = useRef(false)
  
  // 節流的調度函數
  const throttledDispatch = useMemo(() => throttle((action: BehaviorAction) => {
    if (!isUnmountedRef.current) {
      dispatch(action)
    }
  }, 100), [])

  // 清理函數
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  // 開始收集事件
  const startCollecting = useCallback((postId: string): void => {
    throttledDispatch({ type: 'START_COLLECTING', payload: postId })
  }, [throttledDispatch])

  // 停止收集事件
  const stopCollecting = useCallback((): void => {
    throttledDispatch({ type: 'STOP_COLLECTING' })
  }, [throttledDispatch])

  // 收集 Controller 事件日誌
  const collectEvent = useCallback((eventLog: string): void => {
    if (state.isCollecting) {
      throttledDispatch({ type: 'ADD_EVENT', payload: eventLog })
    }
  }, [state.isCollecting, throttledDispatch])

  // 分析用戶模式
  const getUserPattern = useCallback((): UserPattern => {
    const { controllerEvents, sessionStart } = state
    const duration = Date.now() - sessionStart
    
    // 簡單的模式分析邏輯
    const eventCount = controllerEvents.length
    const avgEventInterval = duration / Math.max(eventCount, 1)
    
    let type: UserPattern['type'] = 'reading'
    let confidence = 0.5
    
    if (avgEventInterval < 1000) {
      type = 'scanning'
      confidence = 0.8
    } else if (avgEventInterval > 5000) {
      type = 'studying'
      confidence = 0.7
    }
    
    return {
      type,
      confidence,
      duration,
      focus_areas: extractFocusAreas(controllerEvents)
    }
  }, [state])

  // 獲取完整行為數據
  const getBehaviorData = useCallback(() => {
    const userPattern = getUserPattern()
    
    return {
      recentEvents: [...state.controllerEvents],
      userPattern,
      sessionData: {
        sessionStart: state.sessionStart,
        duration: Date.now() - state.sessionStart,
        eventCount: state.controllerEvents.length
      },
      timestamp: Date.now()
    }
  }, [state, getUserPattern])

  // 清除錯誤
  const clearError = useCallback((): void => {
    throttledDispatch({ type: 'CLEAR_ERROR' })
  }, [throttledDispatch])

  const contextValue: BehaviorContextType = useMemo(() => ({
    ...state,
    startCollecting,
    stopCollecting,
    collectEvent,
    getUserPattern,
    getBehaviorData,
    clearError,
  }), [
    state,
    startCollecting,
    stopCollecting,
    collectEvent,
    getUserPattern,
    getBehaviorData,
    clearError
  ])

  return (
    <BehaviorContext.Provider value={contextValue}>
      {children}
    </BehaviorContext.Provider>
  )
}

// 輔助函數：從事件日誌中提取焦點區域
function extractFocusAreas(events: string[]): string[] {
  const focusAreas: string[] = []
  
  events.forEach(event => {
    if (event.includes('Post')) focusAreas.push('content')
    if (event.includes('Interaction')) focusAreas.push('interaction')
    if (event.includes('Navigation')) focusAreas.push('navigation')
  })
  
  return [...new Set(focusAreas)] // 去重
}

// Custom Hook
export function useBehavior(): BehaviorContextType {
  const context = useContext(BehaviorContext)
  if (context === undefined) {
    throw new Error('useBehavior must be used within a BehaviorProvider')
  }
  return context
} 