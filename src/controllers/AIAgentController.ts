import { AbstractController, createActionMap } from './AbstractController'

/**
 * AIAgentController - 純 Action Handler 實現
 * 專注於 AI 對話業務邏輯協調和事件發送
 */
export class AIAgentController extends AbstractController {
    private static instance: AIAgentController | null = null
    private conversationHistory: Array<{ role: string; content: string }> = []

    // Action 映射表
    private actionMap = createActionMap([
        { type: 'SEND_MESSAGE', handler: this.sendMessageAction.bind(this), description: '發送消息' },
        { type: 'CLEAR_CONVERSATION', handler: this.clearConversationAction.bind(this), description: '清理對話歷史' },
        { type: 'GET_CONVERSATION_HISTORY', handler: this.getConversationHistoryAction.bind(this), description: '獲取對話歷史' }
    ])

    // 單例模式
    static getInstance(): AIAgentController {
        if (!AIAgentController.instance) {
            AIAgentController.instance = new AIAgentController()
        }
        return AIAgentController.instance
    }

    private constructor() {
        super('AIAgentController')
    }

    protected onInitialize(): void {
        this.log('AIAgentController initialized')
    }

    protected onDestroy(): void {
        this.conversationHistory = []
        AIAgentController.instance = null
        this.log('AIAgentController destroyed')
    }

    // ===== AbstractController 實現 =====

    /**
     * 統一 Action 處理入口
     */
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

    /**
     * 獲取支援的 Action 列表
     */
    getSupportedActions(): string[] {
        return Object.keys(this.actionMap)
    }

    // ===== Action Handlers =====

    /**
     * 發送消息 Action
     */
    private async sendMessageAction(payload: { userMessage: string; systemPrompt?: string }): Promise<void> {
        try {
            if (!payload.userMessage?.trim()) {
                throw new Error('User message cannot be empty')
            }

            // 構建消息陣列
            const messages: Array<{ role: string; content: string }> = []

            // 添加系統提示
            if (payload.systemPrompt) {
                messages.push({ role: 'system', content: payload.systemPrompt })
            }

            // 添加對話歷史（保持最近 10 條）
            const recentHistory = this.conversationHistory.slice(-10)
            messages.push(...recentHistory)

            // 添加當前用戶消息
            messages.push({ role: 'user', content: payload.userMessage })

            // 模擬 AI 回應（這裡應該調用 AIAgentService）
            const response = `AI 回應: ${payload.userMessage}`

            // 更新對話歷史
            this.conversationHistory.push(
                { role: 'user', content: payload.userMessage },
                { role: 'assistant', content: response }
            )

            // 限制歷史長度
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20)
            }

            this.emit('messageReceived', {
                userMessage: payload.userMessage,
                assistantResponse: response,
                conversationHistory: [...this.conversationHistory]
            })
            
            this.log(`Message processed: "${payload.userMessage.substring(0, 50)}..."`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
            this.emit('messageError', errorMessage)
            throw error
        }
    }

    /**
     * 清理對話歷史 Action
     */
    private async clearConversationAction(): Promise<void> {
        try {
            this.conversationHistory = []
            this.emit('conversationCleared')
            this.log('Conversation history cleared')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to clear conversation'
            this.emit('conversationError', errorMessage)
            throw error
        }
    }

    /**
     * 獲取對話歷史 Action
     */
    private async getConversationHistoryAction(): Promise<void> {
        try {
            const history = [...this.conversationHistory]
            this.emit('conversationHistoryLoaded', history)
            this.log(`Conversation history loaded: ${history.length} messages`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load conversation history'
            this.emit('conversationError', errorMessage)
            throw error
        }
    }

    // ===== 輔助方法 (不是 Action Handlers) =====

    /**
     * 獲取對話歷史 - 同步方法
     */
    getConversationHistory(): Array<{ role: string; content: string }> {
        return [...this.conversationHistory]
    }
} 