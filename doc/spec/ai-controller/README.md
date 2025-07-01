# AI Agent 控制器實作規格

## 🎯 目標功能

本規格定義了新一代 AI Agent 控制器的完整架構，包含：

1. **Background SSE Agent** - 持續運行的智能代理
2. **OpenRouter API 整合** - 大語言模型服務串接
3. **Observer Data Pipeline** - 用戶行為數據收集管道
4. **Message Queue System** - 智能建議訊息佇列
5. **Context Event Integration** - 上下文事件整合

## 📋 核心功能清單

### 階段 1: Background AI Agent 基礎建立 🚀
- [ ] **AIAgent Context 創建**
  - [ ] 連線狀態管理
  - [ ] 事件監聽機制
  - [ ] 錯誤處理和恢復
- [ ] **OpenRouter API 整合**
  - [ ] API 金鑰配置
  - [ ] SSE 連線建立
  - [ ] 串流數據處理
- [ ] **基礎事件監聽**
  - [ ] Context 事件訂閱
  - [ ] 事件數據打包
  - [ ] 實時數據傳輸

### 階段 2: 事件觸發頻率測試 📊
- [ ] **觸發頻率分析**
  - [ ] 事件頻率監控
  - [ ] 高價值事件識別
  - [ ] 過濾規則建立
- [ ] **AI 反應測試**
  - [ ] 回應合理性評估
  - [ ] 敏感度參數調整
  - [ ] 基線性能建立

### 階段 3: LLM Event Queue & Toast UI 🎨
- [ ] **Message Queue 系統**
  - [ ] 訊息佇列管理
  - [ ] 優先級排序
  - [ ] 頻率控制機制
- [ ] **Toast Queue UI**
  - [ ] shadcn Toast 整合
  - [ ] 多 Toast 疊加顯示
  - [ ] 用戶交互處理

## 🏗️ 系統架構

### 整體架構圖
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Actions  │───▶│  Context Events  │───▶│  AI Agent Core  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Observer System │    │ Event Pipeline   │    │ OpenRouter API  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Data Analysis  │    │ Message Queue    │    │  Toast Queue    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 數據流向
```
User Interaction
       ↓
Context Events (BehaviorContext, InteractionContext, PostContext)
       ↓
Event Observer & Data Pipeline
       ↓
AI Agent Processing (OpenRouter)
       ↓
Message Queue System
       ↓
Toast Queue UI
       ↓
User Action Execution
```

## 🤖 AIAgent Context 詳細規格

### Context 狀態介面
```typescript
interface AIAgentState {
  // 連線管理
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastHeartbeat: number
  reconnectAttempts: number
  maxReconnectAttempts: number
  
  // 訊息佇列
  messageQueue: AIMessage[]
  activeToasts: ToastMessage[]
  queueLength: number
  maxQueueSize: number
  
  // 上下文資訊
  context: {
    currentBehavior: BehaviorData
    recentInteractions: InteractionData[]
    userPatterns: UserPatternData
    pageState: PageState
    availableActions: ContextAction[]
  }
  
  // 效能監控
  performance: {
    averageResponseTime: number
    totalRequests: number
    successRate: number
    errorCount: number
  }
  
  // 設定
  settings: {
    maxQueueSize: number
    suggestionFrequency: 'low' | 'medium' | 'high'
    enabledStrategies: string[]
    languagePreference: string
    autoHideDelay: number
    maxVisibleToasts: number
  }
}
```

### Context Actions
```typescript
interface AIAgentActions {
  // 連線控制
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  reconnect: () => Promise<void>
  
  // 訊息管理
  sendMessage: (message: string, context: any) => Promise<void>
  addToQueue: (message: AIMessage) => void
  processQueue: () => Promise<void>
  clearQueue: () => void
  
  // Toast 管理
  showToast: (message: AIMessage) => void
  hideToast: (messageId: string) => void
  executeAction: (message: AIMessage) => Promise<void>
  
  // 設定管理
  updateSettings: (settings: Partial<AIAgentSettings>) => void
  resetSettings: () => void
  
  // 事件處理
  handleContextEvent: (eventName: string, payload: any) => void
  subscribeToContext: (contextName: string) => void
  unsubscribeFromContext: (contextName: string) => void
}
```

## 🔌 OpenRouter API 整合

### API 配置
```typescript
interface OpenRouterConfig {
  apiKey: string
  baseURL: string
  model: string
  temperature: number
  maxTokens: number
  streamEnabled: boolean
  timeout: number
  retryAttempts: number
}

interface OpenRouterClient {
  // 基礎方法
  initialize: (config: OpenRouterConfig) => Promise<void>
  destroy: () => Promise<void>
  
  // 串流方法
  createStream: (prompt: string, context: any) => Promise<ReadableStream>
  sendMessage: (message: string, context: any) => Promise<string>
  
  // 事件處理
  onMessage: (callback: (message: string) => void) => void
  onError: (callback: (error: Error) => void) => void
  onConnect: (callback: () => void) => void
  onDisconnect: (callback: () => void) => void
}
```

