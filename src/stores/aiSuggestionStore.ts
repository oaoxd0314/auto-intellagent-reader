import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AISuggestion } from '@/types/suggestion'

/**
 * AI 建議隊列狀態管理
 * 
 * 職責：
 * - 管理建議隊列狀態
 * - 處理建議的添加、移除、排序
 * - 追蹤當前顯示的建議
 * - 提供隊列統計信息
 */
interface AISuggestionState {
    // === 狀態 ===
    queue: AISuggestion[]
    currentSuggestion: AISuggestion | null
    isShowingSuggestion: boolean

    // === 統計信息 ===
    totalGenerated: number
    totalAccepted: number
    totalRejected: number
    totalDismissed: number

    // === 隊列操作 ===
    enqueue: (suggestion: AISuggestion) => void
    dequeue: () => AISuggestion | null
    peek: () => AISuggestion | null
    clear: () => void

    // === 當前建議管理 ===
    setCurrentSuggestion: (suggestion: AISuggestion | null) => void
    setIsShowingSuggestion: (isShowing: boolean) => void

    // === 隊列優化 ===
    removeDuplicates: () => number
    removeExpired: () => number
    reorderByPriority: () => void

    // === 統計操作 ===
    incrementAccepted: () => void
    incrementRejected: () => void
    incrementDismissed: () => void

    // === 查詢方法 ===
    getQueueStatus: () => {
        queueLength: number
        currentSuggestion: AISuggestion | null
        nextSuggestion: AISuggestion | null
        isShowingSuggestion: boolean
        totalGenerated: number
        totalAccepted: number
        totalRejected: number
        totalDismissed: number
    }

    // === 調試方法 ===
    getDebugInfo: () => any
}

/**
 * 建議優先級排序權重
 */
const PRIORITY_WEIGHTS = {
    high: 3,
    medium: 2,
    low: 1
} as const

/**
 * 建議去重檢查時間窗口（毫秒）
 */
const DUPLICATE_CHECK_WINDOW = 60000 // 1分鐘

/**
 * AI 建議 Store
 */
