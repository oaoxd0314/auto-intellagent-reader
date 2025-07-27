# AI 智能系統規格

## 🎯 系統概述

AI 智能系統提供智能行為分析和個性化建議功能，通過觀察用戶閱讀行為自動生成有價值的建議。

## 🏗️ 系統架構

### 核心組件職責分工

```
用戶行為 → 行為分析 → AI 洞察 → 智能建議 → Toast 顯示 → 用戶執行
    ↓         ↓         ↓         ↓         ↓         ↓
BehaviorStore → AIAgent → OpenRouter → Suggestion → Toast UI → Controllers
```

## 🧠 核心功能邏輯

### 1. 行為模式識別

**Scanning Mode (掃描模式)**
- 觸發條件: 快速滾動和點擊 (`avgEventInterval < 1000ms`)
- 建議類型: 收藏文章、搜尋相關內容
- 目標: 幫助用戶整理感興趣的內容

**Reading Mode (閱讀模式)**  
- 觸發條件: 正常閱讀節奏 (`1000ms < interval < 5000ms`)
- 建議類型: 高亮重要段落、記錄閱讀進度
- 目標: 增強閱讀理解和記憶

**Studying Mode (學習模式)**
- 觸發條件: 深度閱讀 (`avgEventInterval > 5000ms`)
- 建議類型: 做筆記、創建摘要
- 目標: 深化學習效果和知識整理

### 2. AI 智能分析流程

**步驟 1: 行為數據收集**
- `BehaviorStore` 持續收集用戶互動事件
- 包含滾動、點擊、停留時間、文字選擇等行為
- 自動識別閱讀模式和信心度

**步驟 2: AI 洞察生成**
- `AIAgentController` 每 30 秒分析一次行為數據
- 優先使用 OpenRouter API 進行真實 AI 分析
- 無 API 時使用智能 fallback 規則引擎
- 生成行為洞察和建議方向

**步驟 3: 智能建議生成**
- `AISuggestionController` 基於 AI 洞察生成具體建議
- 結合行為模式和 AI 分析結果決定建議類型
- 設定建議優先級和過期時間
- 建議進入隊列等待顯示

**步驟 4: 用戶交互處理**
- Toast UI 根據優先級智能調整顯示時長
- 用戶可選擇接受、拒絕或忽略建議
- 接受的建議通過 `ControllerRegistry` 執行對應操作
- 記錄統計數據優化後續建議品質

## 🎨 用戶體驗設計

### Toast 智能顯示策略

**優先級顯示時長**
- 高優先級: 12 秒 (紅色圓點 🔴)
- 中優先級: 8 秒 (黃色圓點 🟡)  
- 低優先級: 6 秒 (藍色圓點 🔵)

**非侵入性原則**
- 右下角位置，不遮擋閱讀內容
- 最多同時顯示 1 個建議，避免干擾
- 優雅的進入/退出動畫
- 可快速關閉或批量處理

### 個性化學習機制

**用戶偏好學習**
- 記錄用戶對不同類型建議的回應
- 統計接受率、拒絕率、忽略率
- 基於回饋調整後續建議策略
- 逐步優化建議的相關性和時機

## 🔄 系統整合連結

### Controller 間協作

**AIAgentController ↔ AISuggestionController**
- AIAgent 分析完成後通過 `ControllerRegistry` 調用 Suggestion 生成
- 傳遞行為數據、AI 洞察和上下文信息
- 無狀態設計，所有數據通過參數傳遞

**AISuggestionController ↔ 其他 Controllers**
- 用戶接受建議時，通過 `ControllerRegistry` 執行對應操作
- 如: ADD_BOOKMARK → PostController, ADD_NOTE → InteractionController
- 統一的 Action 執行機制，確保操作一致性

### 狀態管理整合

**BehaviorStore (Zustand)**
- 集中管理用戶行為數據和模式分析
- 提供 `getBehaviorData()` 供 AI 系統分析
- 自動計算行為模式和信心度

**AISuggestionStore (Zustand)** 
- 管理建議隊列、統計數據、當前狀態
- 提供隊列操作: enqueue, dequeue, clear, optimize
- 支援優先級排序和去重機制

## 📊 品質與性能

### 智能建議品質控制

**AI 增強過濾**
- AI 信心度 < 0.5 時減少建議數量
- 行為模式信心度 < 0.5 時保守生成
- 事件數量 < 5 時不提供建議

**建議相關性保證**
- 基於當前文章上下文生成建議
- 考慮用戶歷史偏好和互動模式
- 動態調整建議頻率避免疲勞

### 系統性能指標

**響應性能**
- 行為事件處理: < 10ms
- AI 分析完成: < 2s (包含網路請求)
- Toast 顯示響應: < 200ms

