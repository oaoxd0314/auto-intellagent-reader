import { AbstractController, createActionMap } from './AbstractController'
import { useBehaviorStore, type BehaviorData } from '../stores/behaviorStore'
import { AIAgentService } from '../services/AIAgentService'
import { ControllerRegistry } from '../lib/ControllerRegistry'

/**
 * AIAgentController - 負責行為分析和 AI 對話
 * 
 * 職責：
 * - 分析用戶行為數據
 * - 調用 AISuggestionController 生成建議
 * - 通過 ControllerRegistry 與其他 Controller 通訊
 */
export class AIAgentController extends AbstractController {
    private static instance: AIAgentController | null = null
    private behaviorMonitoringInterval: NodeJS.Timeout | null = null
    private isMonitoringBehavior = false

    // Action 映射表
    private actionMap = createActionMap([
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
            let aiInsights: any = null

            // 第一步：AI 分析（如果配置了 API）
            if (AIAgentService.isConfigured()) {
                try {
                    this.log('Using AI service for behavior analysis')
                    const messages = [
                        { role: 'system', content: behaviorPrompt },
                        { role: 'user', content: '請分析我的閱讀行為並提供洞察' }
                    ]
                    analysisResult = await AIAgentService.sendMessage(messages, {
                        temperature: 0.3,
                        maxTokens: 800
                    })

                    console.log('🤖 [AI Agent] 行為分析結果:', analysisResult)

                    // 嘗試解析 AI 回應中的結構化信息
                    aiInsights = this.parseAIInsights(analysisResult)
                    this.log('AI analysis completed with insights', aiInsights)
                } catch (error) {
                    this.log('AI service failed, falling back to mock analysis', error)
                    analysisResult = this.generateMockBehaviorAnalysis(behaviorData)
                }
            } else {
                this.log('AI service not configured, using mock analysis')
                analysisResult = this.generateMockBehaviorAnalysis(behaviorData)
            }

            // 第二步：基於 AI 分析結果，通過規則引擎生成具體建議
            const registry = ControllerRegistry.getInstance()
            await registry.executeAction('AISuggestionController', 'GENERATE_SUGGESTIONS', {
                behaviorData,
                context: {
                    userBehavior: {
                        pattern: behaviorData.userPattern.type,
                        confidence: behaviorData.userPattern.confidence,
                        eventCount: behaviorData.sessionData.eventCount,
                        focusAreas: behaviorData.userPattern.focus_areas
                    },
                    aiAnalysis: {
                        summary: analysisResult,
                        insights: aiInsights,
                        confidence: AIAgentService.isConfigured() ? 'high' : 'medium',
                        source: AIAgentService.isConfigured() ? 'llm' : 'rule_based'
                    }
                }
            })

            this.emit('behaviorAnalysisCompleted', {
                behaviorData,
                analysis: analysisResult,
                aiInsights,
                timestamp: Date.now(),
                hasAIInsights: !!aiInsights
            })

            this.log('Behavior analysis completed and suggestions generated', {
                eventCount: behaviorData.recentEvents.length,
                pattern: behaviorData.userPattern.type,
                hasAIInsights: !!aiInsights,
                source: AIAgentService.isConfigured() ? 'llm' : 'rule_based'
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
     * 解析 AI 回應中的結構化洞察
     */
    private parseAIInsights(aiResponse: string): any {
        try {
            // 嘗試從 AI 回應中提取結構化信息
            // 這裡可以實現更複雜的 NLP 解析邏輯

            const insights = {
                suggestedActions: [] as string[],
                userMood: 'neutral',
                confidenceLevel: 0.7,
                recommendations: [] as string[]
            }

            // 簡單的關鍵詞解析邏輯
            if (aiResponse.includes('收藏') || aiResponse.includes('書籤')) {
                insights.suggestedActions.push('bookmark')
            }
            if (aiResponse.includes('筆記') || aiResponse.includes('記錄')) {
                insights.suggestedActions.push('note')
            }
            if (aiResponse.includes('標記') || aiResponse.includes('重點')) {
                insights.suggestedActions.push('highlight')
            }
            if (aiResponse.includes('摘要') || aiResponse.includes('總結')) {
                insights.suggestedActions.push('summary')
            }

            // 情緒分析
            if (aiResponse.includes('專注') || aiResponse.includes('深度')) {
                insights.userMood = 'focused'
                insights.confidenceLevel = 0.8
            } else if (aiResponse.includes('快速') || aiResponse.includes('瀏覽')) {
                insights.userMood = 'scanning'
                insights.confidenceLevel = 0.6
            }

            return insights
        } catch (error) {
            this.log('Failed to parse AI insights', error)
            return null
        }
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