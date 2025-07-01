# Observer Data Pipeline 規格

## 🎯 目標功能

Observer Data Pipeline 負責收集和分析用戶行為數據，為 AI Agent 提供豐富的上下文資訊。

### 核心職責
1. **Frame 級別行為追蹤** - 停留時間、懸停、選擇行為
2. **用戶偏好模式追蹤** - 標籤偏好、評論模式、互動行為
3. **事件數據管道優化** - 節流、持久化、性能監控

## 📋 功能清單

### Phase 2.1: Frame 級別行為追蹤 🔍
- [ ] **停留時間追蹤**
  - [ ] 在同一個 frame 停留時間計算
  - [ ] 視窗焦點狀態監控
  - [ ] 非活躍時間過濾
- [ ] **Section 互動監控**
  - [ ] Hover 段落識別和時間記錄
  - [ ] Select 文字範圍和頻率統計
  - [ ] 滾動深度百分比追蹤
- [ ] **用戶注意力分析**
  - [ ] 活躍元素識別
  - [ ] 注意力熱力圖生成
  - [ ] 閱讀模式分類 (scanning/reading/studying/skimming)

### Phase 2.2: 用戶偏好模式追蹤 📊
- [ ] **標籤偏好分析**
  - [ ] 重複觀看標籤類文章統計
  - [ ] 閱讀時間和參與度關聯
  - [ ] 趨勢分數計算 (增長/衰減)
- [ ] **評論行為模式**
  - [ ] 重複留言段落識別
  - [ ] 評論長度和主題分析
  - [ ] 情感傾向分析 (正面/中性/負面)
- [ ] **互動行為統計**
  - [ ] 主動互動動作頻率 (comment/reply/highlight/bookmark)
  - [ ] 互動時間分佈和高峰時段
  - [ ] 偏好內容長度分析

### Phase 2.3: 事件數據管道優化 ⚡
- [ ] **事件處理機制**
  - [ ] 事件節流和批次處理
  - [ ] 高頻事件去重和聚合
  - [ ] 事件優先級排序
- [ ] **數據持久化**
  - [ ] LocalStorage 智能存儲
  - [ ] 數據清理和壓縮算法
  - [ ] 存儲配額管理
- [ ] **性能監控**
  - [ ] 內存使用監控
  - [ ] 事件處理延遲統計
  - [ ] 數據傳輸效率分析

## 🏗️ 技術架構

### 數據流架構
```
DOM Events → Observer → Data Processor → Context Store → AI Agent
    ↓            ↓            ↓              ↓            ↓
  原始事件     事件過濾     數據清洗        狀態更新    智能分析
```

### 核心組件設計

#### 1. FrameObserver - Frame 級別追蹤器
```typescript
// src/observers/FrameObserver.ts
interface FrameEventData {
  dwellTime: number           // 停留時間 (ms)
  hoveredSections: string[]   // 懸停段落 ID 列表
  selectedSections: string[]  // 選中段落 ID 列表
  scrollDepth: number         // 滾動深度百分比 (0-100)
  activeElements: {
    element: HTMLElement
    interactionType: 'hover' | 'click' | 'select'
    duration: number
    timestamp: number
  }[]
  attentionScore: number      // 注意力分數 (0-1)
  readingPattern: 'scanning' | 'reading' | 'studying' | 'skimming'
}

class FrameObserver {
  private dwellTimer: number = 0
  private hoveredElements: Map<string, number> = new Map()
  private selectedElements: Set<string> = new Set()
  private scrollDepth: number = 0
  
  // 公共方法
  startTracking(postId: string): void
  stopTracking(): void
  getCurrentFrameData(): FrameEventData
  
  // 私有方法
  private handleMouseEnter(event: MouseEvent): void
  private handleMouseLeave(event: MouseEvent): void
  private handleTextSelection(event: SelectionEvent): void
  private handleScroll(event: ScrollEvent): void
  private calculateAttentionScore(): number
  private detectReadingPattern(): string
}
```

#### 2. PatternAnalyzer - 用戶模式分析器
```typescript
// src/observers/PatternAnalyzer.ts
interface UserPatternData {
  tagPreferences: {
    tag: string
    viewCount: number
    totalReadTime: number
    averageEngagement: number
    lastViewTime: number
    trendScore: number        // 趨勢分數，正值表示增長
  }[]
  commentPatterns: {
    sectionId: string
    postId: string
    commentCount: number
    averageLength: number
    topics: string[]          // 提取的主題關鍵字
    sentiment: 'positive' | 'neutral' | 'negative'
    engagementLevel: 'low' | 'medium' | 'high'
  }[]
  interactionActions: {
    type: 'comment' | 'reply' | 'highlight' | 'bookmark' | 'share'
    frequency: number         // 每日平均頻率
    peakHours: number[]       // 高峰時段 (0-23)
    preferredLength: number   // 偏好的內容長度
    lastAction: number        // 最後動作時間戳
  }[]
  readingHabits: {
    averageSessionTime: number
    preferredTimeOfDay: number[]
    scrollSpeed: number
    selectionFrequency: number
    backtrackingRate: number  // 回看率
  }
}

class PatternAnalyzer {
  analyzeTagPreferences(historyData: ReadingHistory[]): TagPreference[]
  analyzeCommentPatterns(interactions: PostInteraction[]): CommentPattern[]
  analyzeInteractionActions(interactions: PostInteraction[]): InteractionAction[]
  analyzeReadingHabits(behaviorData: BehaviorData[]): ReadingHabits
  
  // 趨勢分析
  calculateTrendScore(data: TimeSeriesData[]): number
  detectEngagementLevel(interaction: PostInteraction): 'low' | 'medium' | 'high'
  extractTopics(content: string): string[]
  analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative'
}
```

