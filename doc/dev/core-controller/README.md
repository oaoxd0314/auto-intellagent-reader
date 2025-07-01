# AI Agent 系統技術實作規格

## 🎯 系統概述

採用 Controller-Facade Pattern 實現 AI Agent 系統的技術架構。

### 📋 當前開發階段

**階段 1: Background AI Agent 基礎建立** 🚀 (當前重點)
- 創建 AIAgent Context
- OpenRouter API 整合
- 基礎事件監聽
- 數據流測試

---

## 🏗️ 階段 1 技術實作：Background AI Agent

### 核心目標
建立可以在背景運作的 AI agent instance，串接 OpenRouter，讓他可以簡單吃到目前的 observe 事件。

### 1. AIAgent Context 設計

```typescript
// src/contexts/AIAgentContext.tsx
interface AIAgentState {
  isInitialized: boolean
  isConnected: boolean
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error'
  lastEvent: BehaviorEvent | null
  eventQueue: BehaviorEvent[]
  error: string | null
}

interface AIAgentContextType extends AIAgentState {
  // 初始化
  initializeAgent: () => Promise<void>
  
  // 連線管理
  connect: () => Promise<void>
  disconnect: () => void
  
  // 事件處理
  processEvent: (event: BehaviorEvent) => void
  clearEventQueue: () => void
  
  // 錯誤處理
  clearError: () => void
}

interface BehaviorEvent {
  type: 'post_view' | 'text_selection' | 'comment_add' | 'scroll_pause'
  timestamp: number
  context: {
    postId?: string
    selectedText?: string
    position?: number
    duration?: number
  }
  metadata?: Record<string, any>
}
```

### 2. OpenRouter API 整合

```typescript
// src/services/OpenRouterService.ts
interface OpenRouterConfig {
  apiKey: string
  baseURL: string
  model: string
  maxTokens: number
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface StreamResponse {
  id: string
  choices: Array<{
    delta: {
      content?: string
    }
    finish_reason?: string
  }>
}

class OpenRouterService {
  private config: OpenRouterConfig
  private eventSource: EventSource | null = null
  
  constructor(config: OpenRouterConfig) {
    this.config = config
  }
  
  // SSE 連線
  async createSSEConnection(
    messages: ChatMessage[],
    onMessage: (content: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        stream: true
      })
    })
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    try {
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onComplete()
              return
            }
            
            try {
              const parsed: StreamResponse = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                onMessage(content)
              }
            } catch (err) {
              console.warn('Failed to parse SSE data:', data)
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error)
    }
  }
  
  // 簡單聊天
  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        stream: false
      })
    })
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }
  
  // 關閉連線
  closeConnection(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
}
```

### 3. AI Agent Controller 設計