**資源使用**
- 記憶體佔用: < 50MB
- CPU 使用率: < 5% (背景分析)
- 不影響正常閱讀流暢度

## 🔧 架構改進 TODO

### 🔴 高優先級 - Controller 職責重新劃分

**問題描述**: 當前 AIAgentController 和 AISuggestionController 職責邊界模糊，需要重新劃分以提升系統清晰度和 Library 化準備。

#### TODO: Controller 間通訊架構設計

**核心問題**: AISuggestionController 如何獲取 AIAgentController 的 API response？

**🎯 推薦方案：Event-Driven Controller 通訊**

基於現有的 Event-Driven Action Handler 架構，採用事件驅動的 Controller 間通訊：

```typescript
// 通訊流程設計
AIAgentController.analyzeBehavior() 
  ↓ emit('aiAnalysisCompleted', { aiInsights, behaviorData, context })
AISuggestionController (事件監聽器)
  ↓ handleAIAnalysisCompleted()
  ↓ executeAction('GENERATE_SUGGESTIONS', eventData)
建議生成和 Toast 顯示
```

**實施步驟：**
- [x] **AbstractController 增強**: 新增跨 Controller 事件訂閱支援
  - ✅ 新增 `subscribeToController()` 標準化訂閱方法
  - ✅ 新增 `unsubscribeFromController()` 取消訂閱方法  
  - ✅ 新增自動事件清理機制，防止內存洩漏
  - ✅ 新增 `getRegistry()` 方法訪問 ControllerRegistry
