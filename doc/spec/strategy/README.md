# 建議策略實作規格

## 🎯 目標功能

1. **Agent Helper Sidebar** - 智能助手側邊欄
2. **Core Strategies** - 核心建議策略實現
3. **Context-Aware Suggestions** - 上下文感知建議
4. **LLM Integration** - Local LLM 整合和 Entry Point

## 📋 功能清單

### Phase 4: 建議策略 🧠
- [ ] **核心策略實現**
  - [ ] BookmarkStrategy (書籤建議)
  - [ ] RelatedArticleStrategy (相關文章)
  - [ ] ShareableQuoteStrategy (可分享佳句)
  - [ ] ReadingProgressStrategy (閱讀進度)
- [ ] **策略管理系統**
  - [ ] 動態策略切換
  - [ ] 策略權重調整
  - [ ] A/B 測試支援

## 🏗️ 技術架構

### 資料流架構
```
Context → Strategy Engine → Agent Helper → UI Actions → Controller Integration
     ↓            ↓               ↓              ↓              ↓
  行為數據      策略選擇        智能建議        用戶交互      執行操作
```

## 🤖 Agent Helper 側邊欄

### 1. 主要組件設計
```typescript
// src/components/AgentHelper/AgentHelper.tsx
interface AgentHelperProps {
  isOpen: boolean
  onToggle: () => void
  context: Context
  suggestions: Suggestion[]
}

interface Suggestion {
  id: string
  type: 'bookmark' | 'related' | 'quote' | 'progress' | 'explanation'
  title: string
  content: string
  confidence: number
  timestamp: number
  actions: SuggestionAction[]
}

interface SuggestionAction {
  label: string
  type: 'highlight' | 'comment' | 'share' | 'bookmark' | 'navigate'
  handler: () => void
  icon?: string
}

export function AgentHelper(props: AgentHelperProps) {
  // 渲染建議列表
  // 處理用戶交互
  // 整合控制器操作
}
```

### 2. 側邊欄狀態管理
```typescript
// src/contexts/AgentContext.tsx
interface AgentState {
  isOpen: boolean
  suggestions: Suggestion[]
  activeStrategy: string[]
  isProcessing: boolean
  lastUpdate: number
  userFeedback: Map<string, 'positive' | 'negative' | 'neutral'>
}

interface AgentContextType {
  state: AgentState
  actions: {
    toggleSidebar: () => void
    addSuggestion: (suggestion: Suggestion) => void
    removeSuggestion: (id: string) => void
    provideFeedback: (id: string, feedback: 'positive' | 'negative') => void
    executeAction: (suggestionId: string, actionType: string) => void
    refreshSuggestions: () => void
  }
}

export function AgentProvider({ children }: { children: React.ReactNode })
export function useAgent(): AgentContextType
```

## 🎯 核心策略實現

### 1. 抽象策略基類
```typescript
// src/strategies/AbstractStrategy.ts
abstract class AbstractStrategy {
  protected name: string
  protected priority: number
  protected enabled: boolean = true
  protected cooldownMs: number = 30000 // 30秒
  protected lastExecuted: number = 0
  
  abstract canExecute(context: Context): boolean
  abstract execute(context: Context): Promise<Suggestion[]>
  abstract getConfig(): StrategyConfig
  
  // 通用方法
  isInCooldown(): boolean
  updateLastExecuted(): void
  setEnabled(enabled: boolean): void
  setPriority(priority: number): void
}
```

### 2. 書籤建議策略
```typescript
// src/strategies/BookmarkStrategy.ts
class BookmarkStrategy extends AbstractStrategy {
  canExecute(context: Context): boolean {
    const { behaviorPattern, contentContext } = context
    
    return (
      behaviorPattern.readingStyle === 'deep' &&
      contentContext.readingProgress > 0.3 &&
      behaviorPattern.currentFocus.duration > 30000
    )
  }
  
  async execute(context: Context): Promise<Suggestion[]> {
    // 分析重要段落並生成書籤建議
    const importantSections = this.identifyImportantSections(context)
    return this.generateBookmarkSuggestions(importantSections)
  }
}
```

### 3. LLM 整合服務
```typescript
// src/services/LLMService.ts
interface LLMConfig {
  endpoint: string
  model: string
  maxTokens: number
  temperature: number
}

class LLMService {
  async generateSuggestion(context: Context, type: string): Promise<LLMResponse>
  async explainContent(content: string, context: Context): Promise<LLMResponse>
  async findRelatedTopics(content: string, interests: string[]): Promise<string[]>
  async summarizeReading(context: Context): Promise<string>
}
```

## 📋 實作清單

### Phase 4.1: 側邊欄基礎 🎨
- [ ] 創建 `src/components/AgentHelper/` 目錄
- [ ] 實作 `AgentHelper` 主組件
- [ ] 實作 `AgentContext` 狀態管理
- [ ] 創建基礎 UI 組件

### Phase 4.2: 核心策略實現 🎯
- [ ] 創建 `src/strategies/` 目錄
- [ ] 實作 `AbstractStrategy` 基類
- [ ] 實作各種具體策略
- [ ] 整合策略引擎

### Phase 4.3: LLM 整合 🤖
- [ ] 實作 `LLMService`
- [ ] 創建 LLM 配置系統
- [ ] 實作 Prompt 模板
- [ ] 添加多 LLM 支援

### Phase 4.4: 整合優化 🚀
- [ ] 整合所有組件
- [ ] 性能優化
- [ ] 用戶反饋系統
- [ ] 測試和文檔

## 🎯 技術重點

### 1. 上下文感知建議
基於用戶行為動態調整建議內容和時機

### 2. 策略系統
可擴展的策略架構，支援動態加載和配置

### 3. LLM 整合
支援多種 Local LLM，提供統一的接口

### 4. 用戶體驗
非侵入式建議，個性化程度可控

## 🔮 擴展規劃

### 短期
- 更多策略類型
- 建議品質評分
- 用戶偏好學習

### 中期
- 多語言支援
- 協作功能
- 策略分享

### 長期
- AI 策略自動生成
- 跨平台同步
- 開放 API 系統 