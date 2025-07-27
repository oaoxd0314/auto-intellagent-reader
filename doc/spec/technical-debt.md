# 技術債務管理

## 📋 當前技術債務清單

### 🔥 高優先級

#### 1. AIAgentController 直接調用 AISuggestionController 問題
**標記:** FIXME  
**狀態:** 待修復  
**描述:** AIAgentController 違反 Event-Driven 架構原則，直接調用 ControllerRegistry 執行 AISuggestionController 的 action，破壞了 Controller 間的解耦

**影響範圍:**
- `src/controllers/AIAgentController.ts:136-153` - 直接調用 `registry.executeAction('AISuggestionController', 'GENERATE_SUGGESTIONS')`
- 違反了 Event-Driven Action Handler 架構設計原則
- 阻礙了 Library 化發展和 SuperController 架構準備

**當前 Workaround:**
```typescript
// ❌ 當前的直接調用方式 (違反架構原則)
const registry = ControllerRegistry.getInstance()
await registry.executeAction('AISuggestionController', 'GENERATE_SUGGESTIONS', {
    behaviorData,
    context: {
        userBehavior: { /* AI 分析結果 */ },
        aiAnalysis: { /* LLM 洞察 */ }
    }
})
```

**推薦解決方案: Event-Driven 通訊架構**

#### 步驟 1: 修改 AIAgentController 為事件發送
```typescript
// ✅ 改為事件驅動方式
// AIAgentController.ts - analyzeBehaviorAction 方法
this.emit('aiAnalysisCompleted', {
    aiInsights,
    behaviorData,
    context: {
        userBehavior: {
            pattern: behaviorData.userPattern.type,
            confidence: behaviorData.userPattern.confidence,
            eventCount: behaviorData.sessionData.eventCount,
            focusAreas: behaviorData.userPattern.focus_areas
        },
        aiAnalysis: {
            summary: analysisResult,
            insights: aiInsights,
            confidence: AIAgentService.isConfigured() ? 'high' : 'medium',
            source: AIAgentService.isConfigured() ? 'llm' : 'rule_based'
        }
    },
    timestamp: Date.now(),
    source: AIAgentService.isConfigured() ? 'llm' : 'rule_based'
})
```

#### 步驟 2: 修改 AISuggestionController 為事件監聽
```typescript
// ✅ 使用 AbstractController 的標準化事件訂閱
class AISuggestionController extends AbstractController {
    protected onInitialize(): void {
        // 使用現有的 subscribeToController 功能
        this.subscribeToController('AIAgentController', 'aiAnalysisCompleted', this.handleAIAnalysisCompleted.bind(this))
        this.subscribeToController('AIAgentController', 'aiAnalysisError', this.handleAIAnalysisError.bind(this))
    }
    
    private handleAIAnalysisCompleted(event: AIAnalysisCompletedEvent): void {
        // 自動觸發建議生成
        this.executeAction('GENERATE_SUGGESTIONS', {
            behaviorData: event.behaviorData,
            context: event.context
        })
    }
    
    // 無需手動管理事件清理，AbstractController 自動處理
}
```

#### 步驟 3: 定義標準化事件類型
```typescript
// src/types/controller.ts - 已有基礎，需要具體實現
interface AIAnalysisCompletedEvent {
    aiInsights: any
    behaviorData: BehaviorData
    context: SuggestionContext
    timestamp: number
    source: 'llm' | 'rule_based'
}
```

**架構優勢:**
- ✅ **恢復解耦**: Controller 間無直接依賴，符合 Event-Driven 原則
- ✅ **職責純化**: AIAgent 專注 LLM 通訊，AISuggestion 專注建議策略
- ✅ **利用現有基礎**: AbstractController 已提供完整的跨 Controller 事件訂閱功能
- ✅ **SuperController 準備**: 為統一 AI Agent 調度奠定基礎

**預計工作量:** 2-3 小時  
**風險評估:** 低 - AbstractController 基礎設施已完備，只需修改業務邏輯  
**優先級理由:** 阻礙架構發展，影響 Library 化進程

---

#### 2. Controller Registry 初始化時序問題
**標記:** FIXME  
**狀態:** 待修復  
**描述:** Registry 應該在所有組件掛載前完成初始化，目前使用 polling workaround

