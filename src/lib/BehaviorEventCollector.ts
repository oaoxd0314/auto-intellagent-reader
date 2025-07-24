import { useBehaviorStore } from '../stores/behaviorStore'

/**
 * 事件收集配置選項
 */
interface EventCollectorConfig {
  enabled: boolean
  bufferSize: number
  flushInterval: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * 事件選項
 */
interface EventOptions {
  level?: 'debug' | 'info' | 'warn' | 'error'
  category?: string
  shouldBuffer?: boolean
  metadata?: Record<string, any>
}

/**
 * 行為事件收集器 - 橫切關注點抽象層
 * 
 * 職責：
 * - 為 AI Agent 提供統一的行為事件收集接口
 * - 避免 Controller 層直接依賴 Zustand Store
 * - 提供事件格式化、過濾、緩衝等功能
 * - 為未來的 logging 功能提供擴展點
 * 
 * 設計原則：
 * - 單一職責：專注於事件收集這一橫切關注點
 * - 依賴反轉：Controller 依賴抽象而非具體實現
 * - 開放封閉：對擴展開放，對修改封閉
 * - 易於移除：如果證明是過度設計，刪除成本很低
 */
export class BehaviorEventCollector {
  private static instance: BehaviorEventCollector | null = null
  private config: EventCollectorConfig

