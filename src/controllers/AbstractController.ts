import { behaviorEventCollector } from '../lib/BehaviorEventCollector'

/**
 * Action Handler 類型定義
 */
type ActionHandler = (payload?: any) => Promise<void> | void

/**
 * Action Map 類型定義
 */
interface ActionMap {
    [actionType: string]: ActionHandler
}

/**
 * Event Listener 類型定義
 */
type EventListener = (...args: any[]) => void

/**
 * 新版抽象控制器基類
 * 專注於 Event-Driven Action Handler 模式
 * 為 AI Agent SuperController 架構準備
 */
export abstract class AbstractController {
    protected listeners: Record<string, EventListener[]> = {}
    private isDestroyed = false

    constructor(protected readonly name: string) {
        // 簡化構造函數，移除自動初始化
        this.initialize()
    }

    // ===== 核心 Action Handler 系統 =====

    /**
     * 統一 Action 處理入口 - SuperController 調用點
     * 子類必須實現這個方法
     */
    abstract executeAction(actionType: string, payload?: any): Promise<void>

    /**
     * 獲取支援的 Action 列表 - SuperController 發現機制
     * 子類必須實現這個方法
     */
    abstract getSupportedActions(): string[]

    // ===== 事件系統 (保留核心功能) =====

    /**
     * 監聽事件
     */
    on(eventType: string, listener: EventListener): void {
        if (this.isDestroyed) {
            console.warn(`[${this.name}] Cannot add listener to destroyed controller`)
            return
        }

        if (!this.listeners[eventType]) {
            this.listeners[eventType] = []
        }
        this.listeners[eventType].push(listener)
    }

    /**
     * 移除事件監聽
     */
    off(eventType: string, listener: EventListener): void {
        if (!this.listeners[eventType]) return
        
        const index = this.listeners[eventType].indexOf(listener)
        if (index > -1) {
            this.listeners[eventType].splice(index, 1)
        }
    }

    /**
     * 發送事件 - 通知狀態變更
     */
    protected emit(eventType: string, data?: any): void {
        if (this.isDestroyed) return

        const eventListeners = this.listeners[eventType] || []
        
        eventListeners.forEach(listener => {
            try {
                listener(data)
            } catch (error) {
                console.error(`[${this.name}] Event listener error:`, error)
            }
        })
    }

    // ===== 簡單生命週期 =====

    /**
     * 初始化 - 子類可選實現
     */
    protected initialize(): void {
        this.onInitialize()
        this.emit('initialized')
    }

    /**
     * 銷毀 - 清理事件監聽器
     */
    destroy(): void {
        if (this.isDestroyed) return

        this.isDestroyed = true
        this.onDestroy()
        this.listeners = {}
        this.emit('destroyed')
    }

    /**
     * 檢查是否已銷毀
     */
    getIsDestroyed(): boolean {
        return this.isDestroyed
    }

    // ===== 子類可選實現的生命週期 hooks =====

    /**
     * 初始化 hook - 子類可選實現
     */
    protected onInitialize(): void {}

    /**
     * 銷毀 hook - 子類可選實現
     */
    protected onDestroy(): void {}

    // ===== 工具方法 =====

    /**
     * 獲取 Controller 名稱
     */
    getName(): string {
        return this.name
    }

    /**
     * 日誌輔助方法 - 整合行為事件收集
     */
    protected log(message: string, data?: any): void {
        if (process.env.NODE_ENV === 'development') {
            const prefix = `[${this.name}]`
            if (data !== undefined) {
                console.log(prefix, message, data)
            } else {
                console.log(prefix, message)
            }

            // 通過抽象層收集事件 - 完全不知道底層 store 實現
            behaviorEventCollector.collectControllerEvent(this.name, message, data)
        }
    }
}

/**
 * Action Map 建構輔助函數
 * 用於子類定義 Action 映射表
 */
export function createActionMap(actions: Array<{
    type: string
    handler: ActionHandler
    description?: string
}>): ActionMap {
    return actions.reduce((map, action) => {
        map[action.type] = action.handler
        return map
    }, {} as ActionMap)
} 