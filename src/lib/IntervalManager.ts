/**
 * 簡單的間隔任務管理器
 * 
 * 職責：
 * - 註冊和管理定時任務
 * - 執行間隔回調函數
 * 
 * 使用方式：
 * ```typescript
 * const intervalManager = IntervalManager.getInstance()
 * 
 * // 註冊任務
 * intervalManager.register('behavior-analysis', {
 *   callback: () => aiController.executeAction('ANALYZE_BEHAVIOR'),
 *   interval: 30000
 * })
 * 
 * // 啟動所有任務
 * intervalManager.startAll()
 * ```
 */
export class IntervalManager {
  private static instance: IntervalManager | null = null
  private tasks: Map<string, { callback: () => void | Promise<void>; interval: number }> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()

  private constructor() { }

  static getInstance(): IntervalManager {
    if (!IntervalManager.instance) {
      IntervalManager.instance = new IntervalManager()
    }
    return IntervalManager.instance
  }

  /**
   * 註冊間隔任務
   */
  register(taskId: string, config: {
    callback: () => void | Promise<void>
    interval: number
  }): void {
    this.tasks.set(taskId, {
      callback: config.callback,
      interval: config.interval
    })
  }

  /**
   * 啟動特定任務
   */
  start(taskId: string): void {
    const task = this.tasks.get(taskId)
    if (!task) {
      console.warn(`[IntervalManager] Task not found: ${taskId}`)
      return
    }

    // 如果已經在運行，先停止
    this.stop(taskId)

    const timer = setInterval(async () => {
      try {
        await task.callback()
      } catch (error) {
        console.error(`[IntervalManager] Task failed: ${taskId}`, error)
      }
    }, task.interval)

    this.timers.set(taskId, timer)
  }

  /**
   * 停止特定任務
   */
  stop(taskId: string): void {
    const timer = this.timers.get(taskId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(taskId)
    }
  }

  /**
   * 啟動所有任務
   */
  startAll(): void {
    for (const taskId of this.tasks.keys()) {
      this.start(taskId)
    }
  }

  /**
   * 停止所有任務
   */
  stopAll(): void {
    for (const taskId of this.timers.keys()) {
      this.stop(taskId)
    }
  }

  /**
   * 移除任務
   */
  unregister(taskId: string): void {
    this.stop(taskId)
    this.tasks.delete(taskId)
  }

  /**
   * 檢查任務是否在運行
   */
  isRunning(taskId: string): boolean {
    return this.timers.has(taskId)
  }

  /**
   * 清理所有任務
   */
  cleanup(): void {
    this.stopAll()
    this.tasks.clear()
    this.timers.clear()
  }
}

// 導出單例實例
export const intervalManager = IntervalManager.getInstance()