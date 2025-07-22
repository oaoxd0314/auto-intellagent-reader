import { AbstractController, createActionMap } from './AbstractController'
import { useBehaviorStore, type BehaviorData } from '../stores/behaviorStore'
import { AIAgentService } from '../services/AIAgentService'

/**
 * AIAgentController - 純 Action Handler 實現
 * 專注於 AI 對話業務邏輯協調和事件發送
 */
export class AIAgentController extends AbstractController {
    private static instance: AIAgentController | null = null
    private conversationHistory: Array<{ role: string; content: string }> = []
    private behaviorMonitoringInterval: NodeJS.Timeout | null = null
    private isMonitoringBehavior = false

    // Action 映射表
    private actionMap = createActionMap([
        { type: 'SEND_MESSAGE', handler: this.sendMessageAction.bind(this), description: '發送消息' },
        { type: 'CLEAR_CONVERSATION', handler: this.clearConversationAction.bind(this), description: '清理對話歷史' },
        { type: 'GET_CONVERSATION_HISTORY', handler: this.getConversationHistoryAction.bind(this), description: '獲取對話歷史' },
        { type: 'ANALYZE_BEHAVIOR', handler: this.analyzeBehaviorAction.bind(this), description: '分析用戶行為並生成建議' },
        { type: 'START_BEHAVIOR_MONITORING', handler: this.startBehaviorMonitoringAction.bind(this), description: '開始行為監控' },
        { type: 'STOP_BEHAVIOR_MONITORING', handler: this.stopBehaviorMonitoringAction.bind(this), description: '停止行為監控' }
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
        this.stopBehaviorMonitoring()
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

            // 調用 AIAgentService 獲取真實 AI 回應
            let response: string
            try {
                if (AIAgentService.isConfigured()) {
                    response = await AIAgentService.sendMessage(messages)
                } else {
                    response = `模擬 AI 回應: ${payload.userMessage}`
                    this.log('AIAgentService not configured, using mock response')
                }
            } catch (error) {
                this.log('AIAgentService error, using fallback response', error)
                response = `AI 回應 (fallback): ${payload.userMessage}`
            }

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
     * 分析用戶行為並生成建議 Action
     */
    private async analyzeBehaviorAction(payload?: { customPrompt?: string }): Promise<void> {
        try {
            const behaviorData = useBehaviorStore.getState().getBehaviorData()
            
            if (behaviorData.recentEvents.length === 0) {
                this.emit('behaviorAnalysisEmpty', { message: '暫無行為數據可分析' })
                this.log('No behavior data available for analysis')
                return
            }

            // 構建行為分析提示
            const behaviorPrompt = this.createBehaviorAnalysisPrompt(behaviorData, payload?.customPrompt)
            
            let analysisResult: string
            if (AIAgentService.isConfigured()) {
                const messages = [
                    { role: 'system', content: behaviorPrompt },
                    { role: 'user', content: '請分析我的閱讀行為並提供建議' }
                ]
                analysisResult = await AIAgentService.sendMessage(messages, {
                    temperature: 0.3,
                    maxTokens: 800
                })
            } else {
                analysisResult = this.generateMockBehaviorAnalysis(behaviorData)
            }

            this.emit('behaviorAnalysisCompleted', {
                behaviorData,
                analysis: analysisResult,
                timestamp: Date.now()
            })
            
            this.log('Behavior analysis completed', { 
                eventCount: behaviorData.recentEvents.length,
                pattern: behaviorData.userPattern.type 
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to analyze behavior'
            this.emit('behaviorAnalysisError', { error: errorMessage })
            throw error
        }
    }

    /**
     * 開始行為監控 Action
     */
    private async startBehaviorMonitoringAction(payload?: { interval?: number }): Promise<void> {
        try {
            const interval = payload?.interval || 30000 // 預設 30 秒
            
            if (this.isMonitoringBehavior) {
                this.log('Behavior monitoring already active')
                return
            }

            this.isMonitoringBehavior = true
            this.behaviorMonitoringInterval = setInterval(() => {
                this.analyzeBehaviorAction().catch(error => {
                    this.log('Auto behavior analysis failed', error)
                })
            }, interval)

            this.emit('behaviorMonitoringStarted', { interval })
            this.log(`Behavior monitoring started with ${interval}ms interval`)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to start behavior monitoring'
            this.emit('behaviorMonitoringError', { error: errorMessage })
            throw error
        }
    }

    /**
     * 停止行為監控 Action
     */
    private async stopBehaviorMonitoringAction(): Promise<void> {
        try {
            this.stopBehaviorMonitoring()
            this.emit('behaviorMonitoringStopped')
            this.log('Behavior monitoring stopped')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to stop behavior monitoring'
            this.emit('behaviorMonitoringError', { error: errorMessage })
            throw error
        }
    }

    /**
     * 內部方法：停止行為監控
     */
    private stopBehaviorMonitoring(): void {
        if (this.behaviorMonitoringInterval) {
            clearInterval(this.behaviorMonitoringInterval)
            this.behaviorMonitoringInterval = null
        }
        this.isMonitoringBehavior = false
    }

    /**
     * 創建行為分析提示詞
     */
    private createBehaviorAnalysisPrompt(behaviorData: BehaviorData, customPrompt?: string): string {
        const basePrompt = `你是一個閱讀助手 AI，專門分析用戶的閱讀行為並提供智能建議。

當前用戶行為數據：
- 閱讀模式：${behaviorData.userPattern.type} (信心度: ${behaviorData.userPattern.confidence})
- 持續時間：${Math.round(behaviorData.userPattern.duration / 1000)} 秒
- 焦點區域：${behaviorData.userPattern.focus_areas.join(', ') || '無'}
- 事件數量：${behaviorData.sessionData.eventCount}
- 最近事件：${behaviorData.recentEvents.slice(-5).join('; ')}

請根據以上行為數據，分析用戶的閱讀狀態並提供相應的建議。建議應該：
1. 基於當前閱讀模式 (scanning/reading/studying) 提供合適的操作建議
2. 考慮用戶的專注區域和行為模式
3. 提供具體可執行的建議 (如：收藏、做筆記、搜尋相關內容等)
4. 保持建議簡潔且實用

請用繁體中文回應。`

        return customPrompt ? `${basePrompt}\n\n特殊要求：${customPrompt}` : basePrompt
    }

    /**
     * 模擬行為分析結果 (當 LLM 不可用時)
     */
    private generateMockBehaviorAnalysis(behaviorData: BehaviorData): string {
        const { userPattern } = behaviorData
        
        console.log('🤖 [AI Agent Mock] 開始模擬行為分析...')
        console.log('📊 [AI Agent Mock] 行為數據:', {
            模式: userPattern.type,
            信心度: userPattern.confidence,
            持續時間: Math.round(userPattern.duration / 1000) + '秒',
            事件數量: behaviorData.sessionData.eventCount,
            焦點區域: userPattern.focus_areas,
            最近事件: behaviorData.recentEvents.slice(-3)
        })
        
        let analysis: string
        let suggestions: string[] = []
        
        switch (userPattern.type) {
            case 'scanning':
                analysis = '🔍 分析結果：您正在快速瀏覽內容，屬於掃描模式。'
                suggestions = [
                    '📖 如果發現感興趣的文章，建議先加入書籤稍後深度閱讀',
                    '🔗 可以尋找相關主題的其他文章',
                    '⏱️ 建議放慢速度，給予內容更多關注'
                ]
                break
            case 'studying':
                analysis = '📚 分析結果：您正在深度閱讀，屬於學習模式。'
                suggestions = [
                    '📝 為重要段落做筆記，幫助記憶和理解',
                    '📋 建立文章摘要，整理核心觀點',
                    '🔍 深入研究相關主題和參考資料'
                ]
                break
            case 'reading':
                analysis = '👀 分析結果：您正在正常閱讀，節奏適中。'
                suggestions = [
                    '✨ 標記重要內容，建立個人知識庫',
                    '🔗 搜尋相關主題的其他優質文章',
                    '💭 思考內容與您現有知識的連結'
                ]
                break
            default:
                analysis = '⏳ 正在分析您的閱讀行為，需要更多數據來提供準確建議。'
                suggestions = [
                    '📖 繼續閱讀以獲得更精準的個人化建議',
                    '🔄 多嘗試不同的閱讀方式'
                ]
        }
        
        const fullAnalysis = `${analysis}\n\n💡 智能建議：\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n⭐ 基於您的閱讀模式，建議保持當前節奏並適時調整策略。`
        
        console.log('✨ [AI Agent Mock] 模擬分析完成!')
        console.log('💬 [AI Agent Mock] 生成建議:', fullAnalysis)
        
        // 模擬 AI 處理時間 (1-3秒)
        const processingTime = Math.random() * 2000 + 1000
        console.log(`⏱️ [AI Agent Mock] 模擬處理時間: ${Math.round(processingTime)}ms`)
        
        return fullAnalysis
    }

    /**
     * 獲取對話歷史 - 同步方法
     */
    getConversationHistory(): Array<{ role: string; content: string }> {
        return [...this.conversationHistory]
    }

    /**
     * 獲取行為監控狀態
     */
    getBehaviorMonitoringStatus(): { isMonitoring: boolean; interval: number | null } {
        return {
            isMonitoring: this.isMonitoringBehavior,
            interval: this.behaviorMonitoringInterval ? 30000 : null // TODO: 儲存實際 interval 值
        }
    }
} 