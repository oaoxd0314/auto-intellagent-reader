# 🤖 AI 功能實現指南

## 📋 關於本文檔

本文檔詳細說明如何在現有架構中實現 AI 相關功能，包括 AI Agent 指令、智能建議系統和行為分析功能的具體實作步驟。

---

## 🎯 AI Agent Command Pattern 實作

### **1. 創建 AI Agent 指令**

#### 步驟 1: 定義 AgentCommand 接口

```typescript
// src/ai-agent/commands/interfaces.ts
interface AgentCommand {
  type: string
  payload: unknown
  toHumanReadable(): string
  apply(policy: ApplyPolicy): Promise<void>
  undo?(): Promise<void>
}

interface ApplyPolicy {
  (command: AgentCommand, execute: () => Promise<void>): Promise<void>
}
```

#### 步驟 2: 實現具體 Command

```typescript
// src/ai-agent/commands/AddBookmarkCommand.ts
class AddBookmarkCommand implements AgentCommand {
  constructor(private payload: { postId: string; note?: string }) {}
  
  get type(): string { return 'ADD_BOOKMARK' }
  
  toHumanReadable(): string {
    return `將文章加入書籤${this.payload.note ? `: ${this.payload.note}` : ''}`
  }
  
  async apply(policy: ApplyPolicy): Promise<void> {
    const execute = async () => {
      const registry = ControllerRegistry.getInstance()
      await registry.executeAction('PostController', 'ADD_TO_BOOKMARK', {
        id: this.payload.postId,
        note: this.payload.note
      })
    }
    
    await policy(this, execute)
  }
  
  async undo(): Promise<void> {
    const registry = ControllerRegistry.getInstance()
    await registry.executeAction('PostController', 'REMOVE_FROM_BOOKMARK', {
      id: this.payload.postId
    })
  }
}
```

#### 步驟 3: 創建 CommandFactory

```typescript
// src/ai-agent/CommandFactory.ts
class CommandFactory {
  private static commandMap: Record<string, (args: string[]) => AgentCommand> = {
    ADD_BOOKMARK: (args) => new AddBookmarkCommand(this.parseBookmarkArgs(args)),
    ADD_NOTE: (args) => new AddNoteCommand(this.parseNoteArgs(args)),
    CREATE_SUMMARY: (args) => new CreateSummaryCommand(this.parseSummaryArgs(args))
  }
  
  static fromString(rawCommand: string): AgentCommand {
    const [commandType, ...args] = rawCommand.split(' ')
    const factory = this.commandMap[commandType]
    
    if (!factory) {
      throw new Error(`Unknown command type: ${commandType}`)
    }
    
    return factory(args)
  }
  
  private static parseBookmarkArgs(args: string[]): { postId: string; note?: string } {
    // 解析 "postId=\"123\" note=\"重要文章\""
    const params = this.parseKeyValueArgs(args)
    return {
      postId: params.postId,
      note: params.note
    }
  }
  
  private static parseKeyValueArgs(args: string[]): Record<string, string> {
    const result: Record<string, string> = {}
    const argsString = args.join(' ')
    const matches = argsString.matchAll(/(\w+)="([^"]*)"/g)
    
    for (const match of matches) {
      result[match[1]] = match[2]
    }
    
    return result
  }
}
```

#### 步驟 4: 實現 SuperController

```typescript
// src/ai-agent/SuperController.ts
class SuperController {
  private queue: AgentCommand[] = []
  private history: CommandExecution[] = []
  
  constructor(private defaultPolicy: ApplyPolicy) {}
  
  enqueue(rawCommand: string): void {
    try {
      const command = CommandFactory.fromString(rawCommand)
      this.queue.push(command)
      this.processQueue()
    } catch (error) {
      this.handleParseError(error, rawCommand)
    }
  }
  
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return
    
    const command = this.queue.shift()!
    const policy = this.selectPolicy(command)
    
    try {
      await command.apply(policy)
      this.recordSuccess(command)
    } catch (error) {
      this.recordFailure(command, error)
    }
    
    // 繼續處理下一個指令
    this.processQueue()
  }
  
  private selectPolicy(command: AgentCommand): ApplyPolicy {
    // 危險操作需要用戶確認
    if (command.type.includes('DELETE') || command.type.includes('REMOVE')) {
      return toastPolicy
    }
    
    return this.defaultPolicy
  }
  
  private recordSuccess(command: AgentCommand): void {
    this.history.push({
      command,
      status: 'success',
      timestamp: Date.now()
    })
  }
  
  private recordFailure(command: AgentCommand, error: unknown): void {
    this.history.push({
      command,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now()
    })
  }
}
```