  private constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      bufferSize: 50,
      flushInterval: 1000,
      logLevel: 'debug'
    }
  }

  /**
   * 獲取單例實例
   */
  static getInstance(): BehaviorEventCollector {
    if (!BehaviorEventCollector.instance) {
      BehaviorEventCollector.instance = new BehaviorEventCollector()
    }
    return BehaviorEventCollector.instance
  }

  /**
   * 配置事件收集器
   */
  configure(config: Partial<EventCollectorConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 收集 Controller 事件 - 統一入口
   */
  collectControllerEvent(
    controller: string,
    message: string,
    data?: any,
    options?: EventOptions
  ): void {
    if (!this.config.enabled) {
      console.log('⚠️ [BehaviorEventCollector] 事件收集已禁用，跳過:', { controller, message })
      return
    }

    // 事件級別過濾
    if (options?.level && !this.shouldLogEvent(options.level)) {
      console.log('⚠️ [BehaviorEventCollector] 事件級別過濾，跳過:', { controller, message, level: options.level })
      return
    }

    const eventLog = this.createEventLog(controller, message, data, options)
    
    console.log('🔄 [BehaviorEventCollector] 處理事件:', {
      控制器: controller,
      消息: message,
      數據: data ? '有' : '無',
      級別: options?.level || 'info',
      格式化後: eventLog.substring(0, 100) + '...'
    })

    this.sendToStore(eventLog)
  }

  /**
   * 上下文管理 - 替代原來的 startCollecting/stopCollecting
   */
  setCurrentContext(context: string | null): void {
    if (!this.config.enabled) {
      console.log('⚠️ [BehaviorEventCollector] 事件收集已禁用，無法設置上下文')
      return
    }

    console.log('🎯 [BehaviorEventCollector] 設置當前上下文:', { context })
    useBehaviorStore.getState().setCurrentContext(context)
    
    const status = this.getCollectionStatus()
    console.log('✅ [BehaviorEventCollector] 上下文已更新:', status)
  }

  /**
   * 清空事件記錄 - 用於上下文切換時的清理
   */
  clearEvents(): void {
    if (!this.config.enabled) {
      console.log('⚠️ [BehaviorEventCollector] 事件收集已禁用，無法清空事件')
      return
    }

    console.log('🧹 [BehaviorEventCollector] 清空事件記錄')
    const previousStatus = this.getCollectionStatus()
    console.log('📊 [BehaviorEventCollector] 清空前統計:', previousStatus)
    
    useBehaviorStore.getState().clearEvents()
  }

  /**
   * 獲取行為數據 - 提供統一接口
   */
  getBehaviorData() {
    return useBehaviorStore.getState().getBehaviorData()
  }

  /**
   * 獲取收集狀態 - 更新後的狀態信息
   */
  getCollectionStatus(): {
    enabled: boolean
    eventCount: number
    relevantEventCount: number
    currentContext: string | null
    sessionDuration: number
  } {
    const state = useBehaviorStore.getState()
    const relevantEvents = state.controllerEvents.filter(event => {
      return event.includes('PostController') || 
             event.includes('InteractionController') ||
             event.includes('MarkdownRenderer') ||
             (!event.includes('AIAgentController') && 
              !event.includes('initialized') && 
              !event.includes('destroyed'))
    })

    return {
      enabled: this.config.enabled,
      eventCount: state.controllerEvents.length,
      relevantEventCount: relevantEvents.length,
      currentContext: state.currentContext,
      sessionDuration: Date.now() - state.sessionStart
    }
  }

  // ===== 私有方法 =====

  /**
   * 創建標準化事件日誌格式
   */
  private createEventLog(
    controller: string,
    message: string,
    data?: any,
    options?: EventOptions
  ): string {
    const timestamp = Date.now()
    const level = options?.level || 'info'
    const category = options?.category || 'default'

    // 格式化數據
    const formattedData = this.formatEventData(data)

    // 基本格式：timestamp|level|controller|category|message|data
    const eventLog = [
      timestamp,
      level,
      controller,
      category,
      message,
      formattedData
    ].join('|')

    return eventLog
  }

  /**
   * 格式化事件數據 - 未來的工具函數集中地
   */
  private formatEventData(data: any): string {
    if (!data) return ''

    try {
      // 處理循環引用和敏感數據
      const sanitizedData = this.sanitizeData(data)
      return JSON.stringify(sanitizedData)
    } catch (error) {
      return '[Serialization Error]'
    }
  }

  /**
   * 數據清理 - 移除敏感信息和循環引用
   */
  private sanitizeData(data: any, seen = new WeakSet()): any {
    if (data === null || typeof data !== 'object') {
      return data
    }

    if (seen.has(data)) {
      return '[Circular Reference]'
    }

    seen.add(data)

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item, seen))
    }

    const result: any = {}
    for (const [key, value] of Object.entries(data)) {
      // 過濾敏感字段
      if (this.isSensitiveField(key)) {
        result[key] = '[REDACTED]'
      } else {
        result[key] = this.sanitizeData(value, seen)
      }
    }

    return result
  }

  /**
   * 檢查是否為敏感字段
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'credential',
      'authorization'
    ]

    return sensitiveFields.some(field =>
      fieldName.toLowerCase().includes(field)
    )
  }

  /**
   * 事件級別過濾
   */
  private shouldLogEvent(level: string): boolean {
    const levelPriority = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }

    const eventLevel = levelPriority[level as keyof typeof levelPriority] ?? 0
    const configLevel = levelPriority[this.config.logLevel] ?? 0

    return eventLevel >= configLevel
  }

  /**
   * 發送事件到 Store
   */
  private sendToStore(eventLog: string): void {
    try {
      useBehaviorStore.getState().collectEvent(eventLog)
    } catch (error) {
      // 避免 logging 系統本身的錯誤影響應用
      console.warn('[BehaviorEventCollector] Failed to send event to store:', error)
    }
  }

  // ===== 未來擴展點 =====

  /**
   * 批量收集事件 - 未來功能
   */
  collectBatch(events: Array<{
    controller: string
    message: string
    data?: any
    options?: EventOptions
  }>): void {
    // 實作批量處理邏輯
    events.forEach(event => {
      this.collectControllerEvent(
        event.controller,
        event.message,
        event.data,
        event.options
      )
    })
  }

  /**
   * 設置事件過濾器 - 未來功能
   */
  setEventFilter(_filter: (controller: string, message: string, data?: any) => boolean): void {
    // 實作過濾器邏輯
  }

  /**
   * 導出事件日誌 - 未來功能
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    const behaviorData = this.getBehaviorData()

    if (format === 'csv') {
      // 實作 CSV 導出
      return this.convertToCSV(behaviorData.recentEvents)
    }

    return JSON.stringify(behaviorData, null, 2)
  }

  private convertToCSV(events: string[]): string {
    const headers = ['Timestamp', 'Level', 'Controller', 'Category', 'Message', 'Data']
    const rows = events.map(event => event.split('|'))

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csvContent
  }
}

// 導出單例實例供全局使用
export const behaviorEventCollector = BehaviorEventCollector.getInstance()

// 導出類型定義
export type { EventOptions, EventCollectorConfig }