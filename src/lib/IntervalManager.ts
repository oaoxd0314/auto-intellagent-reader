/**
 * 間隔任務配置
 */
interface IntervalTask {
  id: string
  callback: () => void | Promise<void>
  interval: number
  enabled: boolean
}

/**
 * 簡單的間隔任務管理器
 * 
 * 職責：
 * - 註冊間隔任務
 * - 管理定時器
 * - 定期執行回調
 * 
 * 使用方式：
 * ```typescript
 * const intervalManager = IntervalManager.getInstance()
 * 
 * // 註冊任務
 * intervalManager.register('ai-analysis', {
 *   callback: () => aiController.executeAction('ANALYZE_BEHAVIOR'),
 *   interval: 30000
 * })
 * 
 * // 啟動
 * intervalManager.startAll()
 * ```
 */
export class IntervalManager {
  private static instance: IntervalManager | null = null
  private tasks: Map<string, IntervalTask> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {}

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
    enabled?: boolean
  }): void {
    this.tasks.set(taskId, {
      id: taskId,
      callback: config.callback,
      interval: config.interval,
      enabled: config.enabled ?? true
    })
  }

  /**
   * 啟動特定任務
   */
  start(taskId: string): void {
    const task = this.tasks.get(taskId)
    if (!task || !task.enabled) return

    this.stop(taskId) // 清除現有定時器

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
   * 啟動所有啟用的任務
   */
  startAll(): void {
    for (const [taskId, task] of this.tasks) {
      if (task.enabled) {
        this.start(taskId)
      }
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
}

// 導出單例實例
export const intervalManager = IntervalManager.getInstance()