#### 3. DataPipeline - 數據管道處理器
```typescript
// src/observers/DataPipeline.ts
interface PipelineConfig {
  throttleMs: number          // 節流間隔 (ms)
  batchSize: number          // 批次處理大小
  maxCacheSize: number       // 最大快取大小
  storageQuota: number       // 存儲配額 (MB)
}

class DataPipeline {
  private eventQueue: ObserverEvent[] = []
  private processingBatch: boolean = false
  private throttleMap: Map<string, number> = new Map()
  
  // 事件處理
  addEvent(event: ObserverEvent): void
  processBatch(): Promise<void>
  
  // 節流控制
  shouldThrottle(eventType: string): boolean
  updateThrottleTimer(eventType: string): void
  
  // 數據清理
  cleanupOldData(): void
  compressStorageData(): void
  checkStorageQuota(): boolean
  
  // 性能監控
  getPerformanceMetrics(): PerformanceMetrics
  monitorMemoryUsage(): MemoryUsage
  trackProcessingTime(operation: string, duration: number): void
}
```

## 📊 實作清單

### Phase 2.1: Frame 級別行為追蹤 (Week 1-2)
- [ ] **創建 Observer 基礎架構**
  - [ ] 創建 `src/observers/` 目錄
  - [ ] 實作 `FrameObserver` 類別
  - [ ] 整合到 `BehaviorContext`
- [ ] **停留時間追蹤**
  - [ ] 視窗焦點事件監聽
  - [ ] 非活躍時間過濾邏輯
  - [ ] Frame 切換檢測
- [ ] **Section 互動監控**
  - [ ] DOM 元素標識系統
  - [ ] 滑鼠事件處理器
  - [ ] 文字選擇事件處理器
  - [ ] 滾動事件處理器

### Phase 2.2: 用戶模式分析 (Week 2-3)
- [ ] **創建 PatternAnalyzer**
  - [ ] 實作模式分析演算法
  - [ ] 整合歷史數據分析
  - [ ] 實時模式更新機制
- [ ] **標籤偏好分析**
  - [ ] 標籤觀看統計
  - [ ] 趨勢分數計算算法
  - [ ] 偏好權重調整
- [ ] **評論和互動分析**
  - [ ] 文本主題提取
  - [ ] 情感分析整合
  - [ ] 參與度評分算法

### Phase 2.3: 數據管道優化 (Week 3-4)
- [ ] **事件處理優化**
  - [ ] 實作 `DataPipeline` 類別
  - [ ] 節流和批次處理邏輯
  - [ ] 事件去重和聚合
- [ ] **存儲和性能**
  - [ ] LocalStorage 管理器
  - [ ] 數據壓縮算法
  - [ ] 性能監控儀表板
- [ ] **整合測試**
  - [ ] 端到端數據流測試
  - [ ] 性能基準測試
  - [ ] 記憶體洩漏檢測

## 🎯 技術重點

### 1. 非侵入式設計
確保數據收集不影響用戶正常的閱讀體驗

### 2. 效能優化
高頻事件處理不能影響 UI 響應性

### 3. 隱私保護
所有數據僅存儲在本地，不上傳到服務器

### 4. 智能過濾
區分有價值的行為數據和雜訊

## 📈 評估指標

### **數據品質指標**
- 事件捕獲完整性 > 95%
- 數據準確性 > 98%
- 雜訊過濾效率 > 90%

### **性能指標**
- 事件處理延遲 < 10ms
- 內存使用增長 < 10MB/hour
- CPU 占用率 < 2% (平均)

### **用戶體驗指標**
- UI 響應時間無影響
- 頁面載入時間增加 < 5%
- 滾動性能無感知影響

## 🔮 擴展規劃

### **短期擴展**
- [ ] 更多互動類型支援 (拖拽、縮放等)
- [ ] 跨頁面行為關聯分析
- [ ] 實時行為預測

### **長期規劃**
- [ ] 機器學習模型整合
- [ ] 跨設備行為同步
- [ ] 協作行為分析

---

**相關文檔：**
- [🤖 AI Controller 規格](../ai-controller/) - 數據消費端
- [🎨 UI 系統規格](../ui/) - 用戶互動回饋
- [🧠 策略系統規格](../strategy/) - 行為策略應用 