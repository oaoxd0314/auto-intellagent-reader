import { AbstractController, createActionMap } from './AbstractController'
import { showAISuggestionToast } from '@/components/ui/ai-suggestion-toast'
import { ControllerRegistry } from '@/lib/ControllerRegistry'
import { useAISuggestionStore } from '@/stores/aiSuggestionStore'
import type { AISuggestion, UserResponse, SuggestionContext } from '@/types/suggestion'
import type { BehaviorData } from '@/stores/behaviorStore'

/**
 * AI 建議控制器 - 負責建議生成和執行協調
 * 
 * 職責：
 * - 根據行為數據生成智能建議
 * - 協調 Toast UI 顯示
 * - 處理用戶回應和執行建議
 * - 通過 ControllerRegistry 與其他 Controller 通訊
 * 
 * 注意：
 * - 狀態管理由 AISuggestionStore 負責
 * - Controller 不保存任何狀態，符合架構要求
 */
export class AISuggestionController extends AbstractController {
  private static instance: AISuggestionController | null = null

  // Action 映射表
  private actionMap = createActionMap([
    { type: 'GENERATE_SUGGESTIONS', handler: this.generateSuggestionsAction.bind(this), description: '根據行為數據生成建議' },
    { type: 'ADD_SUGGESTION', handler: this.addSuggestionAction.bind(this), description: '添加建議到隊列' },
    { type: 'PROCESS_NEXT_SUGGESTION', handler: this.processNextSuggestionAction.bind(this), description: '處理下一個建議' },
    { type: 'CLEAR_QUEUE', handler: this.clearQueueAction.bind(this), description: '清空建議隊列' },
    { type: 'GET_QUEUE_STATUS', handler: this.getQueueStatusAction.bind(this), description: '獲取隊列狀態' },
    { type: 'OPTIMIZE_QUEUE', handler: this.optimizeQueueAction.bind(this), description: '優化建議隊列' }
  ])

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
    const handler = this.actionMap[actionType]

    if (!handler) {
      this.emit('actionError', {
        actionType,
        error: `Unknown action: ${actionType}`,
        availableActions: Object.keys(this.actionMap)
      })
      return
    }

    this.log(`Executing action: ${actionType}`, payload)

