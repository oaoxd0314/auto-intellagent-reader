import { AbstractController } from '../controllers/AbstractController'
import { PostController } from '../controllers/PostController'
import { InteractionController } from '../controllers/InteractionController'
import { AIAgentController } from '../controllers/AIAgentController'

/**
 * Controller 註冊項目
 */
interface ControllerRegistration {
    name: string
    instance: AbstractController
    description?: string
    category?: 'data' | 'interaction' | 'ai' | 'system'
}

/**
 * Action 發現結果
 */
interface ActionDiscovery {
    controllerName: string
    actions: string[]
    category?: string
}

/**
 * 統一的 Controller 註冊和管理中心
 * 為 SuperController 提供 Controller 發現和管理機制
 */
export class ControllerRegistry {
    private static instance: ControllerRegistry | null = null
    private controllers = new Map<string, ControllerRegistration>()
    private initialized = false

    private constructor() {}

    /**
     * 單例模式
     */
    static getInstance(): ControllerRegistry {
        if (!ControllerRegistry.instance) {
            ControllerRegistry.instance = new ControllerRegistry()
        }
        return ControllerRegistry.instance
    }

    /**
     * 初始化所有 Controller
     * 應該在應用啟動時調用一次
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            console.warn('[ControllerRegistry] Already initialized')
            return
        }

        console.log('[ControllerRegistry] Initializing controllers...')

        // 註冊所有 Controller
        this.registerController('PostController', PostController.getInstance(), {
            description: '文章數據管理和業務邏輯',
            category: 'data'
        })

        this.registerController('InteractionController', InteractionController.getInstance(), {
            description: '用戶互動管理（評論、標記、回覆）',
            category: 'interaction'
        })

        this.registerController('AIAgentController', AIAgentController.getInstance(), {
            description: 'AI Agent 對話管理',
            category: 'ai'
        })

        this.initialized = true
        
        // 輸出註冊摘要
        this.logRegistrationSummary()
    }

    /**
     * 註冊單個 Controller
     */
    private registerController(
        name: string, 
        controller: AbstractController, 
        options: { description?: string; category?: string } = {}
    ): void {
        const registration: ControllerRegistration = {
            name,
            instance: controller,
            description: options.description,
            category: options.category as any
        }

        this.controllers.set(name, registration)
        console.log(`[ControllerRegistry] Registered: ${name}`)
    }

    /**
     * 獲取已註冊的 Controller
     */
    getController<T extends AbstractController>(name: string): T | null {
        const registration = this.controllers.get(name)
        return registration ? (registration.instance as T) : null
    }

    /**
     * 獲取所有已註冊的 Controller 名稱
     */
    getControllerNames(): string[] {
        return Array.from(this.controllers.keys())
    }

    /**
     * 獲取所有已註冊的 Controller
     */
    getAllControllers(): ControllerRegistration[] {
        return Array.from(this.controllers.values())
    }

    /**
     * Action 發現 - 找出所有可用的 Actions
     * 為 SuperController 提供動態發現機制
     */
    discoverAllActions(): ActionDiscovery[] {
        const discoveries: ActionDiscovery[] = []

        this.controllers.forEach((registration) => {
            const actions = registration.instance.getSupportedActions()
            discoveries.push({
                controllerName: registration.name,
                actions,
                category: registration.category
            })
        })

        return discoveries
    }

    /**
     * 按類別獲取 Controller
     */
    getControllersByCategory(category: 'data' | 'interaction' | 'ai' | 'system'): ControllerRegistration[] {
        return Array.from(this.controllers.values()).filter(
            registration => registration.category === category
        )
    }

    /**
     * 執行跨 Controller 的 Action
     * 為 SuperController 提供統一執行介面
     */
    async executeAction(controllerName: string, actionType: string, payload?: any): Promise<void> {
        const controller = this.getController(controllerName)
        
        if (!controller) {
            throw new Error(`Controller not found: ${controllerName}`)
        }

        await controller.executeAction(actionType, payload)
    }

    /**
     * 檢查 Action 是否存在
     */
    hasAction(controllerName: string, actionType: string): boolean {
        const controller = this.getController(controllerName)
        
        if (!controller) {
            return false
        }

        return controller.getSupportedActions().includes(actionType)
    }

    /**
     * 廣播事件到所有 Controller
     * 注意：由於 emit 是 protected 方法，這裡僅作為示例
     */
    broadcastEvent(eventType: string, _data?: any): void {
        this.controllers.forEach((registration) => {
            // 由於 emit 是 protected，我們通過事件系統來廣播
            // registration.instance.emit(eventType, data) // 無法直接調用
            console.log(`[ControllerRegistry] Broadcasting ${eventType} to ${registration.name}`)
        })
    }

    /**
     * 銷毀所有 Controller
     */
    async destroy(): Promise<void> {
        console.log('[ControllerRegistry] Destroying all controllers...')
        
        this.controllers.forEach((registration) => {
            registration.instance.destroy()
        })
        
        this.controllers.clear()
        this.initialized = false
        
        console.log('[ControllerRegistry] All controllers destroyed')
    }

    /**
     * 獲取註冊狀態
     */
    getRegistrationStatus() {
        return {
            initialized: this.initialized,
            totalControllers: this.controllers.size,
            controllers: Array.from(this.controllers.entries()).map(([name, reg]) => ({
                name,
                category: reg.category,
                description: reg.description,
                actions: reg.instance.getSupportedActions()
            }))
        }
    }

    /**
     * 輸出註冊摘要
     */
    private logRegistrationSummary(): void {
        console.log('\n=== Controller Registry Summary ===')
        console.log(`Total Controllers: ${this.controllers.size}`)
        
        const discoveries = this.discoverAllActions()
        discoveries.forEach(discovery => {
            console.log(`\n📋 ${discovery.controllerName} (${discovery.category || 'unknown'})`)
            console.log(`   Actions: ${discovery.actions.join(', ')}`)
        })
        
        const totalActions = discoveries.reduce((sum, d) => sum + d.actions.length, 0)
        console.log(`\n🎯 Total Available Actions: ${totalActions}`)
        console.log('===================================\n')
    }

    /**
     * 開發工具：重新載入 Controller
     */
    async reloadController(name: string): Promise<void> {
        if (process.env.NODE_ENV !== 'development') {
            console.warn('reloadController only available in development mode')
            return
        }

        const registration = this.controllers.get(name)
        if (registration) {
            registration.instance.destroy()
            // 這裡可以重新實例化 Controller
            console.log(`[ControllerRegistry] Reloaded: ${name}`)
        }
    }
}