### **2. 實現 ApplyPolicy 策略**

#### 直接執行策略

```typescript
// src/ai-agent/policies/DirectApplyPolicy.ts
const directApplyPolicy: ApplyPolicy = async (command, execute) => {
  console.log(`Executing: ${command.toHumanReadable()}`)
  await execute()
}
```

#### Toast 確認策略

```typescript
// src/ai-agent/policies/ToastPolicy.ts
const toastPolicy: ApplyPolicy = async (command, execute) => {
  return new Promise((resolve, reject) => {
    // 顯示 Toast 確認對話框
    showToast({
      title: '確認操作',
      message: command.toHumanReadable(),
      type: 'warning',
      actions: [
        {
          label: '確認',
          onClick: async () => {
            try {
              await execute()
              resolve()
            } catch (error) {
              reject(error)
            }
          }
        },
        {
          label: '取消',
          onClick: () => {
            resolve() // 取消但不報錯
          }
        }
      ]
    })
  })
}
```

---

## 🧠 智能建議系統實作

### **1. AI 行為分析功能**

#### 實現 AIAgentController

```typescript
// src/controllers/AIAgentController.ts
class AIAgentController extends AbstractController {
  private actionMap = createActionMap([
    { type: 'ANALYZE_BEHAVIOR', handler: this.analyzeBehaviorAction.bind(this) },
    { type: 'GENERATE_INSIGHTS', handler: this.generateInsightsAction.bind(this) },
    { type: 'SEND_TO_LLM', handler: this.sendToLLMAction.bind(this) }
  ])
  
  private async analyzeBehaviorAction(payload: {
    behaviorData: BehaviorData
    postContext: PostContext
  }): Promise<void> {
    try {
      // 1. 分析用戶行為模式
      const behaviorPattern = this.analyzeBehaviorPattern(payload.behaviorData)
      
      // 2. 嘗試使用 LLM 分析
      let aiInsights: StructuredInsights | null = null
      if (AIAgentService.isConfigured()) {
        try {
          aiInsights = await this.sendToLLM(behaviorPattern, payload.postContext)
        } catch (error) {
          console.warn('LLM analysis failed, using rule-based fallback:', error)
        }
      }
      
      // 3. 使用規則引擎作為 fallback
      const insights = aiInsights || this.ruleBasedAnalysis(behaviorPattern)
      
      // 4. 發送事件通知其他 Controller
      this.emit('aiAnalysisCompleted', {
        aiInsights: insights,
        behaviorData: payload.behaviorData,
        context: payload.postContext,
        timestamp: Date.now(),
        source: aiInsights ? 'llm' : 'rule_based',
        confidence: aiInsights ? 0.8 : 0.6
      })
      
    } catch (error) {
      this.emit('aiAnalysisError', {
        error: error instanceof Error ? error.message : String(error),
        behaviorData: payload.behaviorData
      })
    }
  }
  
  private analyzeBehaviorPattern(data: BehaviorData): BehaviorPattern {
    const avgInterval = data.events.length > 1 
      ? data.events.reduce((sum, event, i) => {
          if (i === 0) return 0
          return sum + (event.timestamp - data.events[i-1].timestamp)
        }, 0) / (data.events.length - 1)
      : 0
    
    let mode: 'scanning' | 'reading' | 'studying'
    let confidence: number
    
    if (avgInterval < 1000) {
      mode = 'scanning'
      confidence = 0.8
    } else if (avgInterval < 5000) {
      mode = 'reading'
      confidence = 0.7
    } else {
      mode = 'studying'
      confidence = 0.9
    }
    
    return {
      mode,
      confidence,
      avgEventInterval: avgInterval,
      eventCount: data.events.length,
      patterns: this.identifySpecificPatterns(data.events)
    }
  }
  
  private async sendToLLM(
    pattern: BehaviorPattern, 
    context: PostContext
  ): Promise<StructuredInsights> {
    const prompt = this.createAnalysisPrompt(pattern, context)
    const response = await AIAgentService.sendMessage(prompt)
    return this.parseStructuredResponse(response)
  }
  
  private createAnalysisPrompt(pattern: BehaviorPattern, context: PostContext): string {
    return `
