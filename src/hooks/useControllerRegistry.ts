import { useCallback, useEffect, useState } from 'react'
import { AppInitializer } from '../lib/AppInitializer'
import { ControllerRegistry } from '../lib/ControllerRegistry'
import type { AbstractController } from '../controllers/AbstractController'

/**
 * Controller Registry 存取 Hook
 * 提供統一的 Controller 和 Action 存取介面
 */
export function useControllerRegistry() {
    const [isReady, setIsReady] = useState(false)
    const [registry, setRegistry] = useState<ControllerRegistry | null>(null)

    useEffect(() => {
        // 直接檢查是否已初始化
        if (AppInitializer.isInitialized()) {
            const registryInstance = AppInitializer.getControllerRegistry()
            setRegistry(registryInstance)
            setIsReady(true)
            return
        }

        // 如果還沒初始化，設定一個輪詢機制
        // TODO: 這是一個 workaround，理想情況是 App.tsx 中的初始化應該在所有 Context 之前完成
        const checkInitialization = () => {
            if (AppInitializer.isInitialized()) {
                const registryInstance = AppInitializer.getControllerRegistry()
                setRegistry(registryInstance)
                setIsReady(true)
                return true
            }
            return false
        }

        // 立即檢查一次
        if (checkInitialization()) {
            return
        }

        // 如果還沒初始化，用 polling 等待初始化完成
        const pollInterval = setInterval(() => {
            if (checkInitialization()) {
                clearInterval(pollInterval)
            }
        }, 50) // 50ms 輪詢一次

        // 清理函數
        return () => {
            clearInterval(pollInterval)
        }
    }, [])

    /**
     * 獲取指定的 Controller
     */
    const getController = useCallback(<T extends AbstractController>(name: string): T | null => {
        if (!registry) return null
        return registry.getController<T>(name)
    }, [registry])

    /**
     * 執行 Action
     */
    const executeAction = useCallback(async (
        controllerName: string, 
        actionType: string, 
        payload?: any
    ): Promise<void> => {
        if (!registry) {
            throw new Error('Controller Registry not ready')
        }
        await registry.executeAction(controllerName, actionType, payload)
    }, [registry])

    /**
     * 檢查 Action 是否存在
     */
    const hasAction = useCallback((controllerName: string, actionType: string): boolean => {
        if (!registry) return false
        return registry.hasAction(controllerName, actionType)
    }, [registry])

    /**
     * 獲取所有可用的 Actions
     */
    const getAvailableActions = useCallback(() => {
        if (!registry) return []
        return registry.discoverAllActions()
    }, [registry])

    /**
     * 獲取所有 Controller 名稱
     */
    const getControllerNames = useCallback(() => {
        if (!registry) return []
        return registry.getControllerNames()
    }, [registry])

    /**
     * 獲取註冊狀態
     */
    const getRegistrationStatus = useCallback(() => {
        if (!registry) return null
        return registry.getRegistrationStatus()
    }, [registry])

    return {
        isReady,
        registry,
        getController,
        executeAction,
        hasAction,
        getAvailableActions,
        getControllerNames,
        getRegistrationStatus
    }
}

/**
 * 特定 Controller 存取 Hook
 * 提供類型安全的 Controller 存取
 */
export function useController<T extends AbstractController>(controllerName: string) {
    const { isReady, getController } = useControllerRegistry()
    const [controller, setController] = useState<T | null>(null)

    useEffect(() => {
        if (isReady) {
            const controllerInstance = getController<T>(controllerName)
            setController(controllerInstance)
        }
    }, [isReady, controllerName, getController])

    return {
        controller,
        isReady: isReady && controller !== null
    }
}