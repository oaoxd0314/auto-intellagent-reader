# 控制器架構實作規格 - AI Agent 輔助系統

## 🎯 目標功能

基於用戶行為分析的 AI 建議系統，提供智能化的閱讀輔助功能。

1. **Event Tracker** - 用戶行為追蹤和分析
2. **Agent Controller** - 基於行為的智能建議生成
3. **Suggestion Controller** - 建議展示和用戶決策處理
4. **Action Executor** - 執行用戶接受的建議

## 📋 功能清單

### Phase 2: AI 輔助系統 🤖
- [ ] **行為追蹤系統**
  - [ ] 滾動行為追蹤
  - [ ] 停留時間分析
  - [ ] 文本選擇檢測
  - [ ] 退出行為記錄
- [ ] **智能建議系統**
  - [ ] 規則引擎
  - [ ] 建議生成邏輯
  - [ ] 用戶偏好學習
- [ ] **建議 UI 系統**
  - [ ] 右下角提示組件
  - [ ] Accept/Reject 機制
  - [ ] 建議歷史記錄

## 🏗️ 技術架構

### 資料流架構
```
User Behavior → EventTracker → AgentController → SuggestionController → ActionExecutor
     ↓              ↓              ↓                ↓                    ↓
   用戶行為        行為分析        建議生成          UI展示              執行動作
```

### 1. 事件追蹤控制器
**核心功能：** 追蹤和分析用戶閱讀行為

```typescript
// src/controllers/EventTracker.ts
interface UserEvent {
  type: 'scroll' | 'pause' | 'click' | 'select' | 'exit'
  timestamp: number
  context: {
    postId: string
    position: number      // 滾動位置或點擊位置
    duration?: number     // 停留時間
    selectedText?: string // 選中的文本
    elementId?: string    // 相關元素ID
  }
}

interface BehaviorSummary {
  totalTime: number
  scrollDepth: number
  pauseCount: number
  selectionCount: number
  engagementScore: number
}

class EventTracker extends AbstractController {
  // 行為追蹤
  trackScroll(position: number): void
  trackPause(duration: number): void
  trackTextSelection(text: string, elementId?: string): void
  trackClick(elementId: string): void
  trackExit(): void
  
  // 數據分析
  getBehaviorSummary(): BehaviorSummary
  getEvents(): UserEvent[]
  
  // 自動追蹤
  startTracking(): void
  stopTracking(): void
}
```

### 2. Agent 控制器
**核心功能：** 基於行為數據生成智能建議

```typescript
// src/controllers/AgentController.ts
interface Suggestion {
  id: string
  type: 'bookmark' | 'note' | 'summary' | 'related' | 'break'
  title: string
  description: string
  confidence: number    // 0-1 建議信心度
  priority: number      // 1-5 優先級
  action: () => Promise<void>
  metadata?: Record<string, any>
}

interface SuggestionRule {
  name: string
  condition: (events: UserEvent[], summary: BehaviorSummary) => boolean
  generator: (events: UserEvent[], summary: BehaviorSummary) => Suggestion
  cooldown: number      // 冷卻時間（毫秒）
}

class AgentController extends AbstractController {
  private rules: SuggestionRule[]
  private lastSuggestions: Map<string, number>
  
  // 建議生成
  analyzeBehavior(events: UserEvent[], summary: BehaviorSummary): Promise<Suggestion[]>
  
  // 規則管理
  addRule(rule: SuggestionRule): void
  removeRule(name: string): void
  
  // 內建規則
  private createBookmarkRule(): SuggestionRule
  private createNoteRule(): SuggestionRule
  private createSummaryRule(): SuggestionRule
  private createBreakRule(): SuggestionRule
  
  // 學習機制
  updatePreferences(suggestionId: string, accepted: boolean): void
  getPreferences(): Record<string, number>
}
```

### 3. 建議控制器
**核心功能：** 管理建議的展示和用戶決策

```typescript
// src/controllers/SuggestionController.ts
interface SuggestionState {
  activeSuggestion: Suggestion | null
  isVisible: boolean
  position: { x: number; y: number }
  history: SuggestionHistory[]
  queue: Suggestion[]
}

interface SuggestionHistory {
  suggestion: Suggestion
  timestamp: number
  decision: 'accepted' | 'rejected' | 'ignored'
  executionResult?: 'success' | 'error'
}

class SuggestionController extends AbstractController<SuggestionState> {
  // 建議展示
  showSuggestion(suggestion: Suggestion): void
  hideSuggestion(): void
  queueSuggestion(suggestion: Suggestion): void
  
  // 用戶決策
  acceptSuggestion(): Promise<void>
  rejectSuggestion(): void
  ignoreSuggestion(): void
  
  // 歷史管理
  getHistory(): SuggestionHistory[]
  clearHistory(): void
  
  // 佇列管理
  processQueue(): void
  clearQueue(): void
}
```

### 4. 動作執行器
**核心功能：** 執行用戶接受的建議

```typescript
// src/controllers/ActionExecutor.ts
interface ActionResult {
  success: boolean
  message?: string
  data?: any
}

class ActionExecutor extends AbstractController {
  // 動作執行
  executeBookmark(postId: string): Promise<ActionResult>
  executeNote(postId: string, selectedText?: string): Promise<ActionResult>
  executeSummary(postId: string): Promise<ActionResult>
  executeBreak(): Promise<ActionResult>
  
  // 通用執行器
  execute(action: () => Promise<void>): Promise<ActionResult>
  
  // 結果處理
  handleSuccess(result: ActionResult): void
  handleError(error: Error): void
}
```

