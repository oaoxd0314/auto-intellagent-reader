import type {
    IController,
    ControllerEventListener,
    ControllerEventMap,
    ControllerState,
    ControllerConfig
} from '../types/controller'
import { ControllerError } from '../types/controller'

/**
 * 抽象控制器基類
 * 提供統一的事件系統、狀態管理和生命週期管理
 */
export abstract class AbstractController<T = any> implements IController<T> {
    protected state: T & ControllerState
    protected listeners: ControllerEventMap = {}
    protected config: ControllerConfig = {
        autoStart: true,
        enableLogging: false,
        debugMode: false
    }

    // 銷毀標記，用於控制 setState 行為
    private _isDestroying = false

    constructor(
        protected readonly name: string,
        initialState: T,
        config?: Partial<ControllerConfig>
    ) {
        this.state = {
            ...initialState,
            isInitialized: false,
            isDestroyed: false,
            lastUpdated: Date.now()
        } as T & ControllerState

        if (config) {
            this.configure(config)
        }

        if (this.config.autoStart) {
            this.initialize()
        }
    }

    // 狀態管理
    getState(): T & ControllerState {
        return { ...this.state }
    }

    setState(newState: Partial<T>): void {
        // 檢查是否正在銷毀或已銷毀
        if (this._isDestroying || this.state.isDestroyed) {
            throw new ControllerError(
                'Cannot set state on destroyed controller',
                this.name,
                'CONTROLLER_DESTROYED'
            )
        }

        this.updateState(newState as Partial<T & ControllerState>)
        this.emit('stateChange', this.state)
        this.log('State updated:', newState)
    }

    // 內部狀態更新方法，統一狀態更新邏輯
    private updateState(newState: Partial<T & ControllerState>): void {
        this.state = {
            ...this.state,
            ...newState,
            lastUpdated: Date.now()
        }
    }

    // 生命週期管理
    initialize(): void {
        if (this.state.isInitialized) {
            this.log('Controller already initialized')
            return
        }

        try {
            this.onInitialize()
            this.setState({ isInitialized: true } as unknown as Partial<T>)
            this.emit('initialized')
            this.log('Controller initialized')
        } catch (error) {
            const controllerError = error instanceof Error
                ? new ControllerError(error.message, this.name, 'INIT_FAILED')
                : new ControllerError('Unknown initialization error', this.name, 'INIT_FAILED')

            this.emit('error', controllerError)
            throw controllerError
        }
    }

    destroy(): void {
        if (this.state.isDestroyed) {
            this.log('Controller already destroyed')
            return
        }

        try {
            // 🎯 關鍵修復：先設置銷毀標記，阻止後續的 setState 調用
            this._isDestroying = true

            // 現在安全地調用 onDestroy，任何 setState 都會被阻止
            this.onDestroy()

            // 最後更新狀態為已銷毀 - 使用內部更新方法
            this.updateState({ isDestroyed: true } as Partial<T & ControllerState>)

            this.emit('destroyed')
            this.log('Controller destroyed')

            // 清理所有事件監聽器
            this.listeners = {}
        } catch (error) {
            const controllerError = error instanceof Error
                ? new ControllerError(error.message, this.name, 'DESTROY_FAILED')
                : new ControllerError('Unknown destruction error', this.name, 'DESTROY_FAILED')

            this.emit('error', controllerError)
        }
    }

    // 事件系統
    on(event: string, callback: ControllerEventListener): void {
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        this.listeners[event].push(callback)
        this.log(`Event listener added for: ${event}`)
    }

    off(event: string, callback: ControllerEventListener): void {
        if (!this.listeners[event]) return

        const index = this.listeners[event].indexOf(callback)
        if (index > -1) {
            this.listeners[event].splice(index, 1)
            this.log(`Event listener removed for: ${event}`)
        }
    }

    emit(event: string, ...args: any[]): void {
        if (!this.listeners[event]) return

        this.listeners[event].forEach(callback => {
            try {
                callback(...args)
            } catch (error) {
                const controllerError = error instanceof Error
                    ? new ControllerError(`Event handler error: ${error.message}`, this.name, 'EVENT_HANDLER_ERROR')
                    : new ControllerError('Unknown event handler error', this.name, 'EVENT_HANDLER_ERROR')

                this.emit('error', controllerError)
            }
        })

        this.log(`Event emitted: ${event}`, args)
    }

    // 配置管理
    configure(config: Partial<ControllerConfig>): void {
        this.config = { ...this.config, ...config }
        this.log('Configuration updated:', config)
    }

    // 抽象方法 - 子類必須實現
    protected abstract onInitialize(): void
    protected abstract onDestroy(): void

    // 工具方法
    protected log(message: string, data?: any): void {
        if (!this.config.enableLogging && !this.config.debugMode) return

        const prefix = `[${this.name}]`
        if (data !== undefined) {
            console.log(prefix, message, data)
        } else {
            console.log(prefix, message)
        }
    }

    protected createError(message: string, code?: string): ControllerError {
        return new ControllerError(message, this.name, code)
    }
} 