**影響範圍:**
- `src/hooks/useControllerRegistry.ts:24` - 使用 50ms polling 等待初始化
- `src/contexts/PostContext.tsx:140` - Controller 可能為 null 的保護檢查
- `src/hooks/usePostPage.ts:27, 184` - usePostsList 和 usePostDetail 的時序檢查

**當前 Workaround:**
```typescript
// 使用 polling 機制等待 AppInitializer 完成
const pollInterval = setInterval(() => {
    if (AppInitializer.isInitialized()) {
        const registryInstance = AppInitializer.getControllerRegistry()
        setRegistry(registryInstance)
        setIsReady(true)
        clearInterval(pollInterval)
    }
}, 50)
```

**推薦解決方案:**

#### 選項 1: Suspense 邊界 (推薦)
```typescript
// App.tsx
function App() {
  return (
    <Suspense fallback={<AppInitializingSpinner />}>
      <AppInitializerBoundary>
        <BrowserRouter>
          <ProviderComposer providers={providers}>
            {/* ... */}
          </ProviderComposer>
        </BrowserRouter>
      </AppInitializerBoundary>
    </Suspense>
  )
}

// AppInitializerBoundary.tsx
function AppInitializerBoundary({ children }) {
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    AppInitializer.initialize().then(() => setIsReady(true))
  }, [])
  
  if (!isReady) {
    throw new Promise(resolve => {
      // Suspense will catch this
    })
  }
  
  return children
}
```

#### 選項 2: React Context 改進
```typescript
// 創建 AppInitializationContext 提供全局初始化狀態
const AppInitializationContext = createContext<{
  isInitialized: boolean
  registry: ControllerRegistry | null
}>()
```

#### 選項 3: AppInitializer 改進
```typescript
// 讓 AppInitializer 提供初始化完成的 Promise
class AppInitializer {
  private static initializationPromise: Promise<void> | null = null
  
  static async waitForInitialization(): Promise<void> {
    return this.initializationPromise || this.initialize()
  }
}
```

**預計工作量:** 4-6 小時  
**風險評估:** 低 - 不會影響現有功能，只是改善架構

---

### 🟡 中優先級

#### 2. executeAction 返回類型推斷問題
**標記:** TODO  
**狀態:** 需改善  
**描述:** executeAction 返回類型需要基於 action 類型進行更精確的推斷，目前使用 `as any` workaround

**影響範圍:**
- `src/contexts/PostContext.tsx:258, 276, 292` - 三處 `as any` 類型斷言

**當前 Workaround:**
```typescript
const result = await executeAction('PostController', 'SEARCH_POSTS', {
    query: filters.searchTerm || '',
    filters
}) as any // TODO: Fix type inference
```

**推薦解決方案:**

#### 類型映射改進
```typescript
// 定義 Action 返回類型映射
interface ControllerActionMap {
  PostController: {
    'GET_RECOMMENDATIONS': { recommendations: Post[] }
    'SEARCH_POSTS': { results: Post[] }
    'LOAD_POSTS': { posts: Post[] }
    'LOAD_POST': { post: Post }
    // ...
  }
  InteractionController: {
    'ADD_COMMENT': { interaction: PostInteraction }
    'ADD_HIGHLIGHT': { interaction: PostInteraction }
    // ...
  }
}

// 改進 executeAction 簽名
function executeAction<
  C extends keyof ControllerActionMap,
  A extends keyof ControllerActionMap[C]
>(
  controllerName: C,
  actionType: A,
  payload?: any
): Promise<ControllerActionMap[C][A]>
```

**預計工作量:** 2-3 小時  
**風險評估:** 低 - 純類型改善，不影響運行時行為

---

#### 3. AI Agent 動作映射與 Section ID 整合問題
**標記:** TODO  
**狀態:** 需改善  
**描述:** AI Agent 的動作建議系統缺乏完整的 section ID 整合，影響基於位置的智能建議準確性

**影響範圍:**
- `src/controllers/AIAgentController.ts:generateSuggestionsFromAnalysis` - 硬編碼動作映射，缺乏動態發現
- `src/controllers/InteractionController.ts:343-381` - ADD_NOTE 動作需要 sectionId 和 selectedText 參數
- `src/hooks/useSelectionSection.ts` - 提供 section ID 檢測但未整合到 AI 系統

