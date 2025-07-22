# AI Behavior Assistant - Complete Architecture Specification

## 🎯 Core Objectives

### **Behavior Goal**: Natural AI Assistant Integration
創建一個自然整合的 AI 助手，透過觀察用戶行為提供智能建議，無侵入性地提升閱讀體驗。

### **Architecture Goal**: Zero-Burden AI Integration  
設計簡潔的 AI 架構，充分利用現有的 Event-Driven 系統，不增加工程負擔。

## 🎯 Design Principles

1. **Leverage Existing**: 最大化利用 BehaviorContext 和 executeAction 系統
2. **Simple Queue**: 簡單的 FIFO 建議隊列，避免過度工程化  
3. **Non-Intrusive**: 右下角 Toast UI，不干擾核心閱讀體驗
4. **Progressive**: 漸進式建立，每個組件都可獨立測試
5. **KISS**: Keep It Simple, Stupid - 最簡潔的有效實現
6. **Zero-Impact**: 不影響現有功能的穩定性和性能

---

## 🏗️ Core Components

### 1. **AIBehaviorObserver** 
**職責**: 監聽用戶行為，分析模式並生成建議

```typescript
interface AIBehaviorObserver {
  // 開始觀察用戶行為
  startObserving(): void
  
  // 停止觀察
  stopObserving(): void
  
  // 分析當前行為並生成建議
  analyzeBehaviorAndSuggest(): Promise<AISuggestion[]>
  
  // 設置建議生成策略
  setSuggestionStrategy(strategy: SuggestionStrategy): void
}
```

**實現要點**:
- 監聽 BehaviorContext 的 `getBehaviorData()` 變化
- 基於 `getUserPattern()` 結果做決策
- 使用簡單的規則引擎，不需要複雜的 AI 初期

### 2. **AISuggestionQueue**
**職責**: 管理 AI 生成的建議隊列

```typescript
interface AISuggestionQueue {
  // 添加建議到隊列
  enqueue(suggestion: AISuggestion): void
  
  // 獲取下一個建議
  dequeue(): AISuggestion | null
  
  // 清空隊列
  clear(): void
  
  // 獲取隊列狀態
  getStatus(): QueueStatus
}

interface AISuggestion {
  id: string
  type: 'action' | 'recommendation' | 'reminder'
  actionString: string  // e.g., "ADD_TO_BOOKMARK postId=current"
  description: string   // 給用戶看的描述
  priority: 'low' | 'medium' | 'high'
  timestamp: number
  context: BehaviorContext  // 生成建議時的行為上下文
}
```

### 3. **AIToastUI** 
**職責**: 右下角顯示 AI 建議，處理用戶交互

```typescript
interface AIToastUI {
  // 顯示建議
  showSuggestion(suggestion: AISuggestion): void
  
  // 隱藏當前建議
  hideSuggestion(): void
  
  // 設置用戶回應回調
  onUserResponse(callback: (response: UserResponse) => void): void
}

interface UserResponse {
  suggestionId: string
  action: 'accept' | 'reject' | 'dismiss'
  timestamp: number
}
```

**UI 規格**:
- 位置: 螢幕右下角
- 大小: 最大寬度 320px
- 動畫: 淡入淡出，向上滑動
- 持續時間: 8 秒自動消失 (用戶可以延長)
- 操作: Accept (綠色) / Reject (灰色) / Dismiss (X)

### 4. **AISuggestionController**
**職責**: 協調各組件，處理建議的生命週期

```typescript
interface AISuggestionController {
  // 初始化系統
  initialize(): void
  
  // 處理新建議
  handleNewSuggestion(suggestion: AISuggestion): void
  
  // 處理用戶回應
  handleUserResponse(response: UserResponse): void
  
  // 執行被接受的建議
  executeSuggestion(suggestion: AISuggestion): Promise<void>
}
```

---

## 🔄 Data Flow

```
1. 用戶操作 → BehaviorContext 收集事件

2. AIBehaviorObserver 監聽變化
   ↓
3. 分析行為模式，生成 AISuggestion

4. AISuggestionQueue 隊列管理
   ↓  
5. AIToastUI 顯示建議

6. 用戶選擇 Accept/Reject
   ↓
7. AISuggestionController 處理回應

8. 如果 Accept → executeAction(controller, action, payload)
```

---

## 🎯 Suggestion Generation Rules