基於以下用戶行為數據，請分析用戶的閱讀模式並提供智能建議：

行為模式:
- 閱讀模式: ${pattern.mode}
- 信心度: ${pattern.confidence}
- 平均事件間隔: ${pattern.avgEventInterval}ms
- 事件數量: ${pattern.eventCount}

文章上下文:
- 標題: ${context.currentPost?.title || '未知'}
- 閱讀進度: ${context.readingProgress || 0}%
- 類型: ${context.currentPost?.metadata?.category || '未知'}

請以 JSON 格式回應，包含：
1. 建議類型 (bookmark, summary, note, highlight)
2. 建議理由
3. 建議的具體操作
4. 信心度評分 (0-1)

回應格式:
{
  "suggestions": [
    {
      "type": "bookmark",
      "reason": "用戶表現出深度閱讀行為",
      "action": "將此文章加入書籤以便後續查看",
      "confidence": 0.8
    }
  ]
}
    `.trim()
  }
}
```

### **2. 智能建議生成系統**

#### 實現 AISuggestionController

```typescript
// src/controllers/AISuggestionController.ts
class AISuggestionController extends AbstractController {
  private suggestionQueue: AISuggestion[] = []
  
  protected onInitialize(): void {
    // 監聽 AI 分析完成事件
    const registry = ControllerRegistry.getInstance()
    const aiAgent = registry.getController('AIAgentController')
    
    aiAgent.on('aiAnalysisCompleted', this.handleAIAnalysisCompleted.bind(this))
    aiAgent.on('aiAnalysisError', this.handleAIAnalysisError.bind(this))
  }
  
  private async handleAIAnalysisCompleted(event: AIAnalysisCompletedEvent): Promise<void> {
    await this.executeAction('GENERATE_SUGGESTIONS', {
      behaviorData: event.behaviorData,
      context: { ...event.context, aiAnalysis: event.aiInsights },
      confidence: event.confidence
    })
  }
  
  private async generateSuggestionsAction(payload: {
    behaviorData: BehaviorData
    context: SuggestionContext
    confidence: number
  }): Promise<void> {
    try {
      // 1. 基於 AI 分析結果生成建議
      const suggestions = this.createSuggestionsFromAnalysis(
        payload.context.aiAnalysis,
        payload.behaviorData,
        payload.context
      )
      
      // 2. 應用過濾策略
      const filteredSuggestions = this.applySuggestionFilters(suggestions, payload.confidence)
      
      // 3. 設置優先級和去重
      const prioritizedSuggestions = this.prioritizeAndDedup(filteredSuggestions)
      
      // 4. 加入建議隊列
      prioritizedSuggestions.forEach(suggestion => {
        this.enqueueSuggestion(suggestion)
      })
      
      // 5. 觸發 Toast 顯示
      this.triggerSuggestionDisplay()
      
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    }
  }
  
  private createSuggestionsFromAnalysis(
    analysis: StructuredInsights | null,
    behaviorData: BehaviorData,
    context: SuggestionContext
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    
    if (analysis?.suggestions) {
      // 基於 AI 分析結果創建建議
      analysis.suggestions.forEach(aiSuggestion => {
        const suggestion = this.createSuggestionFromAI(aiSuggestion, context)
        if (suggestion) {
          suggestions.push(suggestion)
        }
      })
    } else {
      // Fallback: 基於行為模式的規則建議
      const ruleBased = this.createRuleBasedSuggestions(behaviorData, context)
      suggestions.push(...ruleBased)
    }
    
    return suggestions
  }
  
  private createSuggestionFromAI(
    aiSuggestion: AISuggestionData,
    context: SuggestionContext
  ): AISuggestion | null {
    const actionMapping: Record<string, string> = {
      bookmark: 'ADD_TO_BOOKMARK',
      summary: 'CREATE_SUMMARY',
      note: 'ADD_NOTE',
      highlight: 'ADD_HIGHLIGHT'
    }
    
    const actionType = actionMapping[aiSuggestion.type]
    if (!actionType) {
      console.warn(`Unknown suggestion type: ${aiSuggestion.type}`)
      return null
    }
    
    return {
      id: generateId(),
      type: aiSuggestion.type as SuggestionType,
      title: this.getSuggestionTitle(aiSuggestion.type),
      description: aiSuggestion.reason,
      actionType,
      actionPayload: this.createActionPayload(aiSuggestion.type, context),
      priority: this.calculatePriority(aiSuggestion.confidence),
      expiresAt: Date.now() + (5 * 60 * 1000), // 5分鐘過期
      metadata: {
        source: 'ai',
        confidence: aiSuggestion.confidence,
        context: context.currentPost?.id
      }
    }
  }
  
  private triggerSuggestionDisplay(): void {
    if (this.suggestionQueue.length === 0) return
    
    const nextSuggestion = this.suggestionQueue.shift()!
    
    // 計算顯示時長（基於優先級）
    const duration = this.calculateDisplayDuration(nextSuggestion.priority)
    
    // 顯示 Toast
    this.showSuggestionToast(nextSuggestion, duration)
  }
  
  private showSuggestionToast(suggestion: AISuggestion, duration: number): void {
    const toastStore = useToastStore.getState()
    
    toastStore.addToast({
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      type: 'suggestion',
      duration,
      actions: [
        {
          label: '執行',
          onClick: () => this.executeSuggestion(suggestion)
        },
        {
          label: '忽略',
          onClick: () => this.ignoreSuggestion(suggestion)
        }
      ]
    })
  }
  
  private async executeSuggestion(suggestion: AISuggestion): Promise<void> {
    try {
      const registry = ControllerRegistry.getInstance()
      
      // 根據建議類型選擇目標 Controller
      const controllerName = this.getControllerForAction(suggestion.actionType)
      
      await registry.executeAction(
        controllerName,
        suggestion.actionType,
        suggestion.actionPayload
      )
      
      // 記錄成功執行
      this.recordSuggestionExecution(suggestion, 'accepted')
      
      // 顯示成功 Toast
      const toastStore = useToastStore.getState()
      toastStore.addToast({
        id: generateId(),
        title: '操作完成',
        description: `已執行：${suggestion.title}`,
        type: 'success',
        duration: 3000
      })
      
    } catch (error) {
      this.recordSuggestionExecution(suggestion, 'failed')
      console.error('Failed to execute suggestion:', error)
    }
  }
}
```

