# Controller 重構 TODO

## 📋 任務清單

### 🔥 高優先級

#### 1. 分析現有 AbstractController 的 event-driven interface
**目標:** 了解當前事件系統的能力和限制  
**對應下一步:** 為 SuperController 設計統一的 Action 調度機制

**具體任務:**
- [ ] 檢查 `AbstractController.ts` 的事件系統實現
- [ ] 分析 `on()`, `off()`, `emit()` 方法的功能
- [ ] 評估是否支援 Action-Event 的統一處理
- [ ] 確認事件類型定義的完整性

**預期產出:** Event-Driven 能力分析報告

---

#### 2. 設計 Controller 純 Action Handler 接口
**目標:** 定義標準化的 Action 處理模式  
**對應下一步:** 讓所有 Controller 都能被 SuperController 統一調用

**具體任務:**
- [ ] 設計 `executeAction(actionType: string, payload: any)` 標準介面
- [ ] 定義 Action 類型規範 (CRUD, SEARCH, UPDATE 等)
- [ ] 設計狀態變更事件的標準格式
- [ ] 確保與現有 AbstractController 的兼容性

**預期產出:** Action Handler Interface 設計文檔

---

### 🟡 中優先級

#### 3. 重構 PostController 移除狀態獲取方法
**目標:** 轉換為純 Action Handler，移除狀態暴露  
**對應下一步:** 讓 Context 成為唯一的狀態提供者

**具體任務:**
- [ ] 移除 `getLoadingState()`, `getErrorState()` 等方法
- [ ] 移除 `getCachedPosts()`, `getCachedTags()` 等緩存方法
- [ ] 重新設計為 Action 模式：`loadPosts()`, `searchPosts()` 等
- [ ] 確保所有狀態變更都通過事件通知

**預期產出:** 重構後的 PostController

---

#### 4. 優化 PostContext 統一狀態管理
**目標:** 成為唯一的狀態管理中心  
**對應下一步:** 簡化 Hook 層，統一數據流

**具體任務:**
- [ ] 整合所有 Controller 的狀態到 Context
- [ ] 統一事件監聽和狀態更新邏輯
- [ ] 提供統一的 Action 觸發介面
- [ ] 優化 Context Provider 的效能

**預期產出:** 統一的 PostContext

---

## 🎯 成功指標

### 重構完成後應達到：

1. **清晰的職責分離**
   ```typescript
   Hook → Context.state (only)
   Hook → Context.actions() → Controller.executeAction()
   Controller → emit events → Context.updateState()
   ```

2. **為 AI Agent 準備**
   - SuperController 可以調用任何 Controller 的 actions
   - 統一的命令格式：`{ type: 'LOAD_POSTS', payload: {...} }`
   - 統一的狀態更新機制

3. **更好的測試性**
   - Controller 變成純函數式的 action processor
   - Context 狀態變更可預測
   - Hook 邏輯簡化

## 📊 進度追蹤 ✅ 重構已完成！

- 🔥 高優先級: ✅ 2/2 完成
- 🟡 中優先級: ✅ 2/2 完成  
- 總進度: ✅ 4/4 (100%)

**當前狀態:** 重構完成，架構運行正常

**已完成:** Event-Driven Action Handler 架構建立完成

**最終目標:** ✅ AI Agent SuperController 架構準備完成

## 🚨 當前技術債務

### 1. Controller Registry 初始化時序問題
**優先級:** 🔥 高  
**狀態:** FIXME 標記  
**描述:** Registry 應該在所有組件掛載前完成初始化，目前使用 polling workaround

**影響位置:**
- `src/hooks/useControllerRegistry.ts:24`
- `src/contexts/PostContext.tsx:140`  
- `src/hooks/usePostPage.ts:27, 184`

**解決方案建議:**
```typescript
// 選項 1: 在 App.tsx 中使用 Suspense 邊界等待初始化
// 選項 2: 使用 React Context 提供初始化狀態
// 選項 3: 改進 AppInitializer 提供初始化完成的 Promise
```

### 2. executeAction 返回類型推斷問題
**優先級:** 🟡 中  
**狀態:** TODO 標記  
**描述:** executeAction 返回類型需要基於 action 類型進行更精確的推斷

**影響位置:**
- `src/contexts/PostContext.tsx:258, 276, 292`

**解決方案建議:**
```typescript
// 使用泛型和字面量類型改善類型推斷
interface ActionReturnTypeMap {
  'GET_RECOMMENDATIONS': { recommendations: Post[] }
  'SEARCH_POSTS': { results: Post[] }
  // ...
}

executeAction<T extends keyof ActionReturnTypeMap>(
  controller: string, 
  action: T, 
  payload?: any
): Promise<ActionReturnTypeMap[T]>
```