### SSE 連線管理
```typescript
class SSEConnectionManager {
  private connection: EventSource | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  
  async connect(url: string, options: SSEOptions): Promise<void>
  async disconnect(): Promise<void>
  async reconnect(): Promise<void>
  
  private startHeartbeat(): void
  private handleConnectionError(error: Event): void
  private handleMessage(event: MessageEvent): void
}
```

## 📊 Observer Data Pipeline

### Frame 級別追蹤
```typescript
interface FrameObserver {
  // 停留時間追蹤
  trackDwellTime: (element: HTMLElement) => Observable<DwellTimeData>
  
  // 懸停和選擇追蹤
  trackHoverSections: () => Observable<HoverData[]>
  trackSelectedSections: () => Observable<SelectionData[]>
  
  // 滾動和活躍元素
  trackScrollDepth: () => Observable<ScrollData>
  trackActiveElements: () => Observable<ActiveElementData[]>
  
  // 注意力分析
  calculateAttentionScore: (data: FrameEventData) => number
  identifyReadingPattern: (data: FrameEventData) => ReadingPattern
}

interface FrameEventData {
  dwellTime: number
  hoveredSections: string[]
  selectedSections: string[]
  scrollDepth: number
  activeElements: ActiveElementData[]
  attentionScore: number
  readingPattern: 'scanning' | 'reading' | 'studying' | 'skimming'
  timestamp: number
  sessionId: string
}
```

### 用戶模式追蹤
```typescript
interface UserPatternTracker {
  // 標籤偏好分析
  analyzeTagPreferences: () => TagPreferenceData[]
  
  // 評論模式識別
  analyzeCommentPatterns: () => CommentPatternData[]
  
  // 互動行為統計
  analyzeInteractionActions: () => InteractionActionData[]
  
  // 閱讀習慣建檔
  analyzeReadingHabits: () => ReadingHabitsData
  
  // 模式預測
  predictUserBehavior: (context: any) => BehaviorPrediction
}

interface UserPatternData {
  tagPreferences: TagPreferenceData[]
  commentPatterns: CommentPatternData[]
  interactionActions: InteractionActionData[]
  readingHabits: ReadingHabitsData
  lastUpdated: number
  dataVersion: string
}
```

## 📨 Message Queue System

### 佇列管理
```typescript
interface MessageQueue {
  // 基礎操作
  enqueue: (message: AIMessage) => void
  dequeue: () => AIMessage | null
  peek: () => AIMessage | null
  clear: () => void
  
  // 排序和過濾
  prioritize: () => void
  filter: (predicate: (message: AIMessage) => boolean) => AIMessage[]
  
  // 狀態查詢
  size: () => number
  isEmpty: () => boolean
  isFull: () => boolean
  
  // 事件
  onEnqueue: (callback: (message: AIMessage) => void) => void
  onDequeue: (callback: (message: AIMessage) => void) => void
  onFull: (callback: () => void) => void
}

interface QueueProcessor {
  // 處理邏輯
  process: () => Promise<void>
  processMessage: (message: AIMessage) => Promise<void>
  
  // 頻率控制
  setProcessingRate: (messagesPerSecond: number) => void
  pause: () => void
  resume: () => void
  
  // 批次處理
  processBatch: (batchSize: number) => Promise<void>
}
```

### AI 訊息結構
```typescript
interface AIMessage {
  // 基本資訊
  id: string
  type: 'suggestion' | 'recommendation' | 'reminder' | 'tip' | 'warning'
  title: string
  content: string
  
  // 上下文整合
  contextEvent: string        // 對應的 Context Event 名稱
  contextName: string         // Context 名稱
  payload: any               // 動態 payload
  
  // 動作按鈕
  actionButton: {
    label: string
    action: () => Promise<void>
    confirmRequired: boolean
    destructive: boolean
  }
  
  // 優先級和時間
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: number
  expiresAt?: number
  processingDelay?: number
  
  // 分類和標籤
  category: string
  tags: string[]
  
  // 元數據
  metadata: {
    confidence: number        // AI 建議信心度 (0-1)
    relevanceScore: number    // 相關性分數 (0-1)
    userContext: string       // 用戶當前情境描述
    triggerEvent: string      // 觸發事件
    expectedOutcome: string   // 預期結果
  }
  
  // 追蹤資訊
  tracking: {
    shown: boolean
    clicked: boolean
    dismissed: boolean
    shownAt?: number
    clickedAt?: number
    dismissedAt?: number
  }
}
```

