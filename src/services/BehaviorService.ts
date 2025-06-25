import type { BehaviorData, UserEvent, BehaviorSummary } from '../types/behavior'
import type { SuggestionHistory } from '../types/suggestion'

/**
 * 行為數據存儲服務
 * 負責用戶行為數據的持久化和管理
 */
export class BehaviorService {
    private static readonly STORAGE_PREFIX = 'behavior:'
    private static readonly PREFERENCES_KEY = 'preferences:global'

    /**
     * 保存行為數據
     */
    static async saveBehavior(data: BehaviorData): Promise<void> {
        try {
            const key = `${this.STORAGE_PREFIX}${data.postId}`
            const serializedData = JSON.stringify({
                ...data,
                lastUpdated: Date.now()
            })

            localStorage.setItem(key, serializedData)
        } catch (error) {
            console.error('Failed to save behavior data:', error)
            throw new Error('Failed to save behavior data')
        }
    }

    /**
     * 載入行為數據
     */
    static async loadBehavior(postId: string): Promise<BehaviorData | null> {
        try {
            const key = `${this.STORAGE_PREFIX}${postId}`
            const data = localStorage.getItem(key)

            if (!data) return null

            return JSON.parse(data) as BehaviorData
        } catch (error) {
            console.error('Failed to load behavior data:', error)
            return null
        }
    }

    /**
     * 更新用戶偏好
     */
    static async updatePreferences(preferences: Record<string, number>): Promise<void> {
        try {
            const current = await this.getGlobalPreferences()
            const updated = { ...current, ...preferences }

            localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updated))
        } catch (error) {
            console.error('Failed to update preferences:', error)
            throw new Error('Failed to update preferences')
        }
    }

    /**
     * 獲取全局偏好設置
     */
    static async getGlobalPreferences(): Promise<Record<string, number>> {
        try {
            const data = localStorage.getItem(this.PREFERENCES_KEY)
            return data ? JSON.parse(data) : {}
        } catch (error) {
            console.error('Failed to load preferences:', error)
            return {}
        }
    }

    /**
     * 添加用戶事件
     */
    static async addEvent(postId: string, event: UserEvent): Promise<void> {
        try {
            const data = await this.loadBehavior(postId) || this.createEmptyBehaviorData(postId)

            data.events.push(event)
            data.summary = this.calculateSummary(data.events)

            await this.saveBehavior(data)
        } catch (error) {
            console.error('Failed to add event:', error)
            throw new Error('Failed to add event')
        }
    }

    /**
     * 添加建議歷史
     */
    static async addSuggestionHistory(postId: string, history: SuggestionHistory): Promise<void> {
        try {
            const data = await this.loadBehavior(postId) || this.createEmptyBehaviorData(postId)

            data.suggestions.push(history)

            await this.saveBehavior(data)
        } catch (error) {
            console.error('Failed to add suggestion history:', error)
            throw new Error('Failed to add suggestion history')
        }
    }

    /**
     * 清理過期數據
     */
    static async cleanupExpiredData(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
        try {
            const now = Date.now()
            const keys = Object.keys(localStorage).filter(key => key.startsWith(this.STORAGE_PREFIX))

            for (const key of keys) {
                const data = localStorage.getItem(key)
                if (data) {
                    const parsed = JSON.parse(data) as BehaviorData
                    if (now - parsed.lastUpdated > maxAge) {
                        localStorage.removeItem(key)
                    }
                }
            }
        } catch (error) {
            console.error('Failed to cleanup expired data:', error)
        }
    }

    /**
     * 創建空的行為數據
     */
    private static createEmptyBehaviorData(postId: string): BehaviorData {
        return {
            postId,
            events: [],
            summary: {
                totalTime: 0,
                scrollDepth: 0,
                pauseCount: 0,
                selectionCount: 0,
                engagementScore: 0
            },
            suggestions: [],
            preferences: {},
            lastUpdated: Date.now()
        }
    }

    /**
     * 計算行為統計摘要
     */
    static calculateSummary(events: UserEvent[]): BehaviorSummary {
        const totalTime = events
            .filter(e => e.context.duration)
            .reduce((sum, e) => sum + (e.context.duration || 0), 0)

        const scrollEvents = events.filter(e => e.type === 'scroll')
        const maxScrollPosition = Math.max(...scrollEvents.map(e => e.context.position), 0)
        const scrollDepth = maxScrollPosition > 0 ? Math.min(maxScrollPosition / 100, 1) : 0

        const pauseCount = events.filter(e => e.type === 'pause').length
        const selectionCount = events.filter(e => e.type === 'select').length

        // 簡單的參與度計算
        const engagementScore = Math.min(
            (totalTime / 300000) * 0.4 + // 時間權重 40%
            scrollDepth * 0.3 + // 滾動深度權重 30%
            (selectionCount / 5) * 0.3, // 選擇次數權重 30%
            1
        )

        return {
            totalTime,
            scrollDepth,
            pauseCount,
            selectionCount,
            engagementScore
        }
    }
} 