```typescript
// src/controllers/AIAgentController.ts
class AIAgentController extends AbstractController {
  private openRouterService: OpenRouterService
  private eventBuffer: BehaviorEvent[] = []
  private isProcessing = false
  
  constructor(
    private aiAgentContext: AIAgentContext,
    private behaviorContext: BehaviorContext,
    private postContext: PostContext,
    private interactionContext: InteractionContext
  ) {
    super()
    
    this.openRouterService = new OpenRouterService({
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      model: 'anthropic/claude-3-haiku',
      maxTokens: 1000
    })
  }
  
  // 初始化 AI Agent
  async initializeAgent(): Promise<void> {
    try {
      this.aiAgentContext.updateStatus('connecting')
      
      // 測試 API 連線
      const testResponse = await this.openRouterService.chat([
        { role: 'system', content: 'You are a reading assistant AI.' },
        { role: 'user', content: 'Hello, can you help me with reading?' }
      ])
      
      if (testResponse) {
        this.aiAgentContext.updateStatus('connected')
        this.startEventListening()
      }
    } catch (error) {
      this.aiAgentContext.setError(error.message)
      this.aiAgentContext.updateStatus('error')
    }
  }
  
  // 開始事件監聽
  private startEventListening(): void {
    // 監聽現有的 Context 事件
    this.behaviorContext.onBehaviorEvent((event) => {
      this.processEvent({
        type: 'scroll_pause',
        timestamp: Date.now(),
        context: {
          position: event.scrollPosition,
          duration: event.pauseDuration
        }
      })
    })
    
    this.postContext.onPostView((postId) => {
      this.processEvent({
        type: 'post_view',
        timestamp: Date.now(),
        context: { postId }
      })
    })
    
    this.interactionContext.onTextSelection((text, elementId) => {
      this.processEvent({
        type: 'text_selection',
        timestamp: Date.now(),
        context: { selectedText: text },
        metadata: { elementId }
      })
    })
  }
  
  // 處理事件
  private processEvent(event: BehaviorEvent): void {
    this.eventBuffer.push(event)
    this.aiAgentContext.addEventToQueue(event)
    
    // 簡單的批次處理 (每 5 個事件或 10 秒處理一次)
    if (this.eventBuffer.length >= 5 || this.shouldProcessByTime()) {
      this.processEventBatch()
    }
  }
  
  // 批次處理事件
  private async processEventBatch(): Promise<void> {
    if (this.isProcessing || this.eventBuffer.length === 0) return
    
    this.isProcessing = true
    const events = [...this.eventBuffer]
    this.eventBuffer = []
    
    try {
      const contextPrompt = this.buildContextPrompt(events)
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `你是一個閱讀助手 AI。根據用戶的行為事件，判斷是否應該提供建議。
          
          如果需要建議，回覆 JSON 格式：
          {"shouldSuggest": true, "reason": "建議原因"}
          
          如果不需要建議，回覆：
          {"shouldSuggest": false, "reason": "不建議的原因"}`
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ]
      
      const response = await this.openRouterService.chat(messages)
      
      try {
        const analysis = JSON.parse(response)
        console.log('AI 分析結果:', analysis)
        
        // 這個階段只記錄，不採取行動
        if (analysis.shouldSuggest) {
          console.log('AI 建議觸發:', analysis.reason)
        }
      } catch (parseError) {
        console.warn('無法解析 AI 回應:', response)
      }
      
    } catch (error) {
      console.error('AI 事件處理失敗:', error)
    } finally {
      this.isProcessing = false
    }
  }
  
  // 建立上下文 Prompt
  private buildContextPrompt(events: BehaviorEvent[]): string {
    const currentPost = this.postContext.getCurrentPost()
    const postContext = currentPost ? `當前文章: ${currentPost.title}` : '無當前文章'
    
    const eventSummary = events.map(event => {
      switch (event.type) {
        case 'post_view':
          return `查看文章: ${event.context.postId}`
        case 'text_selection':
          return `選擇文字: "${event.context.selectedText?.slice(0, 50)}..."`
        case 'scroll_pause':
          return `滾動停留: ${event.context.duration}ms at ${event.context.position}`
        case 'comment_add':
          return `新增評論`
        default:
          return `其他事件: ${event.type}`
      }
    }).join('\n')
    
    return `${postContext}

最近的用戶行為:
${eventSummary}

請分析這些行為是否需要提供閱讀建議。`
  }
  
  // 時間檢查
  private shouldProcessByTime(): boolean {
    // 簡單實現：每 10 秒檢查一次
    return Date.now() % 10000 < 1000
  }
  
  // 獲取狀態
  getConnectionStatus(): string {
    return this.aiAgentContext.getConnectionStatus()
  }
  
  getRecentEvents(): BehaviorEvent[] {
    return this.aiAgentContext.getEventQueue()
  }
  
  // 清理
  cleanup(): void {
    this.openRouterService.closeConnection()
    this.eventBuffer = []
    this.isProcessing = false
  }
}
```

### 4. Hook 整合

```typescript
// src/hooks/useAIAgent.ts
export function useAIAgent() {
  const controller = useAIAgentController()
  const [isInitializing, setIsInitializing] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  
  // 初始化 AI Agent
  const initializeAgent = useCallback(async () => {
    setIsInitializing(true)
    setInitError(null)
    
    try {
      await controller.initializeAgent()
    } catch (error) {
      setInitError(error.message)
    } finally {
      setIsInitializing(false)
    }
  }, [controller])
  
  // 自動初始化
  useEffect(() => {
    initializeAgent()
  }, [initializeAgent])
  
  return {
    // 狀態
    connectionStatus: controller.getConnectionStatus(),
    recentEvents: controller.getRecentEvents(),
    isInitializing,
    initError,
    
    // 操作
    reinitialize: initializeAgent,
    clearError: () => setInitError(null)
  }
}
```

---

## 🔄 後續階段預覽

### 階段 2: 事件觸發頻率測試 (下一階段)
- 觀察 AI 觸發頻率
- 事件過濾規則
- 性能基線建立

### 階段 3: LLM Event Queue & Toast UI
- Message Queue 系統
- Toast 組件實作
- 用戶交互處理

### 階段 4-6: 後續實現
- Message Queue 系統
- Toast 組件實作
- 用戶交互處理

---

## 🛠️ 開發注意事項

### 環境配置
```bash
# .env
VITE_OPENROUTER_API_KEY=your_api_key_here
```

### 依賴安裝
```bash
pnpm add @types/eventsource  # SSE 支援
```

### 調試工具
- Console logging 追蹤事件流
- React DevTools 檢查 Context 狀態
- Network Tab 監控 API 調用

---

**參考文檔：**
- [Controller 架構](../architecture.md) - 技術架構設計
- [狀態流管理](../state-flow.md) - 數據流設計 