    try {
      await handler(payload)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.emit('actionError', {
        actionType,
        payload,
        error: errorMessage
      })
      this.log(`Action failed: ${actionType}`, errorMessage)
    }
  }

  getSupportedActions(): string[] {
    return Object.keys(this.actionMap)
  }

  // === Action Handlers ===

  /**
   * 根據行為數據生成建議 Action
   */
  private async generateSuggestionsAction(payload: {
    behaviorData: BehaviorData
    context?: SuggestionContext
  }): Promise<void> {
    try {
      const { behaviorData, context } = payload
      const suggestions = this.generateSuggestionsFromBehavior(behaviorData, context)

      // 將生成的建議添加到 Store
      const store = useAISuggestionStore.getState()
      for (const suggestion of suggestions) {
        store.enqueue(suggestion)
        this.log('Suggestion generated and queued', {
          id: suggestion.id,
          type: suggestion.actionType,
          priority: suggestion.priority
        })
      }

      const queueStatus = store.getQueueStatus()
      this.emit('suggestionsGenerated', {
        behaviorData,
        context,
        suggestions,
        queueStatus
      })

      // 如果當前沒有顯示建議，立即處理下一個
      if (!queueStatus.isShowingSuggestion && suggestions.length > 0) {
        await this.processNextSuggestionAction()
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestions'
      this.emit('suggestionGenerationError', { error: errorMessage })
      throw error
    }
  }

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

    const store = useAISuggestionStore.getState()
    store.enqueue(suggestion)

    const queueStatus = store.getQueueStatus()
    this.emit('suggestionAdded', { suggestion, queueStatus })

    // 如果當前沒有顯示建議，立即處理下一個
    if (!queueStatus.isShowingSuggestion) {
      await this.processNextSuggestionAction()
    }
  }

  /**
   * 處理隊列中的下一個建議
   */
  private async processNextSuggestionAction(): Promise<void> {
    const store = useAISuggestionStore.getState()

    if (store.isShowingSuggestion) {
      this.log('Already showing suggestion, skipping')
      return
    }

    const nextSuggestion = store.dequeue()
    if (!nextSuggestion) {
      this.log('No suggestions in queue')
      return
    }

    this.log('Processing suggestion', {
      id: nextSuggestion.id,
      type: nextSuggestion.type,
      priority: nextSuggestion.priority
    })

    store.setIsShowingSuggestion(true)
    store.setCurrentSuggestion(nextSuggestion)

    // 使用現有的 showAISuggestionToast 顯示建議
    showAISuggestionToast(nextSuggestion, {
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

    this.emit('suggestionShown', { suggestion: nextSuggestion })
  }

  /**
   * 清空建議隊列
   */
  private async clearQueueAction(): Promise<void> {
    this.log('Clearing suggestion queue')
    const store = useAISuggestionStore.getState()
    store.clear()
    this.emit('queueCleared')
  }

  /**
   * 獲取隊列狀態
   */
  private async getQueueStatusAction(): Promise<void> {
    const store = useAISuggestionStore.getState()
    const status = store.getQueueStatus()
    this.log('Queue status requested', status)
    this.emit('queueStatus', status)
  }

  /**
   * 優化建議隊列 - 新增 Action
   */
  private async optimizeQueueAction(): Promise<void> {
    const store = useAISuggestionStore.getState()

    this.log('Optimizing suggestion queue')

    // 執行隊列優化操作
    const duplicatesRemoved = store.removeDuplicates()
    const expiredRemoved = store.removeExpired()
    store.reorderByPriority()

    this.log('Queue optimization completed', {
      duplicatesRemoved,
      expiredRemoved,
      currentQueueLength: store.getQueueStatus().queueLength
    })

    this.emit('queueOptimized', {
      duplicatesRemoved,
      expiredRemoved,
      queueStatus: store.getQueueStatus()
    })
  }

  // === 用戶互動處理 ===

  /**
   * 處理用戶回應
   */
  private handleUserResponse(response: UserResponse): void {
    this.log('User response received', response)

    const store = useAISuggestionStore.getState()
    const currentSuggestion = store.currentSuggestion

    if (!currentSuggestion || currentSuggestion.id !== response.suggestionId) {
      this.log('Warning: Response for unknown suggestion', response)
      return
    }

    this.emit('userResponse', { response, suggestion: currentSuggestion })

    // 更新統計
    switch (response.action) {
      case 'accept':
        store.incrementAccepted()
        this.executeSuggestion(currentSuggestion)
        break
      case 'reject':
        store.incrementRejected()
        this.log('Suggestion rejected by user', { suggestionId: response.suggestionId })
        break
      case 'dismiss':
        store.incrementDismissed()
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
      actionType: suggestion.actionType,
      controllerName: suggestion.controllerName
    })

    try {
      // 通過 ControllerRegistry 執行 action
      const registry = ControllerRegistry.getInstance()
      await registry.executeAction(suggestion.controllerName, suggestion.actionType, suggestion.payload)

      this.log('Suggestion executed successfully', {
        suggestionId: suggestion.id,
        controller: suggestion.controllerName,
        action: suggestion.actionType
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
   * 根據行為數據生成智能建議
   */
  private generateSuggestionsFromBehavior(
    behaviorData: BehaviorData,
    context?: SuggestionContext
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    const { userPattern } = behaviorData

    // 檢查是否有 AI 分析洞察
    const aiInsights = context?.aiAnalysis?.insights
    const hasAIGuidance = !!(aiInsights && context?.aiAnalysis?.source === 'llm')

    this.log('Generating suggestions', {
      behaviorPattern: userPattern.type,
      confidence: userPattern.confidence,
      hasAIGuidance,
      aiSuggestedActions: aiInsights?.suggestedActions || []
    })

    // 基於用戶閱讀模式和 AI 洞察生成建議
    switch (userPattern.type) {
      case 'scanning':
        // 掃描模式：優先考慮 AI 建議或預設邏輯
        const shouldSuggestBookmark = hasAIGuidance
          ? aiInsights.suggestedActions.includes('bookmark')
          : Math.random() > 0.5 // 50% 機率

        if (shouldSuggestBookmark) {
          suggestions.push({
            id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'action',
            priority: hasAIGuidance && aiInsights.confidenceLevel > 0.7 ? 'high' : 'medium',
            title: '收藏感興趣的文章',
            description: hasAIGuidance
              ? `AI 分析建議：${context.aiAnalysis?.summary.substring(0, 50)}...`
              : '發現有價值的內容，建議先收藏稍後深度閱讀',
            actionType: 'ADD_TO_BOOKMARK',
            controllerName: 'PostController',
            payload: { postId: context?.currentPost?.id || 'current' },
            timestamp: Date.now(),
            expiresAt: Date.now() + 5 * 60 * 1000,
            metadata: {
              userPattern: userPattern.type,
              confidence: userPattern.confidence,
              triggerReason: hasAIGuidance ? 'ai_guided_bookmark' : 'scanning_mode_bookmark_suggestion',
              aiGuidance: hasAIGuidance
            }
          })
        }
        break

      case 'studying':
        // 學習模式：AI 建議優先
        const shouldSuggestNote = hasAIGuidance
          ? aiInsights.suggestedActions.includes('note')
          : Math.random() > 0.3 // 70% 機率

        if (shouldSuggestNote) {
          suggestions.push({
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'action',
            priority: 'high',
            title: '為重要內容做筆記',
            description: hasAIGuidance
              ? `AI 建議：基於您的深度閱讀模式，建議記錄關鍵洞察`
              : '您正在深度學習，建議為關鍵概念添加筆記',
            actionType: 'ADD_NOTE',
            controllerName: 'InteractionController',
            payload: {
              postId: context?.currentPost?.id || 'current',
              sectionId: context?.currentSelection?.sectionId || 'section-1',
              selectedText: context?.currentSelection?.selectedText || '示例選擇文字',
              content: hasAIGuidance
                ? `AI 分析建議的筆記內容：${context.aiAnalysis?.summary}`
                : '基於您的閱讀模式自動生成的筆記建議'
            },
            timestamp: Date.now(),
            expiresAt: Date.now() + 10 * 60 * 1000,
            metadata: {
              userPattern: userPattern.type,
              confidence: userPattern.confidence,
              triggerReason: hasAIGuidance ? 'ai_guided_note' : 'studying_mode_note_suggestion',
              aiGuidance: hasAIGuidance
            }
          })
        }

        const shouldSuggestSummary = hasAIGuidance
          ? aiInsights.suggestedActions.includes('summary')
          : Math.random() > 0.6 // 40% 機率

        if (shouldSuggestSummary) {
          suggestions.push({
            id: `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'action',
            priority: 'medium',
            title: '創建文章摘要',
            description: hasAIGuidance
              ? `AI 建議：為深度閱讀內容創建結構化摘要`
              : '整理核心觀點，幫助記憶和復習',
            actionType: 'CREATE_SUMMARY',
            controllerName: 'PostController',
            payload: { postId: context?.currentPost?.id || 'current' },
            timestamp: Date.now(),
            expiresAt: Date.now() + 15 * 60 * 1000,
            metadata: {
              userPattern: userPattern.type,
              confidence: userPattern.confidence,
              triggerReason: hasAIGuidance ? 'ai_guided_summary' : 'studying_mode_summary_suggestion',
              aiGuidance: hasAIGuidance
            }
          })
        }
        break

      case 'reading':
        // 正常閱讀模式：平衡 AI 建議
        const shouldSuggestHighlight = hasAIGuidance
          ? aiInsights.suggestedActions.includes('highlight')
          : Math.random() > 0.7 // 30% 機率

        if (shouldSuggestHighlight) {
          suggestions.push({
            id: `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'action',
            priority: hasAIGuidance && aiInsights.userMood === 'focused' ? 'medium' : 'low',
            title: '標記重要內容',
            description: hasAIGuidance
              ? `AI 檢測到您對此內容有興趣，建議標記重點`
              : '將有價值的內容加入個人知識庫',
            actionType: 'ADD_HIGHLIGHT',
            controllerName: 'InteractionController',
            payload: {
              postId: context?.currentPost?.id || 'current',
              sectionId: context?.currentSelection?.sectionId || 'section-1',
              selectedText: context?.currentSelection?.selectedText || '示例高亮文字'
            },
            timestamp: Date.now(),
            expiresAt: Date.now() + 8 * 60 * 1000,
            metadata: {
              userPattern: userPattern.type,
              confidence: userPattern.confidence,
              triggerReason: hasAIGuidance ? 'ai_guided_highlight' : 'reading_mode_highlight_suggestion',
              aiGuidance: hasAIGuidance
            }
          })
        }
        break

      default:
        this.log('Unknown user pattern, skipping suggestions', userPattern.type)
    }

    // AI 增強過濾：基於信心度和事件數量調整
    if (hasAIGuidance && aiInsights.confidenceLevel < 0.5) {
      return suggestions.slice(0, 1) // AI 信心度低時減少建議
    } else if (userPattern.confidence < 0.5) {
      return suggestions.slice(0, 1) // 行為模式信心度低時減少建議
    }

    // 基於事件數量調整建議頻率
    if (behaviorData.sessionData.eventCount < 5) {
      return [] // 事件太少時不提供建議
    }

    this.log('Generated suggestions from behavior analysis', {
      behaviorPattern: userPattern.type,
      confidence: userPattern.confidence,
      suggestionsCount: suggestions.length,
      hasAIGuidance,
      aiConfidence: aiInsights?.confidenceLevel || 'N/A',
      suggestions: suggestions.map(s => ({
        id: s.id,
        type: s.actionType,
        priority: s.priority,
        aiGuidance: s.metadata?.aiGuidance || false
      }))
    })

    return suggestions
  }

  /**
   * 重置當前建議狀態，處理下一個
   */
  private resetCurrentSuggestion(): void {
    const store = useAISuggestionStore.getState()
    store.setIsShowingSuggestion(false)
    store.setCurrentSuggestion(null)

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
    const store = useAISuggestionStore.getState()
    return store.getQueueStatus()
  }
}