import { AbstractController } from './AbstractController'
import type { UserEvent, BehaviorSummary } from '../types/behavior'
import type { Suggestion } from '../types/suggestion'
import { BehaviorService } from '../services/BehaviorService'

/**
 * 建議策略介面
 */
export interface SuggestionStrategy {
    name: string
    analyze(events: UserEvent[], summary: BehaviorSummary): Suggestion | null
}

/**
 * 行為控制器狀態
 */
interface BehaviorControllerState {
    currentPostId: string | null
    events: UserEvent[]
    summary: BehaviorSummary
    strategies: SuggestionStrategy[]
    lastSuggestionTime: number
}

/**
 * 行為控制器 - 使用策略模式
 * 負責收集用戶行為並基於策略生成建議
 */
export class BehaviorController extends AbstractController<BehaviorControllerState> {
    private readonly ANALYSIS_INTERVAL = 5000 // 5秒分析一次
    private analysisTimer?: NodeJS.Timeout

    constructor() {
        super('BehaviorController', {
            currentPostId: null,
            events: [],
            summary: {
                totalTime: 0,
                scrollDepth: 0,
                pauseCount: 0,
                selectionCount: 0,
                engagementScore: 0
            },
            strategies: [],
            lastSuggestionTime: 0
        }, {
            enableLogging: true,
            debugMode: true
        })
    }

    protected onInitialize(): void {
        this.loadDefaultStrategies()
        this.startPeriodicAnalysis()
        this.log('BehaviorController initialized with strategies:', this.state.strategies.length)
    }

    protected onDestroy(): void {
        this.stopPeriodicAnalysis()
        this.saveCurrentData()
        this.log('BehaviorController destroyed')
    }

    /**
     * 開始追蹤指定文章
     */
    async startTracking(postId: string): Promise<void> {
        if (this.state.currentPostId === postId) {
            this.log('Already tracking this post')
            return
        }

        // 保存之前的數據
        if (this.state.currentPostId) {
            await this.saveCurrentData()
        }

        // 載入新文章的數據
        const existingData = await BehaviorService.loadBehavior(postId)

        this.setState({
            currentPostId: postId,
            events: existingData?.events || [],
            summary: existingData?.summary || {
                totalTime: 0,
                scrollDepth: 0,
                pauseCount: 0,
                selectionCount: 0,
                engagementScore: 0
            }
        })

        this.emit('trackingStarted', postId)
        this.log('Started tracking post:', postId)
    }

    /**
     * 停止追蹤
     */
    async stopTracking(): Promise<void> {
        if (!this.state.currentPostId) return

        await this.saveCurrentData()

        this.setState({
            currentPostId: null,
            events: [],
            summary: {
                totalTime: 0,
                scrollDepth: 0,
                pauseCount: 0,
                selectionCount: 0,
                engagementScore: 0
            }
        })

        this.emit('trackingStopped')
        this.log('Stopped tracking')
    }