---

## 📊 行為追蹤系統實作

### **1. 行為數據收集**

#### 實現 BehaviorEventCollector

```typescript
// src/services/BehaviorEventCollector.ts
class BehaviorEventCollector {
  private static eventBuffer: BehaviorEvent[] = []
  private static flushTimer: NodeJS.Timeout | null = null
  private static readonly FLUSH_INTERVAL = 30000 // 30秒
  
  static trackEvent(event: Partial<BehaviorEvent>): void {
    const behaviorEvent: BehaviorEvent = {
      id: generateId(),
      type: event.type || 'unknown',
      timestamp: Date.now(),
      data: event.data || {},
      postId: event.postId,
      sessionId: this.getSessionId(),
      userId: event.userId
    }
    
    this.eventBuffer.push(behaviorEvent)
    
    // 定期刷新事件到分析系統
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushEvents()
      }, this.FLUSH_INTERVAL)
    }
  }
  
  private static async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return
    
    const events = [...this.eventBuffer]
    this.eventBuffer = []
    this.flushTimer = null
    
    try {
      // 觸發行為分析
      const registry = ControllerRegistry.getInstance()
      await registry.executeAction('AIAgentController', 'ANALYZE_BEHAVIOR', {
        behaviorData: {
          events,
          sessionId: this.getSessionId(),
          timestamp: Date.now()
        },
        postContext: this.getCurrentPostContext()
      })
    } catch (error) {
      console.error('Failed to flush behavior events:', error)
      // 重新加入 buffer 以免丟失數據
      this.eventBuffer.unshift(...events)
    }
  }
  
  // 特定行為追蹤方法
  static trackScrollEvent(postId: string, scrollPosition: number, scrollDirection: 'up' | 'down'): void {
    this.trackEvent({
      type: 'scroll',
      postId,
      data: {
        position: scrollPosition,
        direction: scrollDirection,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    })
  }
  
  static trackTextSelection(postId: string, selectedText: string, selectionPosition: Position): void {
    this.trackEvent({
      type: 'text_selection',
      postId,
      data: {
        selectedText: selectedText.substring(0, 200), // 限制長度
        textLength: selectedText.length,
        position: selectionPosition
      }
    })
  }
  
  static trackReadingPause(postId: string, pauseDuration: number, position: number): void {
    this.trackEvent({
      type: 'reading_pause',
      postId,
      data: {
        duration: pauseDuration,
        position,
        isLongPause: pauseDuration > 10000 // 10秒以上算長時間停留
      }
    })
  }
}
```