## 🔧 服務層設計

### 1. 行為數據服務
```typescript
// src/services/BehaviorService.ts
interface BehaviorData {
  postId: string
  events: UserEvent[]
  summary: BehaviorSummary
  suggestions: SuggestionHistory[]
  preferences: Record<string, number>
  lastUpdated: number
}

class BehaviorService {
  static async saveBehavior(data: BehaviorData): Promise<void>
  static async loadBehavior(postId: string): Promise<BehaviorData | null>
  static async updatePreferences(preferences: Record<string, number>): Promise<void>
  static async getGlobalPreferences(): Promise<Record<string, number>>
}
```

### 2. 建議服務
```typescript
// src/services/SuggestionService.ts
class SuggestionService {
  static async logSuggestion(suggestion: Suggestion, decision: string): Promise<void>
  static async getSuggestionStats(): Promise<Record<string, number>>
  static async getEffectiveRules(): Promise<SuggestionRule[]>
}
```

## 📦 UI 組件設計

### 1. 建議提示組件
```typescript
// src/components/SuggestionHint.tsx
interface SuggestionHintProps {
  suggestion: Suggestion | null
  isVisible: boolean
  onAccept: () => void
  onReject: () => void
  onIgnore: () => void
}

export function SuggestionHint(props: SuggestionHintProps): JSX.Element
```

### 2. 建議歷史組件
```typescript
// src/components/SuggestionHistory.tsx
interface SuggestionHistoryProps {
  history: SuggestionHistory[]
  onClear: () => void
}

export function SuggestionHistory(props: SuggestionHistoryProps): JSX.Element
```

## 🗂️ 數據存儲設計

### LocalStorage 結構
```typescript
interface StorageSchema {
  // 行為數據
  'behavior:{postId}': BehaviorData
  
  // 全局偏好
  'preferences:global': Record<string, number>
  
  // 建議統計
  'suggestions:stats': Record<string, number>
}
```

## 📋 實作清單

### Phase 2.1: 基礎架構 🏗️
- [ ] 創建 `src/controllers/` 目錄
- [ ] 實作 `AbstractController` 基類
- [ ] 建立事件系統和狀態管理
- [ ] 創建基礎類型定義

### Phase 2.2: 行為追蹤 📊
- [ ] 實作 `EventTracker` 控制器
- [ ] 添加滾動、停留、選擇追蹤
- [ ] 實作 `BehaviorService` 存儲邏輯
- [ ] 行為數據分析算法

### Phase 2.3: 建議系統 🤖
- [ ] 實作 `AgentController` 控制器
- [ ] 創建基本建議規則
- [ ] 實作 `SuggestionService`
- [ ] 用戶偏好學習機制

### Phase 2.4: 建議 UI 💡
- [ ] 實作 `SuggestionController`
- [ ] 創建 `SuggestionHint` 組件
- [ ] Accept/Reject 機制
- [ ] 建議佇列管理

### Phase 2.5: 動作執行 ⚡
- [ ] 實作 `ActionExecutor`
- [ ] 各種建議動作實現
- [ ] 結果反饋機制
- [ ] 錯誤處理

### Phase 2.6: 整合測試 🧪
- [ ] 控制器協調測試
- [ ] 建議品質測試
- [ ] 用戶體驗測試
- [ ] 性能優化

## 🎯 建議規則範例

### 1. 收藏建議
```typescript
const bookmarkRule: SuggestionRule = {
  name: 'bookmark',
  condition: (events, summary) => {
    return summary.totalTime > 300000 && // 5分鐘以上
           summary.scrollDepth > 0.8 &&  // 滾動超過80%
           summary.engagementScore > 0.7  // 高參與度
  },
  generator: (events, summary) => ({
    id: `bookmark-${Date.now()}`,
    type: 'bookmark',
    title: '收藏這篇文章',
    description: '你似乎對這篇文章很感興趣，要收藏起來嗎？',
    confidence: 0.8,
    priority: 3,
    action: async () => {
      // 執行收藏邏輯
    }
  }),
  cooldown: 600000 // 10分鐘冷卻
}
```

### 2. 筆記建議
```typescript
const noteRule: SuggestionRule = {
  name: 'note',
  condition: (events, summary) => {
    return summary.selectionCount > 2 && // 選擇過文本
           events.some(e => e.type === 'select')
  },
  generator: (events, summary) => {
    const lastSelection = events
      .filter(e => e.type === 'select')
      .pop()
    
    return {
      id: `note-${Date.now()}`,
      type: 'note',
      title: '記錄重點',
      description: '要為選中的內容做筆記嗎？',
      confidence: 0.9,
      priority: 4,
      action: async () => {
        // 執行筆記邏輯
      },
      metadata: { selectedText: lastSelection?.context.selectedText }
    }
  },
  cooldown: 300000 // 5分鐘冷卻
}
```

## 🔮 擴展規劃

### 短期擴展
- 更多建議類型（相關文章、總結等）
- 建議品質改進算法
- 用戶自定義規則

### 中期擴展
- 跨文章行為分析
- 個人化建議模型
- 協作建議功能

### 長期擴展
- AI 模型整合
- 雲端數據同步
- 多平台支持 