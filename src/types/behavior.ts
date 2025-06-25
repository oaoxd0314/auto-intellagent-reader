// 用戶行為事件類型
export type UserEventType = 'scroll' | 'pause' | 'click' | 'select' | 'exit'

// 用戶行為事件
export interface UserEvent {
    type: UserEventType
    timestamp: number
    context: {
        postId: string
        position: number      // 滾動位置或點擊位置
        duration?: number     // 停留時間
        selectedText?: string // 選中的文本
        elementId?: string    // 相關元素ID
    }
}

// 行為統計摘要
export interface BehaviorSummary {
    totalTime: number        // 總停留時間
    scrollDepth: number      // 滾動深度 (0-1)
    pauseCount: number       // 暫停次數
    selectionCount: number   // 選擇次數
    engagementScore: number  // 參與度分數 (0-1)
}

// 行為數據存儲結構
export interface BehaviorData {
    postId: string
    events: UserEvent[]
    summary: BehaviorSummary
    suggestions: any[] // 避免循環引用，實際使用時會是 SuggestionHistory[]
    preferences: Record<string, number>
    lastUpdated: number
} 