### **Reading Pattern Analysis**

#### **Scanning Mode** (avgEventInterval < 1000ms)
- **觸發條件**: 用戶快速瀏覽，事件頻率高
- **建議類型**:
  - `ADD_TO_BOOKMARK` - "要不要先收藏，稍後深度閱讀？"
  - `SEARCH_POSTS query=related` - "發現相關文章，要看看嗎？"

#### **Reading Mode** (1000ms < avgEventInterval < 5000ms)  
- **觸發條件**: 正常閱讀節奏
- **建議類型**:
  - `ADD_TO_READING_HISTORY` - "記錄閱讀進度？"
  - `ADD_HIGHLIGHT` - "要標記重要段落嗎？"

#### **Studying Mode** (avgEventInterval > 5000ms)
- **觸發條件**: 深度閱讀，停留時間長
- **建議類型**:  
  - `ADD_NOTE` - "要為這段內容做筆記嗎？"
  - `CREATE_SUMMARY` - "需要我幫你總結重點嗎？"

### **Focus Area Triggers**

#### **Content Focus**
- 觸發: `focus_areas` 包含 'content'
- 建議: 內容相關操作 (bookmark, note, summary)

#### **Interaction Focus**  
- 觸發: `focus_areas` 包含 'interaction'
- 建議: 互動相關操作 (highlight, comment)

#### **Navigation Focus**
- 觸發: `focus_areas` 包含 'navigation'  
- 建議: 導航相關操作 (search, related posts)

---

## 🚀 Implementation Status

### ✅ Phase 0: Foundation Infrastructure (COMPLETED)
- ✅ **BehaviorEventCollector** - 統一事件收集抽象層
- ✅ **Zustand BehaviorStore** - 行為數據存儲和管理
- ✅ **AbstractController Integration** - 自動事件埋點

### 🚧 Phase 1: AI Analysis Engine (IN PROGRESS)
- [ ] **AI Behavior Observer** - 監聽事件，分析用戶模式
- [ ] **Simple Action Queue** - 基礎隊列機制，處理 AI 生成的 Action 字串
- [ ] **Toast UI Component** - 右下角建議顯示組件

### ⏳ Phase 2: Intelligence Integration (PLANNED)
- [ ] **LLM Integration** - OpenRouter API 整合，分析行為生成建議
- [ ] **Pattern Recognition** - 基於 BehaviorContext 的智能模式識別
- [ ] **Action Generation** - 將 AI 分析轉換為可執行的 Action 字串

### ⏳ Phase 3: Enhancement (PLANNED)
- [ ] **Smart Timing** - 智能建議時機選擇
- [ ] **User Preferences** - 個人化建議偏好設定
- [ ] **Performance Optimization** - 效能優化和用戶體驗改善

## 🛠️ Implementation Strategy

### **Phase 1: Simple Rule Engine**
```typescript
class SimpleSuggestionEngine {
  generateSuggestions(behaviorData: BehaviorData): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    const pattern = behaviorData.userPattern
    
    switch (pattern.type) {
      case 'scanning':
        if (pattern.duration > 30000) { // 30秒掃描
          suggestions.push({
            id: generateId(),
            type: 'action',
            actionString: 'ADD_TO_BOOKMARK postId=current',
            description: '要不要先收藏，稍後深度閱讀？',
            priority: 'medium',
            timestamp: Date.now(),
            context: behaviorData
          })
        }
        break
        
      case 'studying':
        if (pattern.duration > 120000) { // 2分鐘深度閱讀
          suggestions.push({
            id: generateId(),
            type: 'action',
            actionString: 'ADD_NOTE postId=current content=auto',
            description: '要為這段內容做筆記嗎？',
            priority: 'high',
            timestamp: Date.now(),
            context: behaviorData
          })
        }
        break
    }
    
    return suggestions
  }
}
```

### **Phase 2: Context-Aware Logic**
- 考慮歷史行為偏好
- 時間上下文 (例如：週末 vs 工作日)
- 文章類型上下文

### **Phase 3: LLM Integration**
- 將 `behaviorData` 送給 LLM 分析
- 讓 LLM 生成更自然的建議描述
- 基於內容理解提供更智能的建議

## 🎯 Demo Scenarios

