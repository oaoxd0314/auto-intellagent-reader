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
 * 跨 Controller 事件訂閱記錄
 */
interface CrossControllerSubscription {
    controllerName: string
    eventType: string
    listener: EventListener
}

/**
 * 新版抽象控制器基類
 * 專注於 Event-Driven Action Handler 模式
 * 為 AI Agent SuperController 架構準備
 * 
 * TODO: FIXME: 移除子類的 getInstance 單例模式
 * - Controller 不應該負責實例管理
 * - 應該由 ControllerRegistry 或 DI 容器統一管理
 * - 目前各個 Controller 子類都有 getInstance 方法是技術債
 */
export abstract class AbstractController {
    protected listeners: Record<string, EventListener[]> = {}
    private isDestroyed = false

    /**
     * 跨 Controller 事件訂閱管理
     * 記錄此 Controller 訂閱的其他 Controller 事件，用於自動清理
     */
    private crossControllerSubscriptions: CrossControllerSubscription[] = []

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
     * 銷毀 - 清理事件監聽器和跨 Controller 訂閱
     */
    destroy(): void {
        if (this.isDestroyed) return

        this.isDestroyed = true

        // 先調用子類的清理邏輯
        this.onDestroy()

        // 清理跨 Controller 事件訂閱
        this.cleanupCrossControllerSubscriptions()

        // 清理本地事件監聽器
        this.listeners = {}

        // 發送銷毀事件（這應該是最後一個事件）
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
    protected onInitialize(): void { }

    /**
     * 銷毀 hook - 子類可選實現
     */
    protected onDestroy(): void { }

    // ===== Controller 間通訊支援 =====

    /**
     * 獲取 ControllerRegistry 實例
     * 使用延遲載入避免循環依賴
     */
    protected getRegistry(): any {
        // 延遲導入 ControllerRegistry 避免循環依賴
        const { ControllerRegistry } = require('../lib/ControllerRegistry')
        return ControllerRegistry.getInstance()
    }

    /**
     * 標準化的跨 Controller 事件訂閱
     * 
     * @param controllerName 目標 Controller 名稱
     * @param eventType 要監聽的事件類型
     * @param listener 事件監聽器
     * @returns 訂閱是否成功
     */
    protected subscribeToController(
        controllerName: string,
        eventType: string,
        listener: EventListener
    ): boolean {
        if (this.isDestroyed) {
            this.log(`Cannot subscribe to events, controller is destroyed`)
            return false
        }

        try {
            const registry = this.getRegistry()
            const targetController = registry.getController(controllerName)

            if (!targetController) {
                this.log(`Target controller '${controllerName}' not found in registry`)
                return false
            }

            if (targetController.getIsDestroyed && targetController.getIsDestroyed()) {
                this.log(`Target controller '${controllerName}' is destroyed`)
                return false
            }

            // 訂閱事件
            targetController.on(eventType, listener)

            // 記錄訂閱以便後續清理
            this.crossControllerSubscriptions.push({
                controllerName,
                eventType,
                listener
            })

            this.log(`Successfully subscribed to ${controllerName}.${eventType}`)
            return true

        } catch (error) {
            this.log(`Failed to subscribe to ${controllerName}.${eventType}`, error)
            return false
        }
    }

    /**
     * 取消訂閱特定的跨 Controller 事件
     * 
     * @param controllerName 目標 Controller 名稱
     * @param eventType 事件類型
     * @param listener 事件監聽器（可選，不提供則取消該事件的所有監聽器）
     */
    protected unsubscribeFromController(
        controllerName: string,
        eventType: string,
        listener?: EventListener
    ): void {
        try {
            const registry = this.getRegistry()
            const targetController = registry.getController(controllerName)

            if (targetController && !targetController.getIsDestroyed()) {
                if (listener) {
                    targetController.off(eventType, listener)
                } else {
                    // 如果沒有指定 listener，取消所有此 Controller 對該事件的訂閱
                    const subscriptionsToRemove = this.crossControllerSubscriptions.filter(
                        sub => sub.controllerName === controllerName && sub.eventType === eventType
                    )
                    subscriptionsToRemove.forEach(sub => {
                        targetController.off(eventType, sub.listener)
                    })
                }
            }

            // 從記錄中移除
            this.crossControllerSubscriptions = this.crossControllerSubscriptions.filter(sub => {
                const shouldRemove = sub.controllerName === controllerName &&
                    sub.eventType === eventType &&
                    (!listener || sub.listener === listener)
                return !shouldRemove
            })

            this.log(`Unsubscribed from ${controllerName}.${eventType}`)

        } catch (error) {
            this.log(`Failed to unsubscribe from ${controllerName}.${eventType}`, error)
        }
    }

    /**
     * 清理所有跨 Controller 事件訂閱
     * 在 Controller 銷毀時自動調用
     */
    private cleanupCrossControllerSubscriptions(): void {
        if (this.crossControllerSubscriptions.length === 0) return

        this.log(`Cleaning up ${this.crossControllerSubscriptions.length} cross-controller subscriptions`)

        try {
            const registry = this.getRegistry()

            this.crossControllerSubscriptions.forEach(({ controllerName, eventType, listener }) => {
                try {
                    const targetController = registry.getController(controllerName)
                    if (targetController && !targetController.getIsDestroyed()) {
                        targetController.off(eventType, listener)
                    }
                } catch (error) {
                    // 忽略個別清理錯誤，繼續清理其他訂閱
                    console.warn(`[${this.name}] Failed to cleanup subscription to ${controllerName}.${eventType}:`, error)
                }
            })

        } catch (error) {
            console.warn(`[${this.name}] Failed to access registry during cleanup:`, error)
        } finally {
            // 無論如何都清空記錄
            this.crossControllerSubscriptions = []
            this.log('Cross-controller subscriptions cleanup completed')
        }
    }

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
            behaviorEventCollector.collectControllerEvent(this.name, message, data, {
                level: 'info',
                category: 'system-action'
            })
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