## 🎨 Toast Queue UI 系統

### Toast 組件架構
```typescript
interface ToastQueue {
  // 狀態管理
  messages: ToastMessage[]
  activeCount: number
  maxVisible: number
  
  // 顯示控制
  show: (message: AIMessage) => void
  hide: (messageId: string) => void
  hideAll: () => void
  
  // 佈局管理
  reposition: () => void
  calculatePositions: () => ToastPosition[]
  
  // 動畫控制
  animateIn: (messageId: string) => Promise<void>
  animateOut: (messageId: string) => Promise<void>
  animateStack: () => Promise<void>
}

interface ToastMessage extends AIMessage {
  // UI 狀態
  isVisible: boolean
  isExpanded: boolean
  zIndex: number
  
  // 動畫狀態
  animationState: 'entering' | 'visible' | 'exiting'
  animationProgress: number
  
  // 用戶互動
  hasBeenSeen: boolean
  interactionCount: number
  hoverTime: number
  
  // 佈局資訊
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  
  // 樣式
  theme: 'light' | 'dark' | 'auto'
  variant: 'default' | 'info' | 'success' | 'warning' | 'error'
}
```

### 佈局和動畫
```typescript
interface ToastLayoutManager {
  // 位置計算
  calculateStackPositions: (messages: ToastMessage[]) => ToastPosition[]
  getOptimalPosition: (message: ToastMessage) => ToastPosition
  checkCollision: (pos1: ToastPosition, pos2: ToastPosition) => boolean
  
  // 動畫管理
  createEnterAnimation: (message: ToastMessage) => Animation
  createExitAnimation: (message: ToastMessage) => Animation
  createStackAnimation: (messages: ToastMessage[]) => Animation[]
  
  // 響應式處理
  handleResize: () => void
  updateViewport: (viewport: ViewportSize) => void
}

interface ToastPosition {
  x: number
  y: number
  width: number
  height: number
  stackIndex: number
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
```

## 🔗 Context Event 整合

### Event Registry
```typescript
interface ContextEventRegistry {
  // 註冊 Context
  registerContext: (name: string, context: any) => void
  unregisterContext: (name: string) => void
  
  // 事件監聽
  subscribeToEvent: (contextName: string, eventName: string, callback: Function) => void
  unsubscribeFromEvent: (contextName: string, eventName: string, callback: Function) => void
  
  // 事件發射
  emitEvent: (contextName: string, eventName: string, payload: any) => Promise<void>
  
  // 批次操作
  subscribeToMultiple: (subscriptions: EventSubscription[]) => void
  emitMultiple: (events: EventEmission[]) => Promise<void>
  
  // 查詢
  getAvailableEvents: (contextName: string) => string[]
  getSubscribers: (contextName: string, eventName: string) => Function[]
}
```

### Context Actions 定義
```typescript
interface ContextActionDefinitions {
  BehaviorContext: {
    // 追蹤控制
    startTracking: {
      params: { postId: string }
      returns: Promise<void>
      description: "開始追蹤用戶行為"
    }
    stopTracking: {
      params: {}
      returns: Promise<void>
      description: "停止追蹤用戶行為"
    }
    addEvent: {
      params: { event: UserEvent }
      returns: Promise<void>
      description: "添加用戶事件"
    }
    executeSuggestion: {
      params: { suggestion: Suggestion }
      returns: Promise<void>
      description: "執行 AI 建議"
    }
  }
  
  InteractionContext: {
    // 互動操作
    addInteraction: {
      params: { interaction: PostInteraction }
      returns: Promise<void>
      description: "新增用戶互動"
    }
    highlightSection: {
      params: { sectionId: string, note?: string }
      returns: Promise<void>
      description: "高亮文章段落"
    }
    addComment: {
      params: { content: string, sectionId: string }
      returns: Promise<void>
      description: "添加評論"
    }
  }
  
  PostContext: {
    // 導航控制
    setCurrentPost: {
      params: { post: Post }
      returns: Promise<void>
      description: "設置當前文章"
    }
    setSelectedTag: {
      params: { tag: string | null }
      returns: void
      description: "選擇文章標籤"
    }
    recommendPost: {
      params: { post: Post, reason: string }
      returns: Promise<void>
      description: "推薦相關文章"
    }
  }
}
```

## 📈 效能監控和優化