- [ ] **Controller 重構任務**: 已記錄在 [technical-debt.md](./technical-debt.md#1-aiagentcontroller-直接調用-aisuggestioncontroller-問題) 作為高優先級技術債務
  - [ ] 修改 AIAgentController 為事件發送模式
  - [ ] 修改 AISuggestionController 為事件監聽模式  
  - [ ] 定義標準化事件類型接口
- [x] **生命週期管理**: AbstractController 自動管理事件訂閱/取消訂閱

**📋 詳細實施指南**: 具體的代碼修改步驟和實施方案請參考 [技術債務管理文檔](./technical-debt.md)

**事件接口設計：**
```typescript
// AIAgentController 發送
interface AIAnalysisCompletedEvent {
  aiInsights: StructuredInsights | null
  behaviorData: BehaviorData
  context: SuggestionContext
  timestamp: number
  source: 'llm' | 'rule_based'
  confidence: number
}

// AISuggestionController 監聽 - 使用新的 AbstractController 功能
class AISuggestionController extends AbstractController {
  protected onInitialize(): void {
    // 🎯 使用標準化的 subscribeToController 方法
    this.subscribeToController('AIAgentController', 'aiAnalysisCompleted', this.handleAIAnalysisCompleted.bind(this))
    this.subscribeToController('AIAgentController', 'aiAnalysisError', this.handleAIAnalysisError.bind(this))
    
    // 🎯 不需要手動管理事件清理，AbstractController 會自動處理
  }
  
  private handleAIAnalysisCompleted(event: AIAnalysisCompletedEvent): void {
    this.executeAction('GENERATE_SUGGESTIONS', {
      behaviorData: event.behaviorData,
      context: { ...event.context, aiAnalysis: event.aiInsights }
    })
  }
  
  private handleAIAnalysisError(event: AIAnalysisErrorEvent): void {
    // 處理 AI 分析錯誤的降級策略
    this.log('AI analysis failed, applying fallback strategy', {
      error: event.error,
      strategy: event.fallbackStrategy
    })
  }
  
  // 🎯 onDestroy 不需要手動清理事件訂閱，AbstractController 自動處理
}
```

**架構優勢：**
- ✅ **完全解耦**: Controller 間無直接依賴，符合 Event-Driven 原則
- ✅ **職責清晰**: AIAgent 專注 LLM 通訊，AISuggestion 專注建議策略
- ✅ **標準化通訊**: AbstractController 提供統一的跨 Controller 事件訂閱接口
- ✅ **自動資源管理**: 事件訂閱自動清理，防止內存洩漏
- ✅ **易於測試**: 可直接模擬事件進行單元測試
- ✅ **可擴展**: 其他 Controller 也可監聽 AI 分析事件
- ✅ **SuperController 準備**: 為統一的 AI Agent 調度奠定基礎
- ✅ **開發便利性**: 簡化的 API，開發者只需關注業務邏輯

**實施代碼示例：**

```typescript
// 1. 修改後的 AIAgentController - 純 LLM 通訊層
class AIAgentController extends AbstractController {
  /**
   * 分析用戶行為 - 只負責 LLM 通訊和結果發送
   */
  private async analyzeBehaviorAction(payload?: { customPrompt?: string }): Promise<void> {
    try {
      const behaviorData = useBehaviorStore.getState().getBehaviorData()
      
      if (behaviorData.recentEvents.length === 0) {
        this.emit('aiAnalysisError', {
          error: '暫無行為數據可分析',
          behaviorData,
          context: {},
          timestamp: Date.now(),
          fallbackStrategy: 'skip_suggestions'
        })
        return
      }

      // 純 LLM 通訊邏輯
      const behaviorPrompt = this.createBehaviorAnalysisPrompt(behaviorData, payload?.customPrompt)
      let aiInsights: any = null
      let analysisSource: 'llm' | 'rule_based' = 'rule_based'

      if (AIAgentService.isConfigured()) {
        try {
          const messages = [
            { role: 'system', content: behaviorPrompt },
            { role: 'user', content: '請分析我的閱讀行為並提供洞察' }
          ]
          const analysisResult = await AIAgentService.sendMessage(messages, {
            temperature: 0.3,
            maxTokens: 800
          })
          
          aiInsights = this.parseAIInsights(analysisResult)
          analysisSource = 'llm'
          this.log('AI analysis completed', { source: 'llm', confidence: aiInsights?.confidenceLevel })
        } catch (error) {
          this.log('AI service failed, using fallback', error)
          aiInsights = this.generateMockInsights(behaviorData)
          analysisSource = 'rule_based'
        }
      } else {
        aiInsights = this.generateMockInsights(behaviorData)
        analysisSource = 'rule_based'
      }

      // 🎯 關鍵改變：發送事件而不是直接調用其他 Controller
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
            summary: aiInsights?.summary || '基於規則引擎的分析',
            source: analysisSource,
            confidence: aiInsights?.confidenceLevel > 0.7 ? 'high' : 'medium'
          }
        },
        timestamp: Date.now(),
        source: analysisSource,
        confidence: aiInsights?.confidenceLevel || 0.5
      })

    } catch (error) {
      this.emit('aiAnalysisError', {
        error: error instanceof Error ? error.message : 'AI 分析失敗',
        behaviorData: useBehaviorStore.getState().getBehaviorData(),
        context: {},
        timestamp: Date.now(),
        fallbackStrategy: 'mock_analysis'
      })
    }
  }

  /**
   * 生成 Mock 洞察 - 降級策略
   */
  private generateMockInsights(behaviorData: any): any {
    return {
      suggestedActions: ['bookmark', 'highlight', 'note'],
      userMood: 'focused',
      confidenceLevel: 0.6,
      recommendations: ['建議收藏此文章', '標記重要段落'],
      summary: `基於 ${behaviorData.userPattern.type} 模式的分析建議`
    }
  }
}

// 2. 修改後的 AISuggestionController - 建議策略層
class AISuggestionController extends AbstractController {
  protected onInitialize(): void {
    // 🎯 關鍵改變：監聽 AI 分析事件
    const registry = ControllerRegistry.getInstance()
    const aiAgentController = registry.getController('AIAgentController')
    
    if (aiAgentController) {
      aiAgentController.on('aiAnalysisCompleted', this.handleAIAnalysisCompleted.bind(this))
      aiAgentController.on('aiAnalysisError', this.handleAIAnalysisError.bind(this))
      this.log('Successfully subscribed to AI Agent events')
    } else {
      this.log('Warning: AIAgentController not found in registry')
    }
  }

  protected onDestroy(): void {
    // 清理事件監聽器
    const registry = ControllerRegistry.getInstance()
    const aiAgentController = registry.getController('AIAgentController')
    
    if (aiAgentController) {
      aiAgentController.off('aiAnalysisCompleted', this.handleAIAnalysisCompleted)
      aiAgentController.off('aiAnalysisError', this.handleAIAnalysisError)
    }
  }

  /**
   * 處理 AI 分析完成事件
   */
  private handleAIAnalysisCompleted(event: AIAnalysisCompletedEvent): void {
    this.log('Received AI analysis completed event', {
      source: event.source,
      confidence: event.confidence,
      hasInsights: !!event.aiInsights
    })

    // 直接觸發建議生成
    this.executeAction('GENERATE_SUGGESTIONS', {
      behaviorData: event.behaviorData,
      context: event.context
    }).catch(error => {
      this.log('Failed to generate suggestions from AI analysis', error)
    })
  }

  /**
   * 處理 AI 分析錯誤事件
   */
  private handleAIAnalysisError(event: AIAnalysisErrorEvent): void {
    this.log('Received AI analysis error event', {
      error: event.error,
      fallbackStrategy: event.fallbackStrategy
    })

    // 根據降級策略決定如何處理
    switch (event.fallbackStrategy) {
      case 'mock_analysis':
        // 使用基礎規則生成建議
        this.executeAction('GENERATE_SUGGESTIONS', {
          behaviorData: event.behaviorData,
          context: {
            ...event.context,
            aiAnalysis: {
              summary: '使用基礎規則分析',
              source: 'rule_based',
              confidence: 'low'
            }
          }
        })
        break
      case 'skip_suggestions':
        this.log('Skipping suggestions due to insufficient data')
        break
      case 'retry':
        // 可以實施重試邏輯
        break
    }
  }

  /**
   * 原有的建議生成邏輯保持不變
   */
  private async generateSuggestionsAction(payload: {
    behaviorData: BehaviorData
    context?: SuggestionContext
  }): Promise<void> {
    // 現有的建議生成邏輯...
    // 現在可以依賴 context.aiAnalysis 包含的 AI 洞察
  }
}

// 3. Hook 層的調用方式保持簡潔
function useAIIntelligence() {
  const aiAgentController = ControllerRegistry.getInstance().getController('AIAgentController')
  
  const analyzeUserBehavior = useCallback((customPrompt?: string) => {
    aiAgentController.executeAction('ANALYZE_BEHAVIOR', { customPrompt })
  }, [aiAgentController])

  return { analyzeUserBehavior }
}
```

#### TODO: AIAgentController 職責純化
- [ ] **移除業務邏輯**: 將 `analyzeBehaviorAction` 中直接調用 `AISuggestionController` 的邏輯移除
- [ ] **專注 LLM 通訊**: 只負責與 LLM 的通訊和回應處理
- [ ] **標準化輸出**: 提供統一的 AI 洞察接口格式
- [ ] **錯誤處理**: 完善 LLM 通訊錯誤處理和降級機制

**期望職責**:
```typescript
AIAgentController {
  // 純 LLM 通訊層
  - analyzeBehavior(behaviorData) -> AIInsights
  - createPrompt(behaviorData, context) -> string
  - parseLLMResponse(response) -> StructuredInsights
  - handleLLMError(error) -> FallbackInsights
}
```

#### TODO: AISuggestionController 職責完整化
- [ ] **接管建議生成**: 完全負責基於 AI 洞察和行為數據的建議生成邏輯
- [ ] **策略控制**: 負責建議頻率、幅度、時機等策略控制
- [ ] **UI 渲染協調**: 完善 Toast 顯示策略和用戶互動處理
- [ ] **學習機制**: 基於用戶回饋優化建議策略

**期望職責**:
```typescript
AISuggestionController {
  // 建議策略和執行層
  - generateSuggestions(aiInsights, behaviorData) -> AISuggestion[]
  - controlSuggestionTiming(userContext) -> boolean
  - optimizeSuggestionStrategy(userFeedback) -> void
  - coordinateUIDisplay(suggestions) -> void
}
```

### 🟡 中優先級 - 系統測試和驗證

#### TODO: 重新測試 LLM 建議模式
- [ ] **LLM 提示詞優化**: 測試不同提示詞對建議質量的影響
- [ ] **建議準確性驗證**: 驗證 AI 生成建議與用戶實際需求的匹配度
- [ ] **建議頻率調優**: 測試最佳的建議顯示頻率和時機
- [ ] **用戶體驗測試**: 評估新的職責分工對用戶體驗的影響
- [ ] **A/B 測試**: 對比重構前後的系統效果

#### TODO: 架構穩定性驗證
- [ ] **Controller 解耦測試**: 驗證兩個 Controller 完全解耦後的穩定性
- [ ] **錯誤處理測試**: 測試各種邊界情況和錯誤場景
- [ ] **性能影響評估**: 確保重構不影響系統性能
- [ ] **Library 化準備**: 驗證重構後的架構是否適合 Library 化

### 🔵 低優先級 - 長期優化

#### TODO: AI 智能升級
- [ ] **多模型支援**: 支援更多 LLM 提供商和模型
- [ ] **上下文增強**: 增強 AI 對用戶上下文的理解能力
- [ ] **個性化學習**: 實現基於用戶歷史的個性化建議模型

---

## 🚀 未來擴展方向

### 短期優化
- 更精確的行為模式識別
- 增強 AI 洞察解析能力
- 支援更多建議類型和操作

### 中期發展  
- 多模態行為分析 (語音、眼動等)
- 社群智慧和協作推薦
- 個人知識圖譜建構

### 長期願景
- AI 助教模式和主動學習指導  
- 跨平台學習數據同步
- 開放 API 和第三方整合

---

**系統狀態**: AI 智能系統已完全實現並投入使用，但需要進行架構優化以支援 Library 化發展。