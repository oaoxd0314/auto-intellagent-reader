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

// 行為數據類型 - 更新後支援事件過濾
interface BehaviorData {
  recentEvents: string[] // 過濾後的相關事件
  userPattern: UserPattern
  sessionData: {
    sessionStart: number
    duration: number
    eventCount: number // 相關事件數量
    totalEventCount: number // 總事件數量
    currentContext: string | null // 當前上下文
  }
  timestamp: number
}

// Store 狀態和方法定義
interface BehaviorStore {
  // State - 簡化後的狀態
  controllerEvents: string[]
  sessionStart: number
  lastEventTime: number
  error: string | null
  currentContext: string | null // 當前上下文（如 postId），用於分析過濾

  // Actions - 簡化後的方法
  collectEvent: (eventLog: string) => void
  setCurrentContext: (context: string | null) => void
  getUserPattern: () => UserPattern
  getBehaviorData: () => BehaviorData
  clearError: () => void
  clearEvents: () => void

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
        // Initial state - 簡化後的初始狀態
        controllerEvents: [],
        sessionStart: Date.now(),
        lastEventTime: 0,
        error: null,
        currentContext: null,

        // Actions - 簡化後的方法實現
        collectEvent: (eventLog: string) => {
          const state = get()
          console.log('📝 [BehaviorStore] 收集新事件:', eventLog)
          console.log('📊 [BehaviorStore] 當前狀態:', {
            當前上下文: state.currentContext,
            事件總數: state.controllerEvents.length,
            最新事件時間: new Date(state.lastEventTime).toLocaleTimeString()
          })
          
          // 全局收集所有事件，不再檢查 isCollecting flag
          throttledSet({
            controllerEvents: [...state.controllerEvents.slice(-49), eventLog], // 保持最近50個事件
            lastEventTime: Date.now()
          })
        },

        setCurrentContext: (context: string | null) => {
          console.log('🎯 [BehaviorStore] 設置當前上下文:', context)
          throttledSet({
            currentContext: context,
            // 如果切換上下文，重置 session 開始時間
            sessionStart: context ? Date.now() : Date.now()
          })
        },

        clearEvents: () => {
          console.log('🧹 [BehaviorStore] 清空事件記錄')
          throttledSet({
            controllerEvents: [],
            sessionStart: Date.now(),
            lastEventTime: 0
          })
        },

        getUserPattern: (): UserPattern => {
          const state = get()
          const { controllerEvents, sessionStart } = state
          const duration = Date.now() - sessionStart

          // 🎯 簡化：只要是用戶行為相關的事件就保留
          const relevantEvents = controllerEvents.filter(event => {
            // 排除 AI 系統自己的事件和生命週期事件
            return !event.includes('AIAgentController') && 
                   !event.includes('initialized') && 
                   !event.includes('destroyed')
          })

          console.log('🔍 [BehaviorStore] 事件過濾結果:', {
            總事件數: controllerEvents.length,
            相關事件數: relevantEvents.length,
            過濾比例: `${Math.round((relevantEvents.length / Math.max(controllerEvents.length, 1)) * 100)}%`
          })

          // 基於相關事件進行模式分析
          const eventCount = relevantEvents.length
          const avgEventInterval = eventCount > 0 ? duration / eventCount : duration

          let type: UserPattern['type'] = 'reading'
          let confidence = 0.5

          // 根據事件頻率判斷閱讀模式
          if (avgEventInterval < 1000 && eventCount > 3) {
            type = 'scanning'
            confidence = 0.8
          } else if (avgEventInterval > 5000 && eventCount > 1) {
            type = 'studying'
            confidence = 0.7
          } else if (eventCount > 0) {
            type = 'reading'
            confidence = 0.6
          }

          // 如果沒有相關事件，降低信心度
          if (eventCount === 0) {
            confidence = 0.1
          }

          return {
            type,
            confidence,
            duration,
            focus_areas: extractFocusAreas(relevantEvents) // 使用過濾後的事件
          }
        },

        getBehaviorData: (): BehaviorData => {
          const state = get()
          const userPattern = state.getUserPattern()

          // 同樣在這裡應用事件過濾，確保一致性
          const relevantEvents = state.controllerEvents.filter(event => {
            // 排除 AI 系統自己的事件和生命週期事件
            return !event.includes('AIAgentController') && 
                   !event.includes('initialized') && 
                   !event.includes('destroyed')
          })

          return {
            recentEvents: [...relevantEvents], // 只返回相關事件
            userPattern,
            sessionData: {
              sessionStart: state.sessionStart,
              duration: Date.now() - state.sessionStart,
              eventCount: relevantEvents.length, // 使用過濾後的事件數量
              totalEventCount: state.controllerEvents.length, // 新增：總事件數量供參考
              currentContext: state.currentContext // 新增：當前上下文信息
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

// Selectors for better performance - 更新後的選擇器
export const useBehaviorEvents = () => useBehaviorStore(state => state.controllerEvents)
export const useBehaviorError = () => useBehaviorStore(state => state.error)
export const useBehaviorContext = () => useBehaviorStore(state => state.currentContext)
export const useBehaviorActions = () => useBehaviorStore(state => ({
  collectEvent: state.collectEvent,
  setCurrentContext: state.setCurrentContext,
  clearEvents: state.clearEvents,
  clearError: state.clearError
}))

// 獲取過濾後的相關事件（用於 AI 分析）
export const useRelevantBehaviorEvents = () => useBehaviorStore(state => {
  return state.controllerEvents.filter(event => {
    return event.includes('PostController') || 
           event.includes('InteractionController') ||
           event.includes('MarkdownRenderer') ||
           (!event.includes('AIAgentController') && 
            !event.includes('initialized') && 
            !event.includes('destroyed'))
  })
})

// 獲取當前用戶行為模式
export const useBehaviorPattern = () => useBehaviorStore(state => state.getUserPattern())

// 簡化的 useBehavior hook - 向後兼容但功能精簡
export const useBehavior = () => {
  const state = useBehaviorStore()
  return {
    // State properties - 更新後的狀態
    controllerEvents: state.controllerEvents,
    currentContext: state.currentContext,
    sessionStart: state.sessionStart,
    lastEventTime: state.lastEventTime,
    error: state.error,

    // Action methods - 更新後的方法  
    collectEvent: state.collectEvent,
    setCurrentContext: state.setCurrentContext,
    getUserPattern: state.getUserPattern,
    getBehaviorData: state.getBehaviorData,
    clearEvents: state.clearEvents,
    clearError: state.clearError
  }
}

// Export types for external usage
export type { UserPattern, BehaviorData }