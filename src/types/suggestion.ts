// 建議類型
export type SuggestionType = 'bookmark' | 'note' | 'summary' | 'related' | 'break'

// 建議對象
export interface Suggestion {
    id: string
    type: SuggestionType
    title: string
    description: string
    confidence: number    // 0-1 建議信心度
    priority: number      // 1-5 優先級
    action: () => Promise<void>
    metadata?: Record<string, any>
}

// 建議歷史記錄
export interface SuggestionHistory {
    suggestion: Suggestion
    timestamp: number
    decision: 'accepted' | 'rejected' | 'ignored'
    executionResult?: 'success' | 'error'
} 