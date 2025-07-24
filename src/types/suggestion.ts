/**
 * AI 建議類型定義 - 符合實際實現需求
 */
export type AISuggestion = {
  id: string
  type: 'action' | 'recommendation' | 'reminder'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  timestamp: number

  // Action 執行相關字段
  actionType: string    // e.g., "ADD_TO_BOOKMARK"
  controllerName: string // e.g., "PostController"
  payload: any          // Action 執行所需的參數

  // 生命週期管理
  expiresAt: number     // 建議過期時間

  // 分析元數據
  metadata: {
    userPattern: string
    confidence: number
    triggerReason: string
    [key: string]: any
  }
}

/**
 * 用戶回應動作類型
 */
export type UserResponseAction = 'accept' | 'reject' | 'dismiss'

/**
 * 用戶回應類型定義
 */
export type UserResponse = {
  suggestionId: string
  action: UserResponseAction
  timestamp: number
}

/**
 * 建議生成上下文
 */
export type SuggestionContext = {
  currentPost?: {
    id: string
    title: string
    readingProgress: number
  }
  currentSelection?: {
    sectionId: string
    selectedText: string
    position: { x: number, y: number }
  }
  userBehavior: {
    pattern: string
    confidence: number
    eventCount: number
    focusAreas: string[]
  }
  aiAnalysis?: {
    summary: string
    insights: {
      suggestedActions: string[]
      userMood: string
      confidenceLevel: number
      recommendations: string[]
    } | null
    confidence: 'low' | 'medium' | 'high'
    source: 'llm' | 'rule_based'
  }
}