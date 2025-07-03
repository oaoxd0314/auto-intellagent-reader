# Event-Driven AI Agent 架構規格

## 📋 背景與問題分析

### 原始問題
在初始實作中，我們遇到了以下架構問題：

1. **過度複雜的初始化流程** - 重複的初始化調用和複雜的狀態管理
2. **Context 空殼化** - Context 只剩狀態管理，沒有真正的控制能力
3. **邏輯分散** - 實際業務邏輯分散在各個 Hook 中（useReplyPost、useCommentSection、useMarkSection）
4. **AI Agent 孤立** - AI Agent 無法感知用戶行為，缺乏事件驅動機制
5. **缺乏統一事件管理** - 各組件各自為政，沒有中央事件系統

### 簡化階段
我們首先進行了大幅簡化：
- 簡化 `AIAgentService` 為純 API 調用層
- 簡化 `AIAgentController` 為基本聊天功能
- 創建 `SimpleChat` 組件進行基礎測試
- 移除複雜的初始化和調試組件

## 🎯 最終架構設計

### 核心理念
實現真正的 **Event-Driven Architecture**，其中：

1. **BehaviorContext** - 被動收集用戶行為事件
2. **EventManager** - 中央事件調度器，所有 Context 實例註冊在此
3. **AI Agent** - 純思考模型，分析行為並生成建議事件
4. **Context Facade** - 真正的事件驅動操作執行

### 完整事件流程

```
Controller Events (AbstractController logs)
    ↓
BehaviorContext (事件收集器，記錄用戶行為)
    ↓
AI Agent (純思考模型，分析行為 + 生成建議事件)
    ↓
EventManager (中央調度器，所有 Context 實例註冊在此)
    ↓
Context 實例執行 (用戶點擊時執行對應方法)
    ↓
Toast Queue UI (用戶交互界面)
```

## 🏗️ 核心組件設計

### 1. EventManager - 中央調度器

```typescript
// src/core/EventManager.ts
export class EventManager {
  private static instance: EventManager
  private registry = new Map<string, Function>()
  
  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager()
    }
    return EventManager.instance
  }
  
  // Context 註冊可用方法
  register(eventName: string, handler: Function): void {
    this.registry.set(eventName, handler)
  }
  
  // 執行 AI 建議的事件
  async execute(eventName: string, params: any): Promise<any> {
    const handler = this.registry.get(eventName)
    if (!handler) {
      throw new Error(`Event handler not found: ${eventName}`)
    }
    return handler(params)
  }
  
  // 獲取所有可用事件（給 AI 參考）
  getAvailableEvents(): EventRegistry {
    return Object.fromEntries(this.registry.entries())
  }
  
  // 注銷事件處理器
  unregister(eventName: string): void {
    this.registry.delete(eventName)
  }
  
  // 檢查事件是否可用
  hasEvent(eventName: string): boolean {
    return this.registry.has(eventName)
  }
}

interface EventRegistry {
  [eventName: string]: Function
}
```

### 2. BehaviorContext - 事件收集器

```typescript
// src/contexts/BehaviorContext.tsx
interface BehaviorData {
  recentEvents: string[]           // Controller 事件日誌
  userPattern: ReadingPattern      // 分析出的用戶模式
  sessionData: SessionData         // 會話數據
  timestamp: number                // 數據時間戳
  contextState: ContextState       // 當前 Context 狀態快照
}

interface ReadingPattern {
  type: 'scanning' | 'reading' | 'studying' | 'skimming'
  confidence: number
  duration: number
  focus_areas: string[]
}

export function BehaviorProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<string[]>([])
  const [sessionData, setSessionData] = useState<SessionData>({})
  
  // 收集 Controller events（來自 AbstractController logs）
  const collectEvent = useCallback((eventLog: string) => {
    setEvents(prev => [...prev.slice(-50), eventLog]) // 保持最近50個事件
  }, [])
  
  // 分析用戶模式
  const analyzeUserPattern = useCallback((events: string[]): ReadingPattern => {
    // 基於事件頻率和類型分析用戶行為模式
    // 例如：頻繁的 State updated 可能表示用戶在快速瀏覽
    // 大量 Event listener added 可能表示用戶在深度閱讀
    return {
      type: 'reading', // 暫時固定，後續實作分析邏輯
      confidence: 0.8,
      duration: Date.now() - sessionStart,
      focus_areas: extractFocusAreas(events)
    }
  }, [])
  
  // 提供給 AI 的完整行為數據
  const getBehaviorData = useCallback((): BehaviorData => ({
    recentEvents: events,
    userPattern: analyzeUserPattern(events),
    sessionData,
    timestamp: Date.now(),
    contextState: getCurrentContextState()
  }), [events, sessionData, analyzeUserPattern])
  
  // 上下文狀態快照
  const getCurrentContextState = useCallback((): ContextState => {
    return {
      currentPost: /* 從 PostContext 獲取 */,
      recentInteractions: /* 從 InteractionContext 獲取 */,
      activeStrategies: /* 從 BehaviorContext 獲取 */
    }
  }, [])
}
```