### 1. 智能閱讀建議
- **情境**: 用戶快速瀏覽文章（scanning模式）
- **AI分析**: 檢測到淺層閱讀模式
- **建議**: "要不要添加書籤，稍後深度閱讀？"
- **Action**: `ADD_TO_BOOKMARK postId=current-post`

### 2. 相關內容推薦
- **情境**: 用戶在某個段落停留較久（studying模式）
- **AI分析**: 識別到深度學習興趣
- **建議**: "發現相關文章，要看看嗎？"  
- **Action**: `SEARCH_POSTS query=related-topic`

### 3. 筆記提醒
- **情境**: 用戶頻繁選擇文字但未做筆記
- **AI分析**: 檢測到記錄意圖
- **建議**: "要為選中的內容創建筆記嗎？"
- **Action**: `ADD_NOTE postId=current content=selected-text`

---

## 🎨 UI/UX Specifications

### **Toast UI Component**

```typescript
interface ToastUIProps {
  suggestion: AISuggestion
  onAccept: () => void
  onReject: () => void  
  onDismiss: () => void
  autoHideDelay?: number // 默認 8000ms
}
```

**樣式要求**:
- 背景: 半透明白色 `rgba(255, 255, 255, 0.95)`
- 邊框: 淺灰色圓角 `border-radius: 12px`
- 陰影: 柔和投影 `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1)`
- 文字: 主要文字 14px，次要文字 12px
- 按鈕: Accept (綠色 #10B981), Reject (灰色 #6B7280)

**動畫效果**:
- 進入: 從右下角向上滑動 + 淡入 (300ms ease-out)
- 退出: 向右滑動 + 淡出 (200ms ease-in)
- Hover: 輕微放大 (scale: 1.02)

### **響應式設計**
- 桌面: 固定右下角，距離邊緣 24px
- 平板: 距離邊緣 16px，最大寬度 280px  
- 手機: 距離邊緣 12px，最大寬度 240px

---

## 🧪 Testing Strategy

### **Unit Tests**
- `AIBehaviorObserver`: 行為分析邏輯
- `AISuggestionQueue`: 隊列操作
- `SimpleSuggestionEngine`: 建議生成規則

### **Integration Tests**  
- BehaviorContext → AIObserver → Queue → UI 完整流程
- executeAction 整合測試

### **E2E Tests**
- 模擬用戶閱讀行為 → AI 建議顯示 → 用戶接受 → 操作執行

### **Performance Tests**
- 行為分析不影響閱讀體驗 (< 16ms)
- 建議生成頻率控制 (最多每 30 秒一次)
- 記憶體使用監控

---

## 🔧 Integration Points

### **與現有系統整合**

#### **BehaviorContext Integration**
```typescript
// 在 AI Observer 中訂閱行為變化
const { getBehaviorData, isCollecting } = useBehavior()

useEffect(() => {
  if (isCollecting) {
    const interval = setInterval(() => {
      const data = getBehaviorData()
      aiObserver.analyzeBehavior(data)
    }, 30000) // 每 30 秒分析一次
    
    return () => clearInterval(interval)
  }
}, [isCollecting])
```

#### **executeAction Integration**  
```typescript
// 執行 AI 建議時使用現有的 executeAction
async function executeSuggestion(suggestion: AISuggestion) {
  const [controller, action, ...params] = suggestion.actionString.split(' ')
  const payload = parseParams(params) // 解析參數
  
  await executeAction(controller, action, payload)
}
```

#### **Event System Integration**
```typescript
// 利用現有的事件系統
eventEmitter.emit('ai:suggestion:generated', suggestion)
eventEmitter.emit('ai:suggestion:accepted', suggestion)
eventEmitter.emit('ai:suggestion:rejected', suggestion)
```

---

## 📈 Success Metrics

### **用戶體驗指標**
- 建議接受率 > 30%
- 用戶滿意度評分 > 4.0/5.0
- 建議相關性評分 > 3.5/5.0

### **技術性能指標**  
- 行為分析延遲 < 100ms
- UI 響應時間 < 200ms
- 系統資源使用 < 5% CPU

### **業務指標**
- 用戶參與度提升 > 20%
- 平均閱讀時間增加 > 15%
- 功能使用率提升 > 25%

---

這個架構設計專注於簡潔性和實用性，充分利用現有的 BehaviorContext 和 executeAction 系統，避免過度工程化，同時為未來的 LLM 整合留下擴展空間。