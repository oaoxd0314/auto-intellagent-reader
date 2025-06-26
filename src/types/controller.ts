// 控制器事件監聽器
export type ControllerEventListener = (...args: any[]) => void

// 控制器事件映射
export interface ControllerEventMap {
    [eventName: string]: ControllerEventListener[]
}

// 控制器基礎狀態
export interface ControllerState {
    isInitialized: boolean
    isDestroyed: boolean
    lastUpdated: number
}

// 控制器配置
export interface ControllerConfig {
    autoStart?: boolean
    enableLogging?: boolean
    debugMode?: boolean
}

// 控制器介面
export interface IController<T = any> {
    // 狀態管理
    getState(): T
    setState(newState: Partial<T>): void

    // 生命週期
    initialize(): void
    destroy(): void

    // 事件系統
    on(event: string, callback: ControllerEventListener): void
    off(event: string, callback: ControllerEventListener): void
    emit(event: string, ...args: any[]): void

    // 配置
    configure(config: Partial<ControllerConfig>): void
}

// 控制器錯誤類型
export class ControllerError extends Error {
    constructor(
        message: string,
        public readonly controllerName: string,
        public readonly code?: string
    ) {
        super(message)
        this.name = 'ControllerError'
    }
} 