### 3. AI Agent - 純思考模型

```typescript
// src/controllers/AIAgentController.ts
interface SuggestionEvent {
  eventName: string                 // 對應 EventManager 中的事件名稱
  params: any                      // 事件參數
  message: string                  // 用戶看到的建議文字
  priority: 'low' | 'medium' | 'high' | 'urgent'
  confidence: number               // AI 信心度 (0-1)
  reasoning: string                // 建議原因
  category: 'reading' | 'interaction' | 'navigation' | 'learning'
}

export class AIAgentController extends AbstractController {
  private behaviorContext: BehaviorContextType | null = null
  
  // 設置 BehaviorContext 引用
  setBehaviorContext(context: BehaviorContextType): void {
    this.behaviorContext = context
  }
  
  // 分析用戶行為並生成建議
  async generateSuggestions(): Promise<SuggestionEvent[]> {
    if (!this.behaviorContext) {
      throw new Error('BehaviorContext not set')
    }
    
    const behaviorData = this.behaviorContext.getBehaviorData()
    const availableEvents = EventManager.getInstance().getAvailableEvents()
    
    // 構建給 AI 的 prompt
    const prompt = this.buildAnalysisPrompt(behaviorData, availableEvents)
    
    // 發送到 OpenRouter
    const response = await this.sendMessage(prompt)
    
    // 解析 AI 回應為結構化建議
    return this.parseAIResponse(response)
  }
  
  private buildAnalysisPrompt(behaviorData: BehaviorData, availableEvents: EventRegistry): string {
    return `
作為智能閱讀助手，請分析用戶當前行為並提供建議。

用戶行為數據：
- 最近事件：${behaviorData.recentEvents.slice(-10).join(', ')}
- 閱讀模式：${behaviorData.userPattern.type}
- 專注區域：${behaviorData.userPattern.focus_areas.join(', ')}
- 當前狀態：${JSON.stringify(behaviorData.contextState)}

可用操作：
${Object.keys(availableEvents).map(event => `- ${event}`).join('\n')}

請根據用戶行為生成最多3個有用的建議，格式：
{
  "suggestions": [
    {
      "eventName": "具體的事件名稱",
      "params": {...},
      "message": "用戶看到的建議文字",
      "priority": "medium",
      "confidence": 0.8,
      "reasoning": "建議原因",
      "category": "reading"
    }
  ]
}
`
  }
  
  private parseAIResponse(response: string): SuggestionEvent[] {
    try {
      const parsed = JSON.parse(response)
      return parsed.suggestions || []
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      return []
    }
  }
}
```

### 4. Context Facade 重構

```typescript
// src/contexts/InteractionContext.tsx
export function InteractionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(interactionReducer, initialState)
  const eventManager = EventManager.getInstance()
  
  // 註冊所有可用方法到 EventManager
  useEffect(() => {
    eventManager.register('interaction.addComment', addComment)
    eventManager.register('interaction.addHighlight', addHighlight) 
    eventManager.register('interaction.addReply', addReply)
    eventManager.register('interaction.deleteComment', deleteComment)
    eventManager.register('interaction.deleteHighlight', deleteHighlight)
    
    return () => {
      // 清理註冊
      eventManager.unregister('interaction.addComment')
      eventManager.unregister('interaction.addHighlight')
      eventManager.unregister('interaction.addReply')
      eventManager.unregister('interaction.deleteComment')
      eventManager.unregister('interaction.deleteHighlight')
    }
  }, [])
  
  // Event-driven methods
  const addComment = async (params: {
    postId: string
    sectionId: string
    selectedText: string
    content: string
  }) => {
    const controller = InteractionController.getInstance()
    const result = await controller.addComment(
      params.postId, 
      params.sectionId, 
      params.selectedText, 
      params.content
    )
    
    // 通知 BehaviorContext（如果需要）
    // 這裡不需要發射事件，因為 Controller 會自動 log
    
    return result
  }
  
  const addHighlight = async (params: {
    postId: string
    sectionId: string
    selectedText: string
  }) => {
    const controller = InteractionController.getInstance()
    return controller.addHighlight(params.postId, params.sectionId, params.selectedText)
  }
  
  // ... 其他方法
}
```

### 5. Message Queue 系統

```typescript
// src/services/MessageQueueService.ts
export class MessageQueueService {
  private queue: SuggestionEvent[] = []
  private isProcessing = false
  private maxQueueSize = 10
  
  // 添加建議到佇列
  enqueue(suggestion: SuggestionEvent): void {
    if (this.queue.length >= this.maxQueueSize) {
      // 移除優先級最低的建議
      this.queue.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority))
      this.queue.pop()
    }
    
    this.queue.push(suggestion)
    this.prioritize()
  }
  
  // 取出下一個建議
  dequeue(): SuggestionEvent | null {
    return this.queue.shift() || null
  }
  
  // 優先級排序
  private prioritize(): void {
    this.queue.sort((a, b) => {
      // 先按優先級，再按信心度
      const priorityDiff = this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority)
      if (priorityDiff !== 0) return priorityDiff
      return b.confidence - a.confidence
    })
  }
  
  private getPriorityValue(priority: string): number {
    const values = { urgent: 4, high: 3, medium: 2, low: 1 }
    return values[priority] || 1
  }
  
  // 獲取佇列狀態
  getStatus() {
    return {
      length: this.queue.length,
      nextPriority: this.queue[0]?.priority || null,
      isProcessing: this.isProcessing
    }
  }
}
```

