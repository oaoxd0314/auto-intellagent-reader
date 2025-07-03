import { AbstractController } from './AbstractController'
import { AIAgentService } from '../services/AIAgentService'

/**
 * AI Agent Controller - 簡單的聊天控制器
 */
export class AIAgentController extends AbstractController {
    private conversationHistory: Array<{ role: string; content: string }> = []

    constructor() {
        super('AIAgentController', {})
    }

    protected onInitialize(): void {
        this.log('AIAgentController initialized')
    }

    protected onDestroy(): void {
        this.conversationHistory = []
        this.log('AIAgentController destroyed')
    }

    /**
     * 發送消息
     */
    async sendMessage(userMessage: string, systemPrompt?: string): Promise<string> {
        // 構建消息陣列
        const messages: Array<{ role: string; content: string }> = []

        // 添加系統提示
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt })
        }

        // 添加對話歷史（保持最近 10 條）
        const recentHistory = this.conversationHistory.slice(-10)
        messages.push(...recentHistory)

        // 添加當前用戶消息
        messages.push({ role: 'user', content: userMessage })

        // 調用 Service 獲取回應
        const response = await AIAgentService.sendMessage(messages)

        // 更新對話歷史
        this.conversationHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: response }
        )

        // 限制歷史長度
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20)
        }

        return response
    }

    /**
     * 清理對話歷史
     */
    clearConversation(): void {
        this.conversationHistory = []
    }

    /**
     * 獲取對話歷史
     */
    getConversationHistory(): Array<{ role: string; content: string }> {
        return [...this.conversationHistory]
    }
} 