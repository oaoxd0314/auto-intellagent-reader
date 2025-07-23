import { AbstractController } from './AbstractController'
import { showAISuggestionToast } from '@/components/ui/ai-suggestion-toast'
import { ControllerRegistry } from '@/lib/ControllerRegistry'
import type { AISuggestion, UserResponse } from '@/types/suggestion'
import { AIAgentController } from './AIAgentController'

/**
 * AI 建議隊列管理
 */
class AISuggestionQueue {
  private queue: AISuggestion[] = []
  private currentSuggestion: AISuggestion | null = null

  enqueue(suggestion: AISuggestion): void {
    // 避免重複建議
    const isDuplicate = this.queue.some(s =>
      s.actionString === suggestion.actionString &&
      Date.now() - s.timestamp < 60000 // 1分鐘內不重複
    )

    if (!isDuplicate) {
      this.queue.push(suggestion)
      this.queue.sort((a, b) => {
        // 按優先級排序：high > medium > low
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
    }
  }

  dequeue(): AISuggestion | null {
    return this.queue.shift() || null
  }

  peek(): AISuggestion | null {
    return this.queue[0] || null
  }

  clear(): void {
    this.queue = []
    this.currentSuggestion = null
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      currentSuggestion: this.currentSuggestion,
      nextSuggestion: this.peek()
    }
  }

  setCurrentSuggestion(suggestion: AISuggestion | null): void {
    this.currentSuggestion = suggestion
  }

  getCurrentSuggestion(): AISuggestion | null {
    return this.currentSuggestion
  }
}

/**
 * AI 建議控制器 - 協調各組件的核心控制器
 * 
 * 職責：
 * - 管理建議隊列
 * - 協調 Toast UI 顯示
 * - 處理用戶回應
 * - 執行被接受的建議
 * - 與其他 Controller 的整合
 */
export class AISuggestionController extends AbstractController {
  private queue = new AISuggestionQueue()
  private isShowingSuggestion = false
  private currentToastId: string | null = null
  private static instance: AISuggestionController | null = null

  constructor() {
    super('AISuggestionController')
  }

  static getInstance(): AISuggestionController {
    if (!AISuggestionController.instance) {
      AISuggestionController.instance = new AISuggestionController()
    }
    return AISuggestionController.instance
  }


  // === AbstractController 必須實現的方法 ===