    /**
     * 添加用戶事件
     */
    async addEvent(event: Omit<UserEvent, 'timestamp'>): Promise<void> {
        if (!this.state.currentPostId) {
            this.log('No active tracking, event ignored')
            return
        }

        const fullEvent: UserEvent = {
            ...event,
            timestamp: Date.now(),
            context: {
                ...event.context,
                postId: this.state.currentPostId
            }
        }

        try {
            // 委託給 Service 處理數據持久化
            await BehaviorService.addEvent(this.state.currentPostId, fullEvent)

            // Controller 只管理內存狀態和事件分發
            const newEvents = [...this.state.events, fullEvent]
            const newSummary = BehaviorService.calculateSummary(newEvents)

            this.setState({
                events: newEvents,
                summary: newSummary
            })

            this.emit('eventAdded', fullEvent)
            this.log('Event added:', fullEvent.type)
        } catch (error) {
            const controllerError = this.createError(
                `Failed to add event: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            this.emit('error', controllerError)
            throw controllerError
        }
    }

    /**
     * 手動觸發分析
     */
    async analyze(): Promise<Suggestion[]> {
        if (!this.state.currentPostId || this.state.events.length === 0) {
            return []
        }

        const suggestions: Suggestion[] = []

        for (const strategy of this.state.strategies) {
            try {
                const suggestion = strategy.analyze(this.state.events, this.state.summary)
                if (suggestion) {
                    suggestions.push(suggestion)
                }
            } catch (error) {
                this.log(`Strategy ${strategy.name} failed:`, error)
            }
        }

        if (suggestions.length > 0) {
            this.setState({ lastSuggestionTime: Date.now() })
            this.emit('suggestionsGenerated', suggestions)
            this.log('Generated suggestions:', suggestions.length)
        }

        return suggestions
    }

    /**
     * 添加策略
     */
    addStrategy(strategy: SuggestionStrategy): void {
        const strategies = [...this.state.strategies, strategy]
        this.setState({ strategies })
        this.log('Strategy added:', strategy.name)
    }

    /**
     * 移除策略
     */
    removeStrategy(name: string): void {
        const strategies = this.state.strategies.filter(s => s.name !== name)
        this.setState({ strategies })
        this.log('Strategy removed:', name)
    }

    /**
     * 獲取當前狀態
     */
    getCurrentData() {
        return {
            postId: this.state.currentPostId,
            events: [...this.state.events],
            summary: { ...this.state.summary },
            strategiesCount: this.state.strategies.length
        }
    }

    /**
     * 載入預設策略
     */
    private loadDefaultStrategies(): void {
        // 簡單的收藏建議策略
        const bookmarkStrategy: SuggestionStrategy = {
            name: 'bookmark',
            analyze: (_events, summary) => {
                // 簡單條件：閱讀時間超過 3 分鐘
                if (summary.totalTime > 180000) {
                    return {
                        id: `bookmark-${Date.now()}`,
                        type: 'bookmark',
                        title: '收藏這篇文章',
                        description: '你已經閱讀了一段時間，要收藏這篇文章嗎？',
                        confidence: 0.8,
                        priority: 3,
                        action: async () => {
                            console.log('執行收藏動作')
                            // TODO: 實際的收藏邏輯
                        }
                    }
                }
                return null
            }
        }

        // 簡單的筆記建議策略
        const noteStrategy: SuggestionStrategy = {
            name: 'note',
            analyze: (_events, summary) => {
                // 簡單條件：有文本選擇行為
                if (summary.selectionCount > 0) {
                    return {
                        id: `note-${Date.now()}`,
                        type: 'note',
                        title: '做筆記',
                        description: '你選擇了一些文本，要做筆記嗎？',
                        confidence: 0.9,
                        priority: 4,
                        action: async () => {
                            console.log('執行筆記動作')
                            // TODO: 實際的筆記邏輯
                        }
                    }
                }
                return null
            }
        }

        this.setState({
            strategies: [bookmarkStrategy, noteStrategy]
        })
    }

    /**
     * 開始定期分析
     */
    private startPeriodicAnalysis(): void {
        this.analysisTimer = setInterval(() => {
            this.analyze()
        }, this.ANALYSIS_INTERVAL)
    }

    /**
     * 停止定期分析
     */
    private stopPeriodicAnalysis(): void {
        if (this.analysisTimer) {
            clearInterval(this.analysisTimer)
            this.analysisTimer = undefined
        }
    }

    /**
     * 保存當前數據
     */
    private async saveCurrentData(): Promise<void> {
        if (!this.state.currentPostId) return

        try {
            const behaviorData = {
                postId: this.state.currentPostId,
                events: this.state.events,
                summary: this.state.summary,
                suggestions: [], // 建議歷史由其他地方管理
                preferences: {},
                lastUpdated: Date.now()
            }

            await BehaviorService.saveBehavior(behaviorData)
            this.log('Data saved for post:', this.state.currentPostId)
        } catch (error) {
            this.log('Failed to save data:', error)
        }
    }


} 