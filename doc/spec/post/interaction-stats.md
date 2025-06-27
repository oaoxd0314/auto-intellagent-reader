# 互動統計系統規格

## 🎯 系統概述

互動統計系統是基於現有的結構化互動功能，新增的全域統計管理系統。該系統遵循 `/dev` 文檔中的分層架構原則，實現了系統化的 Provider 模式。

## ✅ 已完成功能

### 1. InteractionContext 全域狀態管理

**檔案位置：** `src/contexts/InteractionContext.tsx`

**設計原則：**
- 遵循 React 最佳實踐（使用 `type` 而非 `interface`）
- 使用 `useReducer` 進行複雜狀態管理
- 純函數計算統計數據
- 事件驅動的實時更新

**核心類型定義：**
```typescript
// 互動統計類型
type InteractionStats = {
  readonly totalInteractions: number
  readonly replies: number
  readonly marks: number
  readonly comments: number
}

// 按文章統計的互動數據
type PostInteractionStats = Record<string, InteractionStats>

// Context 狀態
type InteractionState = {
  readonly interactions: PostInteraction[]
  readonly statsByPost: PostInteractionStats
  readonly isLoading: boolean
  readonly error: string | null
}
```

**Context API：**
```typescript
type InteractionContextType = {
  // 狀態
  readonly interactions: PostInteraction[]
  readonly statsByPost: PostInteractionStats
  readonly isLoading: boolean
  readonly error: string | null
  
  // 統計方法
  readonly getPostStats: (postId: string) => InteractionStats
  readonly getTotalStats: () => InteractionStats
  
  // 操作方法
  readonly refreshInteractions: () => void
  readonly clearError: () => void
}
```

### 2. 統計計算邏輯

**純函數設計：**
```typescript
function calculateStatsByPost(interactions: PostInteraction[]): PostInteractionStats {
  // 按 postId 分組
  // 計算每個文章的統計
  // 返回統計對象
}
```

**統計類型：**
- **replies** - 回覆文章的數量
- **marks** - 文字標記的數量  
- **comments** - 段落評論的數量
- **totalInteractions** - 總互動數量

### 3. InteractionStats 顯示組件

**檔案位置：** `src/components/InteractionStats.tsx`

**功能特性：**
- 響應式設計（sm/md/lg 三種尺寸）
- 載入狀態處理（skeleton loading）
- 空狀態處理（可選顯示）
- 行動裝置適配（隱藏文字說明）

**使用方式：**
```typescript
<InteractionStats 
  postId={post.id} 
  size="sm"           // 'sm' | 'md' | 'lg'
  showEmpty={false}   // 是否顯示空狀態
/>
```

**UI 展示：**
- 💬 X 則段落評論
- ✨ X 個標記
- 💭 X 個回覆

### 4. 文章列表頁面整合

**檔案位置：** `src/pages/posts/index.tsx`

**整合方式：**
```typescript
// 移除直接使用 useInteraction
// 改用 InteractionStats 組件
<div className="mb-3">
  <InteractionStats postId={post.id} size="sm" />
</div>
```

**UI 改進：**
- 在文章卡片中顯示互動統計
- 只在有互動時顯示（避免視覺雜亂）
- 與標籤系統協調佈局

## 🏗️ 架構設計

### Provider 層級結構

```typescript
// App.tsx
<PostProvider>           // 文章數據管理
  <InteractionProvider>  // 互動統計管理
    <Router>
      // 應用內容
    </Router>
  </InteractionProvider>
</PostProvider>
```

**設計優勢：**
1. **分離關注點** - 文章數據與互動統計獨立管理
2. **獨立快取策略** - 各自管理生命週期和錯誤處理
3. **更好的錯誤隔離** - 互動統計錯誤不影響文章載入
4. **可測試性提升** - 純函數和獨立 Context 易於測試

### 事件驅動更新

**PostController 事件發射：**
```typescript
// 添加互動時
this.emit('interactionAdded', interaction)

// 移除互動時
this.emit('interactionRemoved', interactionId)
```

**InteractionProvider 事件監聽：**
```typescript
useEffect(() => {
  const handleInteractionAdded = (interaction: PostInteraction) => {
    dispatch({ type: 'ADD_INTERACTION', payload: interaction })
  }

  postController.on('interactionAdded', handleInteractionAdded)
  return () => {
    postController.off('interactionAdded', handleInteractionAdded)
  }
}, [postController])
```

**實時同步效果：**
- 用戶在文章詳情頁添加互動 → 文章列表頁統計立即更新
- 用戶刪除互動 → 所有相關統計立即更新
- 跨組件自動同步，無需手動刷新

## 🔄 數據流

### 初始化流程
```
1. App 啟動 → InteractionProvider 初始化
2. useEffect 觸發 → loadInteractions()
3. PostController.getAllInteractions() → 獲取所有互動
4. calculateStatsByPost() → 計算統計數據
5. dispatch('LOAD_SUCCESS') → 更新 Context 狀態
```

### 互動更新流程
```
1. 用戶操作 → PostController.addInteraction()
2. PostController.emit('interactionAdded') → 發射事件
3. InteractionProvider 監聽 → 自動更新統計
4. 所有使用 InteractionStats 的組件 → 自動重新渲染
```

## 🎨 UI/UX 設計

### 視覺設計原則
- **非侵入式** - 只在有互動時顯示，避免視覺雜亂
- **語義化圖標** - 使用 emoji 提升可讀性
- **響應式** - 適配不同螢幕尺寸
- **載入友好** - 優雅的 skeleton loading

### 互動反饋
- **即時更新** - 操作後立即反映統計變化
- **視覺一致** - 與現有設計系統保持一致
- **錯誤處理** - 載入失敗時的友好提示

## 📊 性能考量

### 計算優化
- **純函數設計** - `calculateStatsByPost` 可預測、可快取
- **useCallback/useMemo** - 避免不必要的重新計算
- **事件節流** - 避免過度頻繁的統計更新

### 記憶體管理
- **適當的 cleanup** - 事件監聽器正確移除
- **狀態最小化** - 只保存必要的統計數據
- **懶載入** - 統計數據按需計算

## 🧪 測試策略

### 單元測試
- `calculateStatsByPost` 純函數測試
- InteractionStats 組件渲染測試
- Context 狀態管理測試

### 整合測試
- Provider 與 Controller 事件同步測試
- 跨組件統計更新測試
- 錯誤處理流程測試

## 🚀 未來擴展

### 短期改進
- [ ] 統計數據快取優化
- [ ] 更多統計維度（按時間、按類型）
- [ ] 統計圖表視覺化

### 長期規劃
- [ ] 跨用戶統計聚合
- [ ] 統計數據匯出功能
- [ ] 機器學習驅動的統計洞察

## 📝 開發注意事項

### TypeScript 最佳實踐
- 使用 `type` 而非 `interface`
- 所有屬性標記為 `readonly`
- 明確的函數返回類型
- 避免使用 `any`

### React 最佳實踐
- 使用 `useReducer` 管理複雜狀態
- 適當使用 `useCallback` 和 `useMemo`
- 事件監聽器正確清理
- 錯誤邊界處理

### 架構最佳實踐
- 遵循分層架構原則
- 單一職責原則
- 事件驅動設計
- 可測試性優先 