### 效能指標
```typescript
interface PerformanceMetrics {
  // 連線效能
  connectionLatency: number
  reconnectionCount: number
  connectionUptime: number
  
  // AI 回應效能
  averageResponseTime: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  
  // 佇列效能
  averageQueueSize: number
  maxQueueSize: number
  processedMessages: number
  droppedMessages: number
  
  // UI 效能
  toastRenderTime: number
  animationFrameRate: number
  memoryUsage: number
  
  // 用戶體驗指標
  suggestionAcceptanceRate: number
  averageInteractionTime: number
  userSatisfactionScore: number
}
```

### 優化策略
```typescript
interface OptimizationStrategies {
  // 連線優化
  connectionPooling: boolean
  requestBatching: boolean
  compressionEnabled: boolean
  
  // 佇列優化
  queueCompression: boolean
  messageDeduplication: boolean
  priorityBasedProcessing: boolean
  
  // UI 優化
  virtualizedToasts: boolean
  animationOptimization: boolean
  lazyRendering: boolean
  
  // 記憶體優化
  messageGarbageCollection: boolean
  contextDataCaching: boolean
  automaticCleanup: boolean
}
```

## 🔒 安全性和權限控制

### 安全配置
```typescript
interface SecurityConfig {
  // API 安全
  apiKeyEncryption: boolean
  requestSigning: boolean
  rateLimiting: {
    enabled: boolean
    requestsPerMinute: number
    burstLimit: number
  }
  
  // 資料安全
  dataEncryption: boolean
  localStorageEncryption: boolean
  sensitiveDataRedaction: boolean
  
  // 權限控制
  contextPermissions: {
    [contextName: string]: {
      read: boolean
      write: boolean
      execute: boolean
    }
  }
  
  // 審計
  auditLogging: boolean
  actionTracking: boolean
  errorReporting: boolean
}
```

### 權限檢查
```typescript
interface PermissionChecker {
  // Context 權限
  canAccessContext: (contextName: string, action: string) => boolean
  canExecuteAction: (contextName: string, actionName: string) => boolean
  
  // 資料權限
  canReadData: (dataType: string) => boolean
  canWriteData: (dataType: string) => boolean
  
  // UI 權限
  canShowToast: (messageType: string) => boolean
  canExecuteUIAction: (actionType: string) => boolean
  
  // 動態權限
  requestPermission: (permission: string) => Promise<boolean>
  revokePermission: (permission: string) => Promise<void>
}
```

## 🧪 測試策略

### 單元測試
```typescript
interface TestSuites {
  // AI Agent 測試
  aiAgentTests: {
    connectionTests: Test[]
    messageProcessingTests: Test[]
    errorHandlingTests: Test[]
  }
  
  // OpenRouter 整合測試
  openRouterTests: {
    apiIntegrationTests: Test[]
    streamingTests: Test[]
    authenticationTests: Test[]
  }
  
  // 佇列系統測試
  queueTests: {
    messageQueueTests: Test[]
    prioritizationTests: Test[]
    concurrencyTests: Test[]
  }
  
  // UI 組件測試
  uiTests: {
    toastComponentTests: Test[]
    animationTests: Test[]
    interactionTests: Test[]
  }
}
```

### 整合測試
```typescript
interface IntegrationTests {
  // 端到端測試
  e2eTests: {
    userJourneyTests: Test[]
    crossContextTests: Test[]
    performanceTests: Test[]
  }
  
  // 負載測試
  loadTests: {
    highVolumeMessageTests: Test[]
    concurrentUserTests: Test[]
    stressTests: Test[]
  }
  
  // 兼容性測試
  compatibilityTests: {
    browserCompatibilityTests: Test[]
    deviceCompatibilityTests: Test[]
    versionCompatibilityTests: Test[]
  }
}
```

## 📚 實作指南

### 開發流程
1. **階段 1: 基礎建立**
   - 創建 AIAgent Context
   - 實作 OpenRouter 整合
   - 建立基礎事件監聽

2. **階段 2: 頻率測試**
   - 部署事件監控
   - 收集頻率數據
   - 調整過濾規則

3. **階段 3: UI 實作**
   - 開發 Message Queue
   - 實作 Toast UI
   - 整合用戶交互

4. **階段 4: 事件整合**
   - 完善 Context 整合
   - 實作動態 Actions
   - 測試可執行性

5. **階段 5: 成熟度驗證**
   - 完整功能測試
   - 性能優化
   - 用戶體驗驗證

### 最佳實踐
- **漸進式開發：** 分階段實作，每階段都有明確目標
- **測試驅動：** 先寫測試，再實作功能
- **性能優先：** 從一開始就考慮性能優化
- **用戶體驗：** 以用戶體驗為核心設計決策
- **安全第一：** 每個功能都要考慮安全性影響

---

**文檔版本：** v2.0  
**最後更新：** 2024年12月  
**維護者：** AI Agent 開發團隊 