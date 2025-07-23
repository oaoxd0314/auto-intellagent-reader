/**
 * AI 建議類型定義 - 符合 ai-behavior-architecture.md 規格
 */
export interface AISuggestion {
  id: string
  type: 'action' | 'recommendation' | 'reminder'
  actionString: string  // e.g., "ADD_TO_BOOKMARK postId=current"
  description: string   // 給用戶看的描述
  priority: 'low' | 'medium' | 'high'
  timestamp: number
}

/**
 * 用戶回應動作類型
 */
export type UserResponseAction = 'accept' | 'reject' | 'dismiss'

/**
 * 用戶回應類型定義
 */
export interface UserResponse {
  suggestionId: string
  action: UserResponseAction
  timestamp: number
} 