### **2. 整合到 UI 組件**

#### 為文章閱讀頁面添加行為追蹤

```typescript
// src/pages/posts/[id]/index.tsx
function PostDetailPage() {
  const { id } = useParams()
  const { post, isLoading, error } = usePostDetail(id!)
  
  // 行為追蹤
  const trackingRef = useRef<HTMLDivElement>(null)
  const [lastScrollPosition, setLastScrollPosition] = useState(0)
  const [readingStartTime, setReadingStartTime] = useState(Date.now())
  
  // 滾動追蹤
  useEffect(() => {
    if (!post) return
    
    const handleScroll = throttle(() => {
      const currentPosition = window.scrollY
      const direction = currentPosition > lastScrollPosition ? 'down' : 'up'
      
      BehaviorEventCollector.trackScrollEvent(post.id, currentPosition, direction)
      setLastScrollPosition(currentPosition)
    }, 1000) // 1秒間隔
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [post, lastScrollPosition])
  
  // 文字選擇追蹤
  const handleTextSelection = useCallback(() => {
    if (!post) return
    
    const selection = window.getSelection()
    if (selection && selection.toString().length > 3) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      BehaviorEventCollector.trackTextSelection(post.id, selection.toString(), {
        x: rect.left,
        y: rect.top
      })
    }
  }, [post])
  
  // 閱讀時間追蹤
  useEffect(() => {
    if (!post) return
    
    setReadingStartTime(Date.now())
    
    return () => {
      const readingTime = Date.now() - readingStartTime
      BehaviorEventCollector.trackEvent({
        type: 'reading_session',
        postId: post.id,
        data: {
          duration: readingTime,
          completed: true
        }
      })
    }
  }, [post, readingStartTime])
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!post) return <NotFound />
  
  return (
    <div ref={trackingRef} onMouseUp={handleTextSelection}>
      <PostContent post={post} />
      <CommentSection postId={post.id} />
      
      {/* AI 建議 Toast 會自動顯示 */}
    </div>
  )
}
```

---

## 🧪 測試 AI 功能

### **1. 測試 AgentCommand**

```typescript
// src/ai-agent/commands/__tests__/AddBookmarkCommand.test.ts
describe('AddBookmarkCommand', () => {
  it('should execute bookmark addition correctly', async () => {
    const mockRegistry = {
      executeAction: jest.fn().mockResolvedValue(undefined)
    }
    ControllerRegistry.getInstance = jest.fn().mockReturnValue(mockRegistry)
    
    const command = new AddBookmarkCommand({ postId: 'post-123', note: 'Important' })
    
    const mockPolicy: ApplyPolicy = async (cmd, execute) => {
      await execute()
    }
    
    await command.apply(mockPolicy)
    
    expect(mockRegistry.executeAction).toHaveBeenCalledWith(
      'PostController',
      'ADD_TO_BOOKMARK',
      { id: 'post-123', note: 'Important' }
    )
  })
  
  it('should provide human readable description', () => {
    const command = new AddBookmarkCommand({ postId: 'post-123', note: 'Important' })
    expect(command.toHumanReadable()).toBe('將文章加入書籤: Important')
  })
})
```

### **2. 測試 AI 分析功能**

```typescript
// src/controllers/__tests__/AIAgentController.test.ts
describe('AIAgentController', () => {
  it('should analyze behavior and emit events', async () => {
    const controller = new AIAgentController()
    const mockBehaviorData: BehaviorData = {
      events: [
        { type: 'scroll', timestamp: Date.now() - 5000 },
        { type: 'scroll', timestamp: Date.now() - 3000 },
        { type: 'text_selection', timestamp: Date.now() }
      ],
      sessionId: 'session-123'
    }
    
    const eventSpy = jest.fn()
    controller.on('aiAnalysisCompleted', eventSpy)
    
    await controller.executeAction('ANALYZE_BEHAVIOR', {
      behaviorData: mockBehaviorData,
      postContext: { currentPost: { id: 'post-123' } }
    })
    
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        behaviorData: mockBehaviorData,
        source: expect.stringMatching(/llm|rule_based/)
      })
    )
  })
})
```

---

💡 **核心理念**: AI 功能應該無縫整合到現有架構中，通過事件驅動的方式實現 Controller 間通訊，保持系統的可維護性和可測試性。