export const useAISuggestionStore = create<AISuggestionState>()(
    devtools(
        (set, get) => ({
            // === 初始狀態 ===
            queue: [],
            currentSuggestion: null,
            isShowingSuggestion: false,
            totalGenerated: 0,
            totalAccepted: 0,
            totalRejected: 0,
            totalDismissed: 0,

            // === 隊列操作 ===
            enqueue: (suggestion: AISuggestion) => {
                set(state => {
                    // 檢查重複建議
                    const isDuplicate = state.queue.some(existing =>
                        existing.actionType === suggestion.actionType &&
                        existing.controllerName === suggestion.controllerName &&
                        Date.now() - existing.timestamp < DUPLICATE_CHECK_WINDOW
                    )

                    if (isDuplicate) {
                        console.log('[AISuggestionStore] Duplicate suggestion ignored', {
                            actionType: suggestion.actionType,
                            controllerName: suggestion.controllerName
                        })
                        return state
                    }

                    // 添加到隊列並排序
                    const newQueue = [...state.queue, suggestion]
                    newQueue.sort((a, b) => {
                        const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]
                        if (priorityDiff !== 0) return priorityDiff
                        // 相同優先級按時間排序（新的在前）
                        return b.timestamp - a.timestamp
                    })

                    console.log('[AISuggestionStore] Suggestion enqueued', {
                        id: suggestion.id,
                        actionType: suggestion.actionType,
                        priority: suggestion.priority,
                        queueLength: newQueue.length
                    })

                    return {
                        ...state,
                        queue: newQueue,
                        totalGenerated: state.totalGenerated + 1
                    }
                })
            },

            dequeue: () => {
                const state = get()
                if (state.queue.length === 0) return null

                const suggestion = state.queue[0]
                set(prevState => ({
                    ...prevState,
                    queue: prevState.queue.slice(1)
                }))

                console.log('[AISuggestionStore] Suggestion dequeued', {
                    id: suggestion.id,
                    remainingInQueue: state.queue.length - 1
                })

                return suggestion
            },

            peek: () => {
                const state = get()
                return state.queue[0] || null
            },

            clear: () => {
                console.log('[AISuggestionStore] Queue cleared')
                set(state => ({
                    ...state,
                    queue: [],
                    currentSuggestion: null,
                    isShowingSuggestion: false
                }))
            },

            // === 當前建議管理 ===
            setCurrentSuggestion: (suggestion: AISuggestion | null) => {
                set(state => ({
                    ...state,
                    currentSuggestion: suggestion
                }))

                if (suggestion) {
                    console.log('[AISuggestionStore] Current suggestion set', {
                        id: suggestion.id,
                        actionType: suggestion.actionType
                    })
                }
            },

            setIsShowingSuggestion: (isShowing: boolean) => {
                set(state => ({
                    ...state,
                    isShowingSuggestion: isShowing
                }))
            },

            // === 隊列優化 ===
            removeDuplicates: () => {
                const state = get()
                const seen = new Set<string>()
                const uniqueQueue = state.queue.filter(suggestion => {
                    const key = `${suggestion.actionType}-${suggestion.controllerName}`
                    if (seen.has(key)) {
                        return false
                    }
                    seen.add(key)
                    return true
                })

                const removedCount = state.queue.length - uniqueQueue.length
                if (removedCount > 0) {
                    set(prevState => ({
                        ...prevState,
                        queue: uniqueQueue
                    }))
                    console.log('[AISuggestionStore] Removed duplicates', { count: removedCount })
                }

                return removedCount
            },

            removeExpired: () => {
                const state = get()
                const now = Date.now()
                const validQueue = state.queue.filter(suggestion => {
                    return !suggestion.expiresAt || suggestion.expiresAt > now
                })

                const removedCount = state.queue.length - validQueue.length
                if (removedCount > 0) {
                    set(prevState => ({
                        ...prevState,
                        queue: validQueue
                    }))
                    console.log('[AISuggestionStore] Removed expired suggestions', { count: removedCount })
                }

                return removedCount
            },

            reorderByPriority: () => {
                set(state => {
                    const sortedQueue = [...state.queue].sort((a, b) => {
                        const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]
                        if (priorityDiff !== 0) return priorityDiff
                        return b.timestamp - a.timestamp
                    })

                    return {
                        ...state,
                        queue: sortedQueue
                    }
                })
            },

            // === 統計操作 ===
            incrementAccepted: () => {
                set(state => ({
                    ...state,
                    totalAccepted: state.totalAccepted + 1
                }))
            },

            incrementRejected: () => {
                set(state => ({
                    ...state,
                    totalRejected: state.totalRejected + 1
                }))
            },

            incrementDismissed: () => {
                set(state => ({
                    ...state,
                    totalDismissed: state.totalDismissed + 1
                }))
            },

            // === 查詢方法 ===
            getQueueStatus: () => {
                const state = get()
                return {
                    queueLength: state.queue.length,
                    currentSuggestion: state.currentSuggestion,
                    nextSuggestion: state.queue[0] || null,
                    isShowingSuggestion: state.isShowingSuggestion,
                    totalGenerated: state.totalGenerated,
                    totalAccepted: state.totalAccepted,
                    totalRejected: state.totalRejected,
                    totalDismissed: state.totalDismissed
                }
            },

            // === 調試方法 ===
            getDebugInfo: () => {
                const state = get()
                return {
                    queue: state.queue.map(s => ({
                        id: s.id,
                        actionType: s.actionType,
                        priority: s.priority,
                        timestamp: s.timestamp,
                        expiresAt: s.expiresAt
                    })),
                    currentSuggestion: state.currentSuggestion ? {
                        id: state.currentSuggestion.id,
                        actionType: state.currentSuggestion.actionType,
                        priority: state.currentSuggestion.priority
                    } : null,
                    isShowingSuggestion: state.isShowingSuggestion,
                    stats: {
                        totalGenerated: state.totalGenerated,
                        totalAccepted: state.totalAccepted,
                        totalRejected: state.totalRejected,
                        totalDismissed: state.totalDismissed,
                        acceptanceRate: state.totalGenerated > 0
                            ? (state.totalAccepted / state.totalGenerated * 100).toFixed(1) + '%'
                            : '0%'
                    }
                }
            }
        }),
        {
            name: 'ai-suggestion-store',
            partialize: (state: AISuggestionState) => ({
                // 只持久化統計數據，不持久化隊列（重新載入時清空）
                totalGenerated: state.totalGenerated,
                totalAccepted: state.totalAccepted,
                totalRejected: state.totalRejected,
                totalDismissed: state.totalDismissed
            })
        }
    )
) 