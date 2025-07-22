import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// 節流函數 - 從原 Context 遷移
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

// 用戶行為模式類型 - 從原 Context 遷移
interface UserPattern {
  type: 'scanning' | 'reading' | 'studying' | 'skimming'
  confidence: number
  duration: number
  focus_areas: string[]
}

// 行為數據類型 - 從原 Context 遷移
interface BehaviorData {
  recentEvents: string[]
  userPattern: UserPattern
  sessionData: {
    sessionStart: number
    duration: number
    eventCount: number
  }
  timestamp: number
}

// Store 狀態和方法定義
interface BehaviorStore {
  // State - 完全對應原 Context
  isCollecting: boolean
  currentPostId: string | null
  controllerEvents: string[]
  sessionStart: number
  lastEventTime: number
  error: string | null

  // Actions - 完全對應原 Context 方法
  startCollecting: (postId: string) => void
  stopCollecting: () => void
  collectEvent: (eventLog: string) => void
  getUserPattern: () => UserPattern
  getBehaviorData: () => BehaviorData
  clearError: () => void

  // Internal methods
  _setError: (error: string | null) => void
}

// 輔助函數：從事件日誌中提取焦點區域 - 從原 Context 遷移
function extractFocusAreas(events: string[]): string[] {
  const focusAreas: string[] = []

  events.forEach(event => {
    if (event.includes('Post')) focusAreas.push('content')
    if (event.includes('Interaction')) focusAreas.push('interaction')
    if (event.includes('Navigation')) focusAreas.push('navigation')
  })

  return [...new Set(focusAreas)] // 去重
}

// 創建 Zustand store
export const useBehaviorStore = create<BehaviorStore>()(
  devtools(
    (set, get) => {
      // 創建節流版本的 set 函數
      const throttledSet = throttle((partial: any) => {
        set(partial, false, 'throttled-update')
      }, 100)

      return {
        // Initial state - 對應原 Context initialState
        isCollecting: false,
        currentPostId: null,
        controllerEvents: [],
        sessionStart: Date.now(),
        lastEventTime: 0,
        error: null,

        // Actions - 完全對應原 Context 方法
        startCollecting: (postId: string) => {
          throttledSet({
            isCollecting: true,
            currentPostId: postId,
            sessionStart: Date.now(),
            controllerEvents: []
          })
        },

        stopCollecting: () => {
          throttledSet({
            isCollecting: false,
            currentPostId: null,
            controllerEvents: []
          })
        },

        collectEvent: (eventLog: string) => {
          const state = get()
          if (state.isCollecting) {
            throttledSet({
              controllerEvents: [...state.controllerEvents.slice(-49), eventLog], // 保持最近50個事件
              lastEventTime: Date.now()
            })
          }
        },

        getUserPattern: (): UserPattern => {
          const state = get()
          const { controllerEvents, sessionStart } = state
          const duration = Date.now() - sessionStart

          // 簡單的模式分析邏輯 - 與原 Context 完全相同
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
        },

        getBehaviorData: (): BehaviorData => {
          const state = get()
          const userPattern = state.getUserPattern()

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
        },

        clearError: () => {
          throttledSet({ error: null })
        },

        // Internal method for error handling
        _setError: (error: string | null) => {
          throttledSet({ error })
        }
      }
    },
    {
      name: 'behavior-store', // DevTools 中顯示的名稱
      serialize: {
        // 自定義序列化，避免 devtools 中顯示過多事件日誌
        options: {
          controllerEvents: {
            serialize: (events: string[]) => `[${events.length} events]`
          }
        }
      }
    }
  )
)

// Selectors for better performance - 可選的性能優化
export const useBehaviorCollecting = () => useBehaviorStore(state => state.isCollecting)
export const useBehaviorEvents = () => useBehaviorStore(state => state.controllerEvents)
export const useBehaviorError = () => useBehaviorStore(state => state.error)
export const useBehaviorActions = () => useBehaviorStore(state => ({
  startCollecting: state.startCollecting,
  stopCollecting: state.stopCollecting,
  collectEvent: state.collectEvent,
  clearError: state.clearError
}))

// Migration compatibility: 提供與原 useBehavior hook 相同的介面
export const useBehavior = () => {
  const state = useBehaviorStore()
  return {
    // State properties
    isCollecting: state.isCollecting,
    currentPostId: state.currentPostId,
    controllerEvents: state.controllerEvents,
    sessionStart: state.sessionStart,
    lastEventTime: state.lastEventTime,
    error: state.error,

    // Action methods
    startCollecting: state.startCollecting,
    stopCollecting: state.stopCollecting,
    collectEvent: state.collectEvent,
    getUserPattern: state.getUserPattern,
    getBehaviorData: state.getBehaviorData,
    clearError: state.clearError
  }
}

// Export types for external usage
export type { UserPattern, BehaviorData }