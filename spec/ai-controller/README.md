# 智能控制器實作規格

## 🎯 目標功能

1. **Observer Pattern** - 用戶行為監聽系統
2. **ForesightJS Integration** - 鼠標意圖預測整合
3. **Behavior Analytics** - 用戶行為數據收集
4. **Data Pipeline** - 為 Local LLM 準備數據

## 📋 功能清單

### Phase 3: 智能控制器 🤖
- [ ] **行為監聽系統**
  - [ ] 滾動行為分析
  - [ ] 停留時間檢測
  - [ ] 文本選擇追蹤
- [ ] **智能觸發機制**
  - [ ] 條件判斷邏輯
  - [ ] 頻率控制
  - [ ] 相關性評分

## 🏗️ 技術架構

### 資料流架構
```
User Actions → Observers → Controller → Data Collector → LLM Pipeline
     ↓            ↓           ↓              ↓              ↓
  用戶行為      觀察者      智能分析        數據整理      LLM 處理
```

### ForesightJS 整合分析

基於 [ForesightJS 文檔](https://foresightjs.com/llms.txt)，我們可以獲得以下數據：

#### 1. 鼠標預測數據
```typescript
// ForesightJS 提供的數據結構
interface ForesightData {
  // 鼠標軌跡預測
  predictedElement: HTMLElement | null
  confidence: number              // 0-1 預測信心度
  trajectory: {
    x: number
    y: number
    timestamp: number
  }[]
  
  // 預測的交互類型
  intentType: 'hover' | 'click' | 'scroll'
  
  // 元素資訊
  targetInfo: {
    tagName: string
    className: string
    textContent: string
    boundingRect: DOMRect
  }
}
```

#### 2. ForesightJS Hook 實作
```typescript
// src/hooks/useForesight.ts
interface ForesightHookConfig {
  onPrediction: (data: ForesightData) => void
  onHover: (element: HTMLElement) => void
  onClick: (element: HTMLElement) => void
  threshold: number               // 預測觸發閾值
  debounceMs: number             // 防抖時間
}

export function useForesight(config: ForesightHookConfig) {
  // 初始化 ForesightJS
  // 設置事件監聽
  // 返回控制方法
}
```

## 🔍 Observer Pattern 實作

### 1. 抽象觀察者
```typescript
// src/observers/AbstractObserver.ts
abstract class AbstractObserver<T = any> {
  protected isActive: boolean = false
  protected callbacks: ((data: T) => void)[] = []
  
  abstract start(): void
  abstract stop(): void
  abstract cleanup(): void
  
  // 訂閱系統
  subscribe(callback: (data: T) => void): () => void
  unsubscribe(callback: (data: T) => void): void
  
  // 數據發送
  protected notify(data: T): void
}
```

### 2. 滾動行為觀察者
```typescript
// src/observers/ScrollObserver.ts
interface ScrollData {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
  scrollPercent: number
  direction: 'up' | 'down'
  velocity: number
  timestamp: number
  element: HTMLElement
}

class ScrollObserver extends AbstractObserver<ScrollData> {
  private lastScrollTop: number = 0
  private scrollHistory: number[] = []
  
  start(): void {
    // 監聽滾動事件
    // 計算滾動速度和方向
    // 記錄滾動歷史
  }
  
  // 分析方法
  getScrollPattern(): 'reading' | 'scanning' | 'searching'
  getReadingSpeed(): number
  getScrollStops(): { position: number; duration: number }[]
}
```

### 3. 停留時間觀察者
```typescript
// src/observers/DwellTimeObserver.ts
interface DwellData {
  element: HTMLElement
  startTime: number
  endTime: number
  duration: number
  elementType: string
  textContent: string
  position: DOMRect
}

class DwellTimeObserver extends AbstractObserver<DwellData> {
  private activeElements: Map<HTMLElement, number> = new Map()
  private dwellThreshold: number = 1000 // 1秒
  
  start(): void {
    // 監聽鼠標進入/離開事件
    // 計算停留時間
    // 識別重要元素
  }
  
  // 分析方法
  getInterestingElements(): HTMLElement[]
  getAverageReadingTime(): number
  getAttentionHeatmap(): { element: HTMLElement; score: number }[]
}
```

### 4. 文本選擇觀察者
```typescript
// src/observers/SelectionObserver.ts
interface SelectionData {
  selectedText: string
  range: Range
  startContainer: Node
  endContainer: Node
  commonAncestor: Node
  timestamp: number
  selectionType: 'word' | 'sentence' | 'paragraph' | 'custom'
}

class SelectionObserver extends AbstractObserver<SelectionData> {
  private selectionHistory: SelectionData[] = []
  
  start(): void {
    // 監聽文本選擇事件
    // 分析選擇模式
    // 記錄選擇歷史
  }
  
  // 分析方法
  getSelectionPatterns(): 'highlight' | 'copy' | 'research' | 'casual'
  getInterestingQuotes(): string[]
  getTopics(): string[]
}
```

## 🤖 智能控制器

### 1. 主控制器
```typescript
// src/controllers/IntelligentController.ts
interface IntelligentControllerConfig {
  foresightConfig: ForesightHookConfig
  observerConfig: {
    scroll: boolean
    dwellTime: boolean
    selection: boolean
  }
  analysisConfig: {
    minConfidence: number
    dataRetentionMs: number
    batchSize: number
  }
}

class IntelligentController {
  private observers: Map<string, AbstractObserver> = new Map()
  private dataCollector: DataCollector
  private behaviorAnalyzer: BehaviorAnalyzer
  private foresightHook: ReturnType<typeof useForesight>
  
  constructor(config: IntelligentControllerConfig)
  
  // 核心方法
  initialize(): void
  start(): void
  stop(): void
  
  // 數據處理
  processUserBehavior(data: any): void
  analyzeBehaviorPattern(): BehaviorPattern
  generateContext(): Context
}
```

### 2. 行為分析器
```typescript
// src/services/BehaviorAnalyzer.ts
interface BehaviorPattern {
  readingStyle: 'deep' | 'scan' | 'search'
  interests: string[]
  attentionSpan: number
  readingSpeed: number
  interactionPreference: 'mouse' | 'keyboard' | 'mixed'
  currentFocus: {
    section: string
    confidence: number
    duration: number
  }
}

class BehaviorAnalyzer {
  // 行為模式分析
  analyzeScrollPattern(scrollData: ScrollData[]): 'reading' | 'scanning'
  analyzeDwellPattern(dwellData: DwellData[]): 'focused' | 'browsing'
  analyzeSelectionPattern(selectionData: SelectionData[]): 'research' | 'casual'
  
  // 綜合分析
  generateBehaviorProfile(allData: any[]): BehaviorPattern
  predictNextAction(currentData: any): 'scroll' | 'select' | 'comment' | 'leave'
  
  // 相關性評分
  calculateRelevanceScore(content: string, behavior: BehaviorPattern): number
}
```

### 3. 數據收集器
```typescript
// src/services/DataCollector.ts
interface Context {
  // 用戶行為數據
  behaviorPattern: BehaviorPattern
  currentSession: {
    startTime: number
    duration: number
    actionsCount: number
    focusedSections: string[]
  }
  
  // 內容數據
  contentContext: {
    currentPost: {
      id: string
      title: string
      content: string
      sections: string[]
    }
    readingProgress: number
    highlightedText: string[]
    selectedQuotes: string[]
  }
  
  // 交互數據
  interactionContext: {
    mouseTrajectory: ForesightData[]
    scrollPattern: ScrollData[]
    dwellTimes: DwellData[]
    selections: SelectionData[]
  }
  
  // 環境數據
  environmentContext: {
    timestamp: number
    deviceType: 'desktop' | 'tablet' | 'mobile'
    screenSize: { width: number; height: number }
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  }
}

class DataCollector {
  private dataBuffer: any[] = []
  private batchSize: number = 50
  
  // 數據收集
  collect(data: any): void
  flush(): Context
  
  // 數據處理
  processRawData(rawData: any[]): Context
  sanitizeData(data: any): any
  
  // 導出功能
  exportForLLM(): string  // JSON 格式給 LLM
  exportForAnalysis(): any  // 結構化數據
}
```

## 🔧 ForesightJS 整合實作

### 1. ForesightJS Hook
```typescript
// src/hooks/useForesight.ts
import { useEffect, useRef } from 'react'

interface UseForesightOptions {
  threshold?: number
  debounce?: number
  onPrediction?: (data: ForesightData) => void
  onHover?: (element: HTMLElement) => void
  enabled?: boolean
}

export function useForesight(options: UseForesightOptions = {}) {
  const foresightRef = useRef<any>(null)
  
  useEffect(() => {
    // 初始化 ForesightJS
    const foresight = new Foresight({
      threshold: options.threshold || 0.5,
      debounce: options.debounce || 100,
    })
    
    // 設置事件監聽
    foresight.on('prediction', options.onPrediction)
    foresight.on('hover', options.onHover)
    
    foresightRef.current = foresight
    
    if (options.enabled !== false) {
      foresight.start()
    }
    
    return () => {
      foresight.destroy()
    }
  }, [])
  
  return {
    start: () => foresightRef.current?.start(),
    stop: () => foresightRef.current?.stop(),
    getMetrics: () => foresightRef.current?.getMetrics(),
  }
}
```

### 2. ForesightJS 數據處理
```typescript
// src/services/ForesightService.ts
class ForesightService {
  // 數據轉換
  static transformForesightData(rawData: any): ForesightData {
    // 將 ForesightJS 原始數據轉換為我們的格式
  }
  
  // 預測分析
  static analyzePrediction(data: ForesightData): {
    isRelevant: boolean
    actionType: string
    confidence: number
  }
  
  // 元素識別
  static identifyElement(element: HTMLElement): {
    type: 'text' | 'link' | 'button' | 'image' | 'other'
    importance: number
    content: string
  }
}
```

## 📊 智能觸發機制

### 1. 條件判斷引擎
```typescript
// src/services/TriggerEngine.ts
interface TriggerCondition {
  type: 'scroll' | 'dwell' | 'selection' | 'prediction'
  threshold: number
  duration?: number
  frequency?: number
}

interface TriggerRule {
  id: string
  name: string
  conditions: TriggerCondition[]
  action: string
  priority: number
  cooldown: number
}

class TriggerEngine {
  private rules: TriggerRule[] = []
  private lastTriggers: Map<string, number> = new Map()
  
  // 規則管理
  addRule(rule: TriggerRule): void
  removeRule(id: string): void
  updateRule(id: string, updates: Partial<TriggerRule>): void
  
  // 觸發檢查
  checkTriggers(data: any): TriggerRule[]
  shouldTrigger(rule: TriggerRule, data: any): boolean
  
  // 頻率控制
  isInCooldown(ruleId: string): boolean
  updateCooldown(ruleId: string): void
}
```

### 2. 相關性評分系統
```typescript
// src/services/RelevanceScorer.ts
interface RelevanceFactors {
  dwellTime: number      // 停留時間
  scrollSpeed: number    // 滾動速度
  selectionCount: number // 選擇次數
  mouseActivity: number  // 鼠標活動
  readingProgress: number // 閱讀進度
  contentType: string    // 內容類型
}

class RelevanceScorer {
  // 評分計算
  static calculateScore(factors: RelevanceFactors): number
  
  // 權重配置
  static setWeights(weights: Partial<RelevanceFactors>): void
  
  // 動態調整
  static adjustScoreByContext(score: number, context: Context): number
  
  // 閾值判斷
  static isRelevant(score: number, threshold?: number): boolean
}
```

## 📋 實作清單

### Phase 3.1: Observer Pattern 基礎 👁️
- [ ] 創建 `src/observers/` 目錄
- [ ] 實作 `AbstractObserver` 基類
- [ ] 實作 `ScrollObserver`
- [ ] 實作 `DwellTimeObserver`
- [ ] 實作 `SelectionObserver`

### Phase 3.2: ForesightJS 整合 🎯
- [ ] 安裝 ForesightJS 依賴
- [ ] 實作 `useForesight` Hook
- [ ] 創建 `ForesightService`
- [ ] 整合到閱讀器頁面
- [ ] 測試鼠標預測功能

### Phase 3.3: 智能控制器核心 🧠
- [ ] 實作 `IntelligentController`
- [ ] 實作 `BehaviorAnalyzer`
- [ ] 實作 `DataCollector`
- [ ] 建立數據處理管道

### Phase 3.4: 智能觸發系統 ⚡
- [ ] 實作 `TriggerEngine`
- [ ] 實作 `RelevanceScorer`
- [ ] 配置觸發規則
- [ ] 整合頻率控制

### Phase 3.5: 數據導出和測試 📤
- [ ] 實作 LLM 數據導出
- [ ] 創建數據可視化工具
- [ ] 性能優化和測試
- [ ] 隱私和安全檢查

## 🎯 技術重點

### 1. ForesightJS 應用場景
- **預測式內容加載** - 預測用戶要點擊的連結
- **智能工具欄顯示** - 預測需要高亮或評論的文本
- **上下文感知建議** - 根據鼠標軌跡提供相關建議
- **閱讀流暢性優化** - 減少等待時間

### 2. 數據隱私和性能
- 本地數據處理，不上傳個人行為
- 數據脫敏和匿名化
- 內存使用優化
- 批處理和防抖

### 3. 行為模式識別
- 深度閱讀 vs 快速瀏覽
- 研究型 vs 休閒型閱讀
- 重點關注區域識別
- 用戶興趣推斷

## 🔮 數據應用

### 1. 給 Local LLM 的數據格式
```json
{
  "session": {
    "user_behavior": "深度閱讀模式，關注技術細節",
    "reading_progress": 0.65,
    "focus_areas": ["代碼範例", "架構圖"],
    "interaction_style": "仔細選擇文本，停留時間長"
  },
  "content_context": {
    "current_section": "React Hooks 實作",
    "related_selections": ["useState", "useEffect"],
    "difficulty_level": "intermediate"
  },
  "prediction_context": {
    "likely_next_action": "查看相關文檔",
    "interest_score": 0.85,
    "suggested_topics": ["性能優化", "最佳實踐"]
  }
}
```

### 2. LLM 整合接口
```typescript
// src/services/LLMIntegration.ts
interface LLMRequest {
  context: Context
  query?: string
  type: 'suggestion' | 'explanation' | 'related_content'
}

class LLMIntegration {
  // 數據準備
  static prepareContextForLLM(context: Context): string
  
  // 查詢生成
  static generateQuery(type: string, context: Context): string
  
  // 結果處理
  static processLLMResponse(response: string): any
  
  // 接口方法（為 Phase 4 準備）
  static async queryLLM(request: LLMRequest): Promise<any>
} 