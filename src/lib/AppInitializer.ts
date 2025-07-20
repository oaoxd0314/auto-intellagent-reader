import { ControllerRegistry } from './ControllerRegistry'

/**
 * 應用程式統一初始化器
 * 負責初始化所有 Controller 和系統組件
 */
export class AppInitializer {
    private static initialized = false

    /**
     * 初始化整個應用程式
     * 應該在 App.tsx 中最早調用
     */
    static async initialize(): Promise<void> {
        if (AppInitializer.initialized) {
            console.warn('[AppInitializer] Already initialized')
            return
        }

        console.log('[AppInitializer] Starting application initialization...')

        try {
            // 1. 初始化 Controller Registry
            const registry = ControllerRegistry.getInstance()
            await registry.initialize()

            // 2. 可以在這裡添加其他系統初始化
            // await DatabaseInitializer.initialize()
            // await ConfigManager.initialize()
            // await AnalyticsManager.initialize()

            AppInitializer.initialized = true
            console.log('✅ [AppInitializer] Application initialized successfully')

            // 開發模式下輸出可用的 Actions
            if (process.env.NODE_ENV === 'development') {
                AppInitializer.logAvailableActions()
            }

        } catch (error) {
            console.error('❌ [AppInitializer] Initialization failed:', error)
            throw error
        }
    }

    /**
     * 獲取 Controller Registry 實例
     */
    static getControllerRegistry(): ControllerRegistry {
        if (!AppInitializer.initialized) {
            throw new Error('AppInitializer not initialized. Call AppInitializer.initialize() first.')
        }
        return ControllerRegistry.getInstance()
    }

    /**
     * 檢查初始化狀態
     */
    static isInitialized(): boolean {
        return AppInitializer.initialized
    }

    /**
     * 應用程式清理
     */
    static async cleanup(): Promise<void> {
        if (!AppInitializer.initialized) {
            return
        }

        console.log('[AppInitializer] Cleaning up application...')

        try {
            const registry = ControllerRegistry.getInstance()
            await registry.destroy()

            AppInitializer.initialized = false
            console.log('✅ [AppInitializer] Application cleanup completed')
        } catch (error) {
            console.error('❌ [AppInitializer] Cleanup failed:', error)
        }
    }

    /**
     * 開發工具：輸出所有可用的 Actions
     */
    private static logAvailableActions(): void {
        const registry = ControllerRegistry.getInstance()
        const discoveries = registry.discoverAllActions()

        console.log('\n🎯 === Available Actions for AI Agent ===')
        discoveries.forEach(discovery => {
            console.log(`\n🎮 ${discovery.controllerName}:`)
            discovery.actions.forEach(action => {
                console.log(`   • ${action}`)
            })
        })
        console.log('\n==========================================\n')
    }

    /**
     * 開發工具：獲取 Action 執行示例
     */
    static getActionExamples(): Record<string, string[]> {
        if (!AppInitializer.initialized) {
            return {}
        }

        const registry = ControllerRegistry.getInstance()
        const discoveries = registry.discoverAllActions()
        
        const examples: Record<string, string[]> = {}
        discoveries.forEach(discovery => {
            examples[discovery.controllerName] = discovery.actions.map(action => 
                `registry.executeAction('${discovery.controllerName}', '${action}', payload)`
            )
        })

        return examples
    }
}