  async executeAction(actionType: string, payload?: any): Promise<void> {
    const actionMap: Record<string, (payload?: any) => Promise<void>> = {
      'ADD_SUGGESTION': this.addSuggestionAction.bind(this),
      'PROCESS_NEXT_SUGGESTION': this.processNextSuggestionAction.bind(this),
      'CLEAR_QUEUE': this.clearQueueAction.bind(this),
      'GET_QUEUE_STATUS': this.getQueueStatusAction.bind(this)
    }

    const handler = actionMap[actionType]
    if (!handler) {
      this.emit('actionError', {
        actionType,
        error: `Unknown action: ${actionType}`,
        availableActions: Object.keys(actionMap)
      })
      return
    }

    try {
      await handler(payload)
    } catch (error) {
      this.emit('actionError', {
        actionType,
        payload,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  getSupportedActions(): string[] {
    return ['ADD_SUGGESTION', 'PROCESS_NEXT_SUGGESTION', 'CLEAR_QUEUE', 'GET_QUEUE_STATUS']
  }

  // === Action Handlers ===

  /**
   * 添加建議到隊列
   */
  private async addSuggestionAction(payload: { suggestion: AISuggestion }): Promise<void> {
    const { suggestion } = payload

    this.log('Adding suggestion to queue', {
      id: suggestion.id,
      type: suggestion.type,
      priority: suggestion.priority,
      description: suggestion.description.substring(0, 50) + '...'
    })

    this.queue.enqueue(suggestion)
    this.emit('suggestionAdded', { suggestion, queueStatus: this.queue.getStatus() })

    // 如果當前沒有顯示建議，立即處理下一個
    if (!this.isShowingSuggestion) {
      await this.processNextSuggestionAction()
    }
  }

  /**
   * 處理隊列中的下一個建議
   */
  private async processNextSuggestionAction(): Promise<void> {
    if (this.isShowingSuggestion) {
      this.log('Already showing suggestion, skipping')
      return
    }

    const nextSuggestion = this.queue.dequeue()
    if (!nextSuggestion) {
      this.log('No suggestions in queue')
      return
    }

    this.log('Processing suggestion', {
      id: nextSuggestion.id,
      type: nextSuggestion.type,
      priority: nextSuggestion.priority
    })

    this.isShowingSuggestion = true
    this.queue.setCurrentSuggestion(nextSuggestion)

    // 使用現有的 showAISuggestionToast 顯示建議
    const toastResult = showAISuggestionToast(nextSuggestion, {
      onAccept: (suggestion) => this.handleUserResponse({
        suggestionId: suggestion.id,
        action: 'accept',
        timestamp: Date.now()
      }),
      onReject: (suggestion) => this.handleUserResponse({
        suggestionId: suggestion.id,
        action: 'reject',
        timestamp: Date.now()
      }),
      onDismiss: (suggestion) => this.handleUserResponse({
        suggestionId: suggestion.id,
        action: 'dismiss',
        timestamp: Date.now()
      })
    })

    this.currentToastId = toastResult.id
    this.emit('suggestionShown', { suggestion: nextSuggestion })
  }

  /**
   * 清空建議隊列
   */
  private async clearQueueAction(): Promise<void> {
    this.log('Clearing suggestion queue')
    this.queue.clear()
    this.isShowingSuggestion = false
    this.currentToastId = null
    this.emit('queueCleared')
  }

  /**
   * 獲取隊列狀態
   */
  private async getQueueStatusAction(): Promise<void> {
    const status = this.queue.getStatus()
    this.log('Queue status requested', status)
    this.emit('queueStatus', status)
  }

  // === 用戶互動處理 ===

  /**
   * 處理用戶回應
   */
  private handleUserResponse(response: UserResponse): void {
    this.log('User response received', response)

    const currentSuggestion = this.queue.getCurrentSuggestion()
    if (!currentSuggestion || currentSuggestion.id !== response.suggestionId) {
      this.log('Warning: Response for unknown suggestion', response)
      return
    }

    this.emit('userResponse', { response, suggestion: currentSuggestion })

    switch (response.action) {
      case 'accept':
        this.executeSuggestion(currentSuggestion)
        break
      case 'reject':
        this.log('Suggestion rejected by user', { suggestionId: response.suggestionId })
        break
      case 'dismiss':
        this.log('Suggestion dismissed by user', { suggestionId: response.suggestionId })
        break
    }

    // 重置狀態，準備處理下一個建議
    this.resetCurrentSuggestion()
  }

  /**
   * 執行被接受的建議
   */
  private async executeSuggestion(suggestion: AISuggestion): Promise<void> {
    this.log('Executing accepted suggestion', {
      id: suggestion.id,
      actionString: suggestion.actionString
    })

    try {
      // 解析 actionString: "ADD_TO_BOOKMARK postId=current"
      const actionParts = suggestion.actionString.split(' ')
      const actionType = actionParts[0]

      // 解析參數
      const params: Record<string, string> = {}
      for (let i = 1; i < actionParts.length; i++) {
        const [key, value] = actionParts[i].split('=')
        if (key && value) {
          params[key] = value
        }
      }

      // 根據 actionType 決定調用哪個 Controller
      const controllerName = this.getControllerForAction(actionType)
      if (!controllerName) {
        throw new Error(`Unknown action type: ${actionType}`)
      }

      // 通過 ControllerRegistry 執行 action
      const registry = ControllerRegistry.getInstance()
      await registry.executeAction(controllerName, actionType, params)

      this.log('Suggestion executed successfully', {
        suggestionId: suggestion.id,
        controller: controllerName,
        action: actionType
      })

      this.emit('suggestionExecuted', {
        suggestion,
        result: 'success'
      })

    } catch (error) {
      this.log('Failed to execute suggestion', {
        suggestionId: suggestion.id,
        error: error instanceof Error ? error.message : String(error)
      })

      this.emit('suggestionExecuted', {
        suggestion,
        result: 'error',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * 根據 action 類型決定使用哪個 Controller
   */
  private getControllerForAction(actionType: string): string | null {
    const actionControllerMap: Record<string, string> = {
      'ADD_TO_BOOKMARK': 'PostController',
      'ADD_TO_READING_HISTORY': 'PostController',
      'SEARCH_POSTS': 'PostController',
      'LOAD_POST': 'PostController',
      'ADD_COMMENT': 'PostController',
      'ADD_NOTE': 'InteractionController',
      'ADD_HIGHLIGHT': 'InteractionController'
    }

    return actionControllerMap[actionType] || null
  }

  /**
   * 重置當前建議狀態，處理下一個
   */
  private resetCurrentSuggestion(): void {
    this.isShowingSuggestion = false
    this.queue.setCurrentSuggestion(null)
    this.currentToastId = null

    // 延遲處理下一個建議，避免 UI 過於頻繁
    setTimeout(() => {
      this.processNextSuggestionAction().catch(error => {
        this.log('Failed to process next suggestion', error)
      })
    }, 1000) // 1秒延遲
  }

  // === 公共方法供外部調用 ===

  /**
   * 直接添加建議（供 AIAgentController 調用）
   */
  async addSuggestion(suggestion: AISuggestion): Promise<void> {
    await this.addSuggestionAction({ suggestion })
  }

  /**
   * 獲取當前隊列狀態
   */
  getQueueStatus() {
    return this.queue.getStatus()
  }
}