**當前 Workaround:**
```typescript
// InteractionController.ts - Mock 實現
private async addNoteAction(payload: {
    postId: string
    sectionId: string  // TODO: 整合 useSelectionSection
    selectedText: string
    content: string
}): Promise<void>

// AIAgentController.ts - 硬編碼映射
const actionMapping = {
    bookmark: 'ADD_TO_BOOKMARK',
    summary: 'CREATE_SUMMARY', 
    note: 'ADD_NOTE'  // TODO: 需要 sectionId 支持
}
```

**推薦解決方案:**

#### 選項 1: AI Agent Context 擴展 (推薦)
```typescript
// 擴展 AI Agent 建議系統以包含上下文信息
interface AISuggestionContext {
  currentSelection?: {
    sectionId: string
    selectedText: string
    position: { x: number, y: number }
  }
  currentPost?: {
    id: string
    readingProgress: number
  }
  behaviorPattern?: UserBehaviorPattern
}

// AIAgentController 整合 useSelectionSection
class AIAgentController {
  generateSuggestionsFromAnalysis(
    analysis: string, 
    context: AISuggestionContext
  ): AISuggestion[]
}
```

#### 選項 2: 動態動作發現機制
```typescript
// 替換硬編碼映射為動態發現
class AIAgentController {
  private discoverAvailableActions(): Map<string, ActionDescriptor> {
    const registry = this.controllerRegistry
    const actions = new Map()
    
    // 動態掃描所有 Controllers 的可用動作
    registry.getAllControllers().forEach(controller => {
      controller.getSupportedActions().forEach(actionType => {
        actions.set(actionType, {
          controller: controller.getName(),
          actionType,
          requiresSelection: this.actionRequiresSelection(actionType)
        })
      })
    })
    
    return actions
  }
}
```

#### 選項 3: Selection-Aware 建議系統
```typescript
// 基於當前選擇狀態提供智能建議
class SelectionAwareSuggestionGenerator {
  generateSuggestions(
    behaviorAnalysis: string,
    selectionData: SelectionData | null
  ): AISuggestion[] {
    if (selectionData?.isValidSelection) {
      // 提供基於選擇的建議 (ADD_NOTE, ADD_HIGHLIGHT, ADD_COMMENT)
      return this.generateSelectionBasedSuggestions(behaviorAnalysis, selectionData)
    } else {
      // 提供通用建議 (ADD_TO_BOOKMARK, CREATE_SUMMARY)
      return this.generateGeneralSuggestions(behaviorAnalysis)
    }
  }
}
```

**預計工作量:** 6-8 小時  
**風險評估:** 中 - 需要跨多個組件協調，但不影響現有功能

---

## 📈 技術債務指標

### 當前狀況
- **總 FIXME:** 4 個
- **總 TODO:** 6 個  
- **總 HACK:** 0 個
- **高優先級債務:** 2 個
- **中優先級債務:** 2 個

### 目標
- **下週目標:** 解決 AIAgentController 直接調用問題 (高優先級)
- **雙週目標:** 解決 Controller Registry 初始化時序問題 (高優先級)
- **月度目標:** 清理所有 TODO 標記
- **長期目標:** 保持零 HACK 標記

## 🔄 債務處理流程

1. **識別階段:** 使用 FIXME/TODO/HACK 標記
2. **分類階段:** 評估優先級和影響範圍
3. **規劃階段:** 估算工作量和風險
4. **執行階段:** 按優先級順序處理
5. **驗證階段:** 確保修復不引入新問題

## 📊 債務預防策略

### Code Review 檢查點
- [ ] 新 PR 不引入 HACK 標記
- [ ] TODO 必須有明確的處理計劃
- [ ] FIXME 必須在下一個迭代處理

### 自動化檢查
```bash
# 在 CI 中檢查技術債務數量
grep -r "FIXME\|TODO\|HACK" src/ | wc -l
```

### 定期檢視
- **每週:** 檢視高優先級債務進度
- **每月:** 整體債務狀況評估
- **每季:** 債務預防策略調整