### 6. Toast Queue UI

```typescript
// src/components/ToastQueue.tsx
interface ToastQueueProps {
  maxVisible?: number
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
}

export function ToastQueue({ maxVisible = 3, position = 'bottom-right' }: ToastQueueProps) {
  const [visibleSuggestions, setVisibleSuggestions] = useState<SuggestionEvent[]>([])
  const messageQueue = MessageQueueService.getInstance()
  const eventManager = EventManager.getInstance()
  
  // 定期檢查佇列
  useEffect(() => {
    const interval = setInterval(() => {
      if (visibleSuggestions.length < maxVisible) {
        const nextSuggestion = messageQueue.dequeue()
        if (nextSuggestion) {
          setVisibleSuggestions(prev => [...prev, nextSuggestion])
        }
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [visibleSuggestions.length, maxVisible])
  
  // 執行建議
  const executeSuggestion = async (suggestion: SuggestionEvent) => {
    try {
      await eventManager.execute(suggestion.eventName, suggestion.params)
      
      // 移除已執行的建議
      setVisibleSuggestions(prev => 
        prev.filter(s => s !== suggestion)
      )
      
      // 顯示成功反饋
      toast.success('建議已執行')
    } catch (error) {
      console.error('Failed to execute suggestion:', error)
      toast.error('執行失敗')
    }
  }
  
  // 忽略建議
  const dismissSuggestion = (suggestion: SuggestionEvent) => {
    setVisibleSuggestions(prev => 
      prev.filter(s => s !== suggestion)
    )
  }
  
  return (
    <div className={`fixed ${getPositionClasses(position)} space-y-2 z-50`}>
      {visibleSuggestions.map((suggestion, index) => (
        <ToastCard
          key={suggestion.eventName + suggestion.timestamp}
          suggestion={suggestion}
          onExecute={() => executeSuggestion(suggestion)}
          onDismiss={() => dismissSuggestion(suggestion)}
          style={{
            transform: `translateY(${index * -8}px)`,
            zIndex: 1000 - index
          }}
        />
      ))}
    </div>
  )
}
```

## 🔧 實作步驟

### Phase 1: EventManager 基礎建立
1. ✅ 實作 `EventManager` 單例模式
2. ✅ 建立事件註冊和執行機制
3. ✅ 添加錯誤處理和驗證

### Phase 2: Context Facade 重構
1. ✅ 重構 `InteractionContext` 為事件驅動
2. ✅ 將 Hook 邏輯回收到 Context
3. ✅ 註冊所有可用操作到 EventManager

### Phase 3: BehaviorContext 事件收集
1. ✅ 實作事件收集機制
2. ✅ 建立用戶行為分析邏輯
3. ✅ 提供結構化的行為數據 API

### Phase 4: AI Agent 整合
1. ✅ 擴展 `AIAgentController` 支持行為分析
2. ✅ 實作建議生成和解析邏輯
3. ✅ 整合 `MessageQueueService`

### Phase 5: Toast Queue UI
1. ✅ 實作 `ToastQueue` 組件
2. ✅ 建立建議執行和反饋機制
3. ✅ 完整的用戶交互測試

### Phase 6: 整合測試
1. ✅ End-to-End 事件流測試
2. ✅ 性能優化和錯誤處理
3. ✅ 用戶體驗驗證

## 📊 技術決策和權衡

### 為什麼選擇 EventManager？
1. **中央化管理** - 統一的事件註冊和調度
2. **解耦架構** - AI Agent 不需要直接依賴 Context
3. **可擴展性** - 容易添加新的 Context 和操作
4. **類型安全** - 集中管理可以更好地控制類型

### 為什麼 AI Agent 是純思考模型？
1. **單一職責** - 只負責分析和建議生成
2. **無狀態** - 不管理 UI 狀態，只處理數據
3. **可測試性** - 純函數式邏輯，容易測試
4. **可替換性** - 可以輕易切換不同的 AI 模型

### BehaviorContext 作為事件收集器的優勢
1. **被動收集** - 不干擾現有邏輯
2. **完整記錄** - 捕獲所有用戶行為
3. **實時分析** - 可以即時提供行為數據
4. **歷史追蹤** - 保持行為歷史用於模式分析

## 🔮 未來擴展方向

### 1. 智能學習
- 用戶反饋學習機制
- 個人化建議權重調整
- A/B 測試框架

### 2. 高級分析
- 深度行為模式識別
- 跨會話行為追蹤
- 協作行為分析

### 3. 多模態整合
- 語音建議支持
- 視覺化行為展示
- 手勢操作集成

---

**文檔版本：** v3.0  
**最後更新：** 2024年12月  
**維護